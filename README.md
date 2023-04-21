# Dropbox Ignore

> Ignore generated files in Dropbox (e.g. node_modules), freeing up space

## Installation (macOS only)

1. Install ripgrep

https://github.com/BurntSushi/ripgrep#installation

2. Install dropbox-ignore

```sh
git clone git@github.com:noahsug/dropbox-ignore.git
cd dropbox-ignore
yarn install
```

## Usage

```sh
cd dropbox-ignore
yarn start # then follow the prompts
```

Note: dropbox-ignore assumes your Dropbox path is `~/Dropbox`

## Troubleshooting

### `yarn: command not found`

Install yarn here: https://classic.yarnpkg.com/lang/en/docs/install/

### Incompatible node version

If `yarn install` fails with

```sh
The engine "node" is incompatible with this module. Expected version "^14.17.0 || ^16.13.0 || >=18.0.0". Got "16.10.0"
```

then you need to update your node version.

1. install nvm: https://github.com/nvm-sh/nvm#installing-and-updating
2. use the latest version:

```sh
nvm install $(cat .nvmrc)
nvm use
```
