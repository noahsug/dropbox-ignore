import { execSync } from 'child_process';
import yargs from 'yargs';
import os from 'os';
import chalk from 'chalk';

const options = yargs(process.argv.slice(2))
  .command('$0 [rootDir]', `tell Dropbox to ignore node_module files`, (cmd) => {
    cmd.positional('rootDir', {
      describe: 'Dropbox root directory',
      default: '~/Dropbox',
      type: 'string',
    });
  })
  .options({
    dryrun: {
      alias: 'D',
      type: 'boolean',
      describe: 'log without making changes',
    },
  })
  .help().argv;

const rootDir = options.rootDir.replace('~', os.homedir());

function getNodeModuleDirs() {
  const files = String(
    execSync(`rg --files -g '**/node_modules/**' ${rootDir} -u`, {
      maxBuffer: 1024 * 1024 * 1024, // 1 gig
    }),
  )
    .split('\n')
    .filter(Boolean);

  const nodeModuleDirsWithDupes = files.map((file) => {
    return file.replace(/(\b|\/)node_modules(\b|\/).*/, '$1node_modules');
  });
  return [...new Set(nodeModuleDirsWithDupes)];
}

function ignorePath(filepath) {
  execSync(`xattr -w com.dropbox.ignored 1 ${filepath}`);
}

(() => {
  if (options.dryrun) {
    console.log(chalk.yellow('Dry run, no changes will be made'));
  }

  console.log('Finding node_module directories...');
  const nodeModuleDirs = getNodeModuleDirs();

  nodeModuleDirs.forEach((nodeModuleDir) => {
    console.log(chalk.blue(nodeModuleDir));
    if (!options.dryrun) {
      ignorePath(nodeModuleDir);
    }
  });

  if (options.dryrun) {
    console.log(`Found ${nodeModuleDirs.length} files to ignore.`);
  } else {
    console.log(`Ignored ${nodeModuleDirs.length} files.`);
  }
})();
