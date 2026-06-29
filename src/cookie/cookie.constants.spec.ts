import { ACCESS_TOKEN_COOKIE, XSRF_COOKIE, XSRF_HEADER } from './cookie.constants';

describe('cookie.constants', () => {
  it('exports ACCESS_TOKEN_COOKIE as "access_token"', () => {
    expect(ACCESS_TOKEN_COOKIE).toBe('access_token');
  });

  it('exports XSRF_COOKIE as "XSRF-TOKEN"', () => {
    expect(XSRF_COOKIE).toBe('XSRF-TOKEN');
  });

  it('exports XSRF_HEADER as "x-xsrf-token"', () => {
    expect(XSRF_HEADER).toBe('x-xsrf-token');
  });
});
