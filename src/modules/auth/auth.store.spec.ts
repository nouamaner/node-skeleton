describe('auth.store', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports an empty users array on fresh load', () => {
    const { users } = require('./auth.store');
    expect(Array.isArray(users)).toBe(true);
    expect(users).toHaveLength(0);
  });

  it('nextUserId returns incrementing integers', () => {
    const { nextUserId } = require('./auth.store');
    const first = nextUserId();
    const second = nextUserId();
    expect(typeof first).toBe('number');
    expect(second).toBe(first + 1);
  });

  it('users array is mutable and retains pushed items', () => {
    const { users } = require('./auth.store');
    users.push({ id: 1, email: 'a@a.com', passwordHash: 'h', name: 'A' });
    expect(users).toHaveLength(1);
  });
});
