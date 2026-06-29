describe('config.constants', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('exports PORT from env', () => {
    process.env.PORT = '4000';
    const { PORT } = require('./config.constants');
    expect(PORT).toBe('4000');
  });

  it('defaults PORT to 3000', () => {
    delete process.env.PORT;
    const { PORT } = require('./config.constants');
    expect(PORT).toBe(3000);
  });

  it('exports JWT_SECRET from env', () => {
    process.env.JWT_SECRET = 'my-secret';
    const { JWT_SECRET } = require('./config.constants');
    expect(JWT_SECRET).toBe('my-secret');
  });

  it('sets COOKIE_SECURE to true when env is "true"', () => {
    process.env.COOKIE_SECURE = 'true';
    const { COOKIE_SECURE } = require('./config.constants');
    expect(COOKIE_SECURE).toBe(true);
  });

  it('sets COOKIE_SECURE to false for any other value', () => {
    process.env.COOKIE_SECURE = 'false';
    const { COOKIE_SECURE } = require('./config.constants');
    expect(COOKIE_SECURE).toBe(false);
  });

  it('splits CORS_ORIGINS into an array', () => {
    process.env.CORS_ORIGINS = 'http://localhost:4200, http://example.com';
    const { ALLOWED_ORIGINS } = require('./config.constants');
    expect(ALLOWED_ORIGINS).toEqual(['http://localhost:4200', 'http://example.com']);
  });

  it('defaults ALLOWED_ORIGINS to [""] when CORS_ORIGINS is unset', () => {
    delete process.env.CORS_ORIGINS;
    const { ALLOWED_ORIGINS } = require('./config.constants');
    expect(ALLOWED_ORIGINS).toEqual(['']);
  });
});
