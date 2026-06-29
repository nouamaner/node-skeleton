import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { JWT_SECRET, COOKIE_SECURE } from "../config.constants";
import { ACCESS_TOKEN_COOKIE, XSRF_COOKIE } from "./cookie.constants";

interface TokenUser {
  id: number;
  email: string;
}

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res: Response, user: TokenUser): void {
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  res.cookie(XSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE);
  res.clearCookie(XSRF_COOKIE);
}
