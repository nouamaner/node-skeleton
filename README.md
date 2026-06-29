# node-skeleton

A minimal Node.js + Express auth server with httpOnly JWT cookies and CSRF protection, written in TypeScript.

## Setup

```bash
cp .env.example .env   # fill in your values
npm install
```

**.env variables**

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret used to sign JWTs (required) |
| `PORT` | Port to listen on (default: `3000`) |
| `COOKIE_SECURE` | Set to `true` in production (HTTPS only) |
| `CORS_ORIGINS` | Comma-separated list of allowed origins |

## Commands

### `npm test`

Runs the full test suite with Jest.

```bash
npm test
```

### `npm run test:coverage`

Runs tests and prints a coverage report. The suite enforces a **95% global threshold** across statements, branches, functions, and lines — the command exits non-zero if coverage drops below that.

```bash
npm run test:coverage
```

- **Framework** → Jest + ts-jest
- **HTTP assertions** → supertest
- **Config** → `package.json` › `jest`
- **TypeScript config for tests** → `tsconfig.test.json` (overrides `module` to `CommonJS`)
- **Test files** → `src/**/*.spec.ts` (one per source file)

### `npm run dev`

Starts the server with `tsx watch`. TypeScript is executed directly — no build step required. The server restarts automatically on any file change under `src/`.

```bash
npm run dev
```

- **Command** → `package.json` › `scripts.dev`
- **Entry point** → `src/server.ts`
- **Watched directory** → `src/` (all `.ts` files under it)

### `npm run build`

Compiles TypeScript to JavaScript into the `dist/` folder via `tsc`.

```bash
npm run build
```

- **Command** → `package.json` › `scripts.build`
- **Compiler options** (target, module, strict, …) → `tsconfig.json`
- **Input directory** → `tsconfig.json` › `include` (default: `src/`)
- **Output directory** → `tsconfig.json` › `compilerOptions.outDir` (default: `dist/`)

### `npm start`

Runs the compiled output from `dist/`. Run `npm run build` first.

```bash
npm run build && npm start
```

- **Command** → `package.json` › `scripts.start`
- **Entry file** → `dist/server.js` (mirrors `src/server.ts` after build)
- **Output path** → `tsconfig.json` › `compilerOptions.outDir`

## Project structure

```
src/
├── server.ts                  # entry point — loads env, validates config, starts the HTTP server
├── app.ts                     # creates the Express app, registers global middleware and routes
├── config.constants.ts        # env-derived constants (PORT, JWT_SECRET, COOKIE_SECURE, …)
├── cookie.constants.ts        # cookie and header name literals (ACCESS_TOKEN_COOKIE, XSRF_*)
├── cookie.helpers.ts          # setAuthCookies / clearAuthCookies
├── auth.store.ts              # in-memory user store and User type (replace with a real DB)
├── auth.middleware.ts         # requireAuth and requireCsrf Express middleware
├── auth.routes.ts             # /auth/signup  /auth/login  /auth/logout  /auth/me
├── account.routes.ts          # /account/name
├── test-setup.ts              # Jest setup — seeds env vars before modules load
└── *.spec.ts                  # unit / integration tests (one file per source file)
```

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | — | Create an account |
| `POST` | `/auth/login` | — | Log in |
| `POST` | `/auth/logout` | cookie + CSRF | Log out |
| `GET` | `/auth/me` | cookie | Current user |
| `PUT` | `/account/name` | cookie + CSRF | Update display name |

Authentication uses an **httpOnly JWT cookie** so the token is never readable by JavaScript. CSRF protection uses the **double-submit cookie** pattern: the server sets a readable `XSRF-TOKEN` cookie and expects clients to echo it back as an `x-xsrf-token` header on every state-changing request.
