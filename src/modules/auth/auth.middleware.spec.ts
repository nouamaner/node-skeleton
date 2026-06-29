import { requireAuth, requireCsrf } from "./auth.middleware";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_COOKIE,
  XSRF_COOKIE,
  XSRF_HEADER,
} from "../../cookie/cookie.constants";

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("requireAuth", () => {
  let req: any, res: ReturnType<typeof makeRes>, next: jest.Mock;

  beforeEach(() => {
    req = { cookies: {} };
    res = makeRes();
    next = jest.fn();
  });

  it("responds 401 when no token cookie is present", () => {
    requireAuth(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 when the token is invalid", () => {
    req.cookies[ACCESS_TOKEN_COOKIE] = "not-a-valid-jwt";
    requireAuth(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired session",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and attaches user when token is valid", () => {
    const token = jwt.sign(
      { sub: 7, email: "u@u.com" },
      "test-secret-for-jest",
    );
    req.cookies[ACCESS_TOKEN_COOKIE] = token;
    requireAuth(req, res as any, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ sub: 7, email: "u@u.com" });
  });
});

describe("requireCsrf", () => {
  let req: any, res: ReturnType<typeof makeRes>, next: jest.Mock;

  beforeEach(() => {
    req = { cookies: {}, headers: {} };
    res = makeRes();
    next = jest.fn();
  });

  it("responds 403 when CSRF cookie is absent", () => {
    requireCsrf(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid CSRF token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 403 when CSRF header is absent", () => {
    req.cookies[XSRF_COOKIE] = "abc";
    requireCsrf(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("responds 403 when cookie and header do not match", () => {
    req.cookies[XSRF_COOKIE] = "abc";
    req.headers[XSRF_HEADER] = "xyz";
    requireCsrf(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next when cookie and header match", () => {
    req.cookies[XSRF_COOKIE] = "my-csrf-token";
    req.headers[XSRF_HEADER] = "my-csrf-token";
    requireCsrf(req, res as any, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
