export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim());
