import { IpcMain, IpcRenderer, WebContents } from 'electron';

/**
 * naive detection to renderer process without checking globals.
 */
const isRendererEndpoint = (endpoint: IpcMain | IpcRenderer): endpoint is IpcRenderer => !!endpoint['send'];

/**
 * Electron IPC doesn't support transfer value between processes,
 * Check if param delivers any transferable and raise error.
 *
 * This means `Comlink.transfer` is not available via electron endpoint adapter.
 */
const validateTransferable = (value: Array<any> | undefined) => {
  if (Array.isArray(value) && value.length > 0) {
    throw new Error('Unsupported: cannot transfer value over ipc');
  }
};

/**
 * Creates `Comlink.Endpoint` object.
 *
 * @param endpoint
 * @param channelPostfix
 * @param target
 */
const createEndpoint = (endpoint: IpcMain | IpcRenderer, channelPostfix: string = '', target?: WebContents) => {
  // hold eventlistener functions
  const listeners = new WeakMap();
  // Queue renderer process proxy object message request's sender to reply back main process response.
  const webContentesSenders: Array<any> = [];
  // Prefix to IPC messageChannel.
  const channelNamePrefix = `__comlink_electron_ipc_channel_`;
  // channel name comlink uses to register its event listene. createEndpoint overrides this channelname via compose its own prefix / postfix.
  let comlinkChannelIdentifier: String | null = null;

  const getChannel = () => {
    if (!comlinkChannelIdentifier) {
      throw new Error(`createEndpoint: channelIdentifier is missing from comlink`);
    }
    return `${channelNamePrefix}${comlinkChannelIdentifier}${channelPostfix}`;
  };

  // postMessage implementation based on running context (if it's main process or renderer process)
  const postMessage = isRendererEndpoint(endpoint)
    ? (message: any, transfer: Array<any> | undefined) => {
        validateTransferable(transfer);
        //if postMessage executed under renderer process, directly ask to main process endpoint via IpcRenderer.send
        endpoint.send(getChannel(), message);
      }
    : (message: any, transfer: Array<any> | undefined) => {
        validateTransferable(transfer);

        //if postMessage executed under main process
        // - if target WebContents specified, consider renderer process exposed object to main process. send message via target webContents.send()
        // - if target is not specified, consider main process exposed object to renderer process, use `webContentesSenders` to reply back message.
        if (target) {
          target.send(getChannel(), message);
        } else {
          webContentesSenders.shift()!.sender.webContents.send(getChannel(), message); // If we don't have sender it means something went wrong
        }
      };

  return {
    senders: webContentesSenders,
    getChannel,
    addEventListener: (channel: any, originalHandler: any) => {
      // when comlink registers eventlistener, store channel identifier
      comlinkChannelIdentifier = channel;

      // custom eventhandler wraps original listener function from comlink.
      const handler = (evt: Electron.Event, data: any) => {
        // queue sender webcontents to reply message if in main process, also wraps electron's eventhandler args to conform comlink's handler args.
        if (!target && !isRendererEndpoint(endpoint)) {
          webContentesSenders.push(evt);
        }
        return (originalHandler as any)({ ...evt, data });
      };

      if (listeners.has(originalHandler) === false) {
        listeners.set(originalHandler, handler);
      }

      endpoint.on(getChannel(), listeners.get(originalHandler));
    },
    removeEventListener: (channel: any, handler: any) => {
      if (channel !== comlinkChannelIdentifier) {
        throw new Error(
          `createEndpoint: unexpected error, channel identifier does not match '${channel}':'${comlinkChannelIdentifier}'`
        );
      }
      endpoint.removeListener(getChannel(), listeners.get(handler));
    },
    postMessage
  };
};

export { createEndpoint };
