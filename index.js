import { execSync } from 'child_process';
import yargs from 'yargs';
import os from 'os';
import path from 'path';
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

function ignorePath(filepath) {
  execSync(`xattr -w com.dropbox.ignored 1 ${filepath}`);
}

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

(() => {
  if (options.dryrun) console.log('DRY RUN');

  console.log('finding node_module directories...');
  const nodeModuleDirs = getNodeModuleDirs();

  console.log(`telling Dropbox to ignore ${nodeModuleDirs.length} files:`);
  nodeModuleDirs.forEach((nodeModuleDir) => {
    console.log(nodeModuleDir);
    if (!options.dryrun) {
      ignorePath(nodeModuleDir);
    }
  });
})();

// NOTE: I tried reading files ignored by git, but it includes files not yet checked in
//
// function findGitIgnoreFiles() {
//   return String(execSync(`rg --files -g '.gitignore' ${rootDir}`)).split('\n');
// }
//
// function getIgnoredFiles(gitignoreFile) {
//   const gitRoot = path.dirname(gitignoreFile);
//   try {
//     // > output:
//     // ?? .prettierrc
//     // ?? node_modules
//     return String(execSync(`git status --ignored --porcelain`))
//       .split('\n')
//       .map((line) => line.split(' ')[1])
//       .map((relativeFile) => path.join(gitRoot, relativeFile));
//   } catch (e) {
//     console.error('Failed to get ignored files from', gitRoot);
//     console.error(chalk.gray(e));
//   }
// }
//
//  const gitignoreFiles = findGitIgnoreFiles();
//  console.log(`found ${gitignoreFiles.length} .gitignore files`);
//
//  const ignoredFilesWithDups = gitignoreFiles.flatMap((gitignoreFile) => {
//    return getIgnoredFiles(gitignoreFile);
//  });
//  const ignoredFiles = [...new Set(ignoredFilesWithDups)];
