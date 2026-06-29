import { setAuthCookies, clearAuthCookies } from "./cookie.helpers";
import { ACCESS_TOKEN_COOKIE, XSRF_COOKIE } from "./cookie.constants";
import jwt from "jsonwebtoken";

function makeMockRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe("setAuthCookies", () => {
  it("sets the access_token cookie as httpOnly", () => {
    const res = makeMockRes();
    setAuthCookies(res as any, { id: 1, email: "a@a.com" });
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
  });

  it("sets the XSRF-TOKEN cookie as non-httpOnly", () => {
    const res = makeMockRes();
    setAuthCookies(res as any, { id: 1, email: "a@a.com" });
    expect(res.cookie).toHaveBeenCalledWith(
      XSRF_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: false, sameSite: "lax" }),
    );
  });

  it("signs a JWT with the correct sub and email claims", () => {
    const res = makeMockRes();
    setAuthCookies(res as any, { id: 42, email: "user@example.com" });
    const [, tokenArg] = res.cookie.mock.calls[0] as [string, string];
    const decoded = jwt.decode(tokenArg) as jwt.JwtPayload;
    expect(decoded.sub).toBe(42);
    expect(decoded.email).toBe("user@example.com");
  });

  it("sets a random XSRF token (64 hex chars)", () => {
    const res = makeMockRes();
    setAuthCookies(res as any, { id: 1, email: "a@a.com" });
    const [, xsrfValue] = res.cookie.mock.calls[1] as [string, string];
    expect(xsrfValue).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses a 7-day maxAge for both cookies", () => {
    const res = makeMockRes();
    setAuthCookies(res as any, { id: 1, email: "a@a.com" });
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie.mock.calls.forEach(
      ([, , options]: [string, string, { maxAge: number }]) => {
        expect(options.maxAge).toBe(expectedMaxAge);
      },
    );
  });
});

describe("clearAuthCookies", () => {
  it("clears the access_token cookie", () => {
    const res = makeMockRes();
    clearAuthCookies(res as any);
    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
  });

  it("clears the XSRF-TOKEN cookie", () => {
    const res = makeMockRes();
    clearAuthCookies(res as any);
    expect(res.clearCookie).toHaveBeenCalledWith(XSRF_COOKIE);
  });
});
