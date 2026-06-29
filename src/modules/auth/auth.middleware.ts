import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../config.constants";
import {
  ACCESS_TOKEN_COOKIE,
  XSRF_COOKIE,
  XSRF_HEADER,
} from "../../cookie/cookie.constants";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies[ACCESS_TOKEN_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieToken = req.cookies[XSRF_COOKIE];
  const headerToken = req.headers[XSRF_HEADER];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }
  next();
}
