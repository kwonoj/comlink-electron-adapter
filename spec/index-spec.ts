import { createEndpoint } from '../src/createEndpoint';
import { mainProcObjectEndpoint, rendererProcObjectEndpoint } from '../src/index';

jest.mock('../src/createEndpoint', () => ({
  createEndpoint: jest.fn()
}));

describe('index', () => {
  it('should export mainProcObjectEndpoint', () => {
    expect(mainProcObjectEndpoint).toEqual(createEndpoint);
  });

  it('should export rendererProcObjectEndpoint', () => {
    const mockEndpoint: any = {};
    const mockTarget: any = {};
    rendererProcObjectEndpoint(mockEndpoint, mockTarget);

    expect(createEndpoint).toBeCalledWith(mockEndpoint, '_reverse', mockTarget);
  });
});
