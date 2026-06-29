describe('server bootstrap', () => {
  const mockListen = jest.fn();
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('starts the server and logs the port when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'test-secret-for-jest';

    jest.isolateModules(() => {
      jest.doMock('dotenv/config', () => ({}));
      jest.doMock('./app', () => ({
        __esModule: true,
        default: {
          listen: mockListen.mockImplementation((_port: number, cb: () => void) => {
            cb();
            return {};
          }),
        },
      }));
      require('./server');
    });

    expect(mockListen).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Auth server running')
    );
  });

  it('logs an error and exits with code 1 when JWT_SECRET is missing', () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    jest.isolateModules(() => {
      jest.doMock('dotenv/config', () => ({}));
      jest.doMock('./app', () => ({ __esModule: true, default: { listen: mockListen } }));
      require('./server');
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Missing JWT_SECRET in .env');

    process.env.JWT_SECRET = saved;
  });
});
