import { Endpoint } from 'comlink';
import { IpcMain, IpcRenderer, WebContents } from 'electron';
import { createEndpoint } from './createEndpoint';

/**
 * Creates endpoint to expose main process side object to renderer process.
 *
 * It is expected to both process (main, renderer) creates endpoint via this function when expose / access main process object in renderer process.
 */
const mainProcObjectEndpoint: (endpoint: IpcMain | IpcRenderer) => Endpoint = createEndpoint;

/**
 * Creates endpoint to expose renderer process side object to main process.
 *
 * It is expected to both process (main, renderer) creates endpoint via this function when expose / access renderer process object in main process.
 * Main process should specify which renderer process to use create proxy object against.
 *
 * @param endpoint
 * @param target
 */
const rendererProcObjectEndpoint: {
  (endpoint: IpcRenderer): Endpoint;
  (endpoint: IpcMain, target: WebContents): Endpoint;
  (endpoint: IpcMain | IpcRenderer, target?: WebContents): Endpoint;
} = (endpoint: IpcMain | IpcRenderer, target?: WebContents) => createEndpoint(endpoint, '_reverse', target);

export { mainProcObjectEndpoint, rendererProcObjectEndpoint };
