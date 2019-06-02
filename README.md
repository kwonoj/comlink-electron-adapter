[![Build Status](https://travis-ci.com/kwonoj/comlink-electron-adapter.svg)](https://travis-ci.com/kwonoj/comlink-electron-adapter)
[![Build status](https://ci.appveyor.com/api/projects/status/51vn1y7yygjfcl98/branch/master?svg=true)](https://ci.appveyor.com/project/kwonoj/comlink-electron-adapter/branch/master)
[![codecov](https://codecov.io/gh/kwonoj/comlink-electron-adapter/branch/master/graph/badge.svg)](https://codecov.io/gh/kwonoj/comlink-electron-adapter)
[![npm](https://img.shields.io/npm/v/comlink-electron-adapter.svg)](https://www.npmjs.com/package/comlink-electron-adapter)
[![node](https://img.shields.io/badge/electron-=>5.0-blue.svg?style=flat)](https://www.npmjs.com/package/comlink-electron-adapter)

# Comlink-electron-adapter

[Comlink](https://github.com/GoogleChromeLabs/comlink) provides way to interface between worker-like endpoint via ES proxy. This module provides custom endpoints around Electron's IPC (https://electronjs.org/docs/api/ipc-main), allow to create proxy across Electron's processes.

# Install

This has a peer dependencies of `comlink@4`, which will have to be installed as well

```sh
npm install comlink-electron-adapter
```

# Usage

There are separate endpoint creation method per object's origin.

## Expose main process's object to renderer project

```
// main process
import { ipcMain } from 'electron';
import { expose } from 'comlink';
import { mainProcObjectEndpoint } from 'comlink-electron-adapter';

const mainProcessObject = {...};
expose(mainProcessObject, mainProcObjectEndpoint(ipcMain));

// renderer process
import { wrap } from 'comlink';
import { ipcRenderer } from 'electron';

// `proxied` is proxy object to `mainProcessObject` in main process
const proxied = wrap(mainProcObjectEndpoint(ipcRenderer));
```

## Expose renderer process's object to main process

It is also possible to access renderer process's object in main process.

```
// renderer process
import { expose } from 'comlink';
import { ipcRenderer } from 'electron';
import { rendererProcObjectEndpoint } from 'comlink-electron-adapter';

const rendererProcessObject = {...};
expose(rendererProcessObject, rendererProcObjectEndpoint(ipcRenderer));

// main process
import { wrap } from 'comlink';
import { ipcMain } from 'electron';
import { rendererProcObjectEndpoint } from 'comlink-electron-adapter';

const rendererProcessWindow = new BrowserWindow();
rendererProcessWindow.loadFile('.../renderer.js');

const proxied = wrap(requestRendererProcessEndpoint(ipcMain, rendererProcessWindow.webContents));
```

Unlike renderer process main process does not aware target renderer process to send message and target webContents should be specified. Also main process should wait call proxy object until renderer process expose its object.

# Note

Due to Electron IPC's design `comlink-electron-adapter` do not support `transferable`. Using `Comlink.transfer` will raise not supported exception.

# Building / Testing

Few npm scripts are supported for build / test code.

- `build`: Transpiles code to ES5 commonjs to `dist`.
- `test`: Run test cases.
- `lint`: Run lint over all codebases
- `lint:staged`: Run lint only for staged changes. This'll be executed automatically with precommit hook.
- `commit`: Commit wizard to write commit message

# License

[MIT](https://github.com/kwonoj/comlink-electron-adapter/blob/master/LICENSE)