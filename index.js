import { execSync } from 'child_process';
import yargs from 'yargs';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';

const options = yargs(process.argv.slice(2))
  .command('$0 [rootDir]', `tell Dropbox to ignore node_module files`, (cmd) => {
    cmd.positional('rootDir', {
      describe: 'Dropbox root directory',
      default: '~/Dropbox',
      type: 'string',
    });
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

  // "my-project/node_modules/jest/package.json" -> "my-project/node_modules"
  const nodeModuleDirsWithDupes = files.map((file) => {
    return file.replace(/(\b|\/)node_modules(\b|\/).*/, '$1node_modules');
  });
  return [...new Set(nodeModuleDirsWithDupes)];
}

function ignorePath(filepath) {
  execSync(`xattr -w com.dropbox.ignored 1 ${filepath}`);
}

function isAlreadyIgnored(filepath) {
  const result = String(execSync(`xattr -l ${filepath}`));
  return result.includes('com.dropbox.ignored: 1');
}

(async () => {
  console.log('Finding node_module directories in', chalk.blue(options.rootDir), '...');
  const nodeModuleDirs = getNodeModuleDirs();

  const ignoredDirs = new Set(nodeModuleDirs.filter(isAlreadyIgnored));
  const dirsToIgnore = nodeModuleDirs.filter((dir) => !ignoredDirs.has(dir));

  if (ignoredDirs.size > 0) {
    console.log('Found', ignoredDirs.size, 'already ignored file(s):');
    for (const dir of ignoredDirs) {
      console.log(chalk.blue(dir));
    }
  }

  if (dirsToIgnore.length > 0) {
    console.log('\nFound', dirsToIgnore.length, 'file(s) to ignore:');
    for (const dir of dirsToIgnore) {
      console.log(chalk.blue(dir));
    }

    console.log('');
    const { shouldIgnoreFiles } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldIgnoreFiles',
        message: `Ignore these ${dirsToIgnore.length} file(s)?`,
      },
    ]);

    if (shouldIgnoreFiles) {
      for (const dir of dirsToIgnore) {
        ignorePath(dir);
      }
      console.log(`Ignored ${dirsToIgnore.length} file(s).`);
    }
  }
})();
