import childProcess, { spawn } from 'child_process';
import util from 'util';
import yargs from 'yargs';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

const exec = util.promisify(childProcess.exec);

const options = yargs(process.argv.slice(2))
  .command('$0 [rootDir]', `tell Dropbox to ignore node_module files`, (cmd) => {
    cmd.positional('rootDir', {
      describe: 'Dropbox root directory',
      default: '~/Dropbox',
      type: 'string',
    });
  })
  .help().argv;

const cwd = options.rootDir.replace('~', os.homedir());

async function getNodeModuleDirs(onProgress) {
  const rg = spawn(
    'rg',
    [
      '--files',
      '-g',
      '**/node_modules/*/package.json',
      // improve performance by ignoring nested node_module dirs
      '-g',
      '!**/node_modules/**/node_modules/**',
      '-u',
    ],
    {
      cwd,
      maxBuffer: 1024 * 1024 * 1024, // 1 gig
    },
  );

  let data = '';
  let lineCount = 0;
  rg.stdout.on('data', (newData) => {
    data += newData;

    const newLines = (String(newData).match(/\n/g) || '').length;
    lineCount += newLines;
    onProgress(lineCount);
  });

  await new Promise((resolve) => rg.on('close', () => resolve()));
  const files = data.split('\n').filter(Boolean);

  // convert the full file path to just the node_module directory
  // e.g. `my-project/node_modules/jest/package.json` -> `my-project/node_modules`
  const nodeModuleDirs = files.map((file) => {
    return file.replace(/(\b|\/)node_modules(\b|\/).*/, '$1node_modules');
  });
  return [...new Set(nodeModuleDirs)];
}

async function isAlreadyIgnored(filepath) {
  const { stdout } = await exec(`xattr -l ${filepath}`, { cwd });
  return stdout.includes('com.dropbox.ignored: 1');
}

async function ignorePath(filepath) {
  await exec(`xattr -w com.dropbox.ignored 1 ${filepath}`, { cwd });
}

(async () => {
  const spinner = ora().start();

  const findingNodeModulesMsg = `Finding node_module directories in ${chalk.blue(options.rootDir)}`;
  spinner.text = findingNodeModulesMsg;
  const nodeModuleDirs = await getNodeModuleDirs((numFiles) => {
    spinner.text = `${findingNodeModulesMsg} (${numFiles} files searched)`;
  });

  const dirsToIgnore = [];
  const alreadyIgnoredDirs = [];
  for (const nodeModuleDir of nodeModuleDirs) {
    if (await isAlreadyIgnored(nodeModuleDir)) {
      alreadyIgnoredDirs.push(nodeModuleDir);
    } else {
      dirsToIgnore.push(nodeModuleDir);
    }
  }

  if (alreadyIgnoredDirs.length > 0) {
    spinner.succeed(`Found ${alreadyIgnoredDirs.length} already ignored directories:`);
    for (const dir of alreadyIgnoredDirs) {
      console.log(chalk.blue(`   ${dir}`));
    }
  }

  if (dirsToIgnore.length > 0) {
    spinner.succeed(`Found ${dirsToIgnore.length} directories to ignore:`);
    for (const dir of dirsToIgnore) {
      console.log(chalk.blue(`   ${dir}`));
    }

    const { shouldIgnoreFiles } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldIgnoreFiles',
        message: `Ignore ${dirsToIgnore.length} directories?`,
      },
    ]);
    if (shouldIgnoreFiles) {
      for (const dir of dirsToIgnore) {
        await ignorePath(dir);
        spinner.text = `ignored ${chalk.blue(dir)}`;
      }
      spinner.succeed(`Ignored ${dirsToIgnore.length} directories.`);
    }
  }
})();
