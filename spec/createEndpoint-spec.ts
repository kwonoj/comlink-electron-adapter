import { createEndpoint } from '../src/createEndpoint';

const getIpcMainMock = () =>
  ({
    on: jest.fn(),
    removeListener: jest.fn()
  } as any);

const getIpcRendererMock = () =>
  ({
    on: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn()
  } as any);

describe('createEndpoint', () => {
  it.each([['main', getIpcMainMock()], ['renderer', getIpcRendererMock()]])(
    'should create endpoint in %s process',
    (_name: string, mock: any) => {
      const endpoint = createEndpoint(mock);
      expect(endpoint).toBeDefined();
    }
  );

  it.each([['main', getIpcMainMock()], ['renderer', getIpcRendererMock()]])(
    'should add event listener in %s process',
    (_name: string, mock: any) => {
      const endpoint = createEndpoint(mock);

      endpoint.addEventListener('boo', jest.fn());

      const channel = `__comlink_electron_ipc_channel_boo`;
      expect(mock.on).toBeCalledWith(channel, jasmine.any(Function));
    }
  );

  it(`should reply message when target is not specified in main process`, () => {
    const ipcMock = getIpcMainMock();
    const endpoint = createEndpoint(ipcMock);

    endpoint.addEventListener('boo', jest.fn());
    const handler = (ipcMock.on as jest.Mock).mock.calls[0][1];

    const eventMock = {
      reply: jest.fn()
    };
    handler(eventMock);
    endpoint.postMessage('boo', undefined);

    expect(eventMock.reply).toBeCalled();
  });

  it(`should send message to target in main process`, () => {
    const ipcMock = getIpcMainMock();
    const targetMock = {
      send: jest.fn()
    };
    const endpoint = createEndpoint(ipcMock, '', targetMock as any);

    endpoint.addEventListener('boo', jest.fn());
    const handler = (ipcMock.on as jest.Mock).mock.calls[0][1];

    handler(jest.fn());
    endpoint.postMessage('boo', undefined);

    expect(targetMock.send).toBeCalled();
  });

  it('should send message to main process on renderer process', () => {
    const ipcMock = getIpcRendererMock();
    const endpoint = createEndpoint(ipcMock);

    endpoint.addEventListener('boo', jest.fn());
    const handler = (ipcMock.on as jest.Mock).mock.calls[0][1];

    handler(jest.fn());
    endpoint.postMessage('boo', undefined);

    expect(ipcMock.send).toBeCalled();
  });

  it.each([['main', getIpcMainMock()], ['renderer', getIpcRendererMock()]])(
    'should not allow transferable on in %s process',
    (_name: string, mock: any) => {
      const endpoint = createEndpoint(mock);

      endpoint.addEventListener('boo', jest.fn());
      const handler = (mock.on as jest.Mock).mock.calls[0][1];

      handler(jest.fn());
      expect(() => endpoint.postMessage('boo', ['a'])).toThrow();
    }
  );

  it.each([['main', getIpcMainMock()], ['renderer', getIpcRendererMock()]])(
    'should remove event listener in %s process',
    (_name: string, mock: any) => {
      const endpoint = createEndpoint(mock);

      const handler = jest.fn();
      endpoint.addEventListener('boo', handler);
      endpoint.removeEventListener('boo', handler);

      const addedHandler = (mock.on as jest.Mock).mock.calls[0][1];
      const removedHandler = (mock.removeListener as jest.Mock).mock.calls[0][1];

      expect(addedHandler).toEqual(removedHandler);
    }
  );

  it.each([['main', getIpcMainMock()], ['renderer', getIpcRendererMock()]])(
    'should raise error to removeListener without setting channel in %s process',
    (_name: string, mock: any) => {
      const endpoint = createEndpoint(mock);

      expect(() => endpoint.removeEventListener('boo', jest.fn())).toThrow();
    }
  );
});
