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

Preview changes

```sh
yarn preview
```

Tell Dropbox to ignore generated files

```sh
yarn start
```

Note: this assumes your Dropbox path is `~/Dropbox`
