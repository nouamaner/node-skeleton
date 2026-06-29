import request from "supertest";
import app from "../../app";
import { users } from "./auth.store";

function parseCookies(header: string | string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  const headers = Array.isArray(header) ? header : [header];
  for (const h of headers) {
    const [nameValue] = h.split(";");
    const eqIdx = nameValue.indexOf("=");
    cookies[nameValue.slice(0, eqIdx).trim()] = nameValue
      .slice(eqIdx + 1)
      .trim();
  }
  return cookies;
}

beforeEach(() => {
  users.length = 0;
});

describe("POST /auth/signup", () => {
  it("returns 201 with user data on success", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({
        email: "user@example.com",
        password: "password123",
        name: "Alice",
      });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "user@example.com",
      name: "Alice",
    });
    expect(typeof res.body.user.id).toBe("number");
  });

  it("lowercases the email", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "USER@EXAMPLE.COM", password: "password123" });
    expect(res.body.user.email).toBe("user@example.com");
  });

  it("defaults name to empty string when omitted", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    expect(res.body.user.name).toBe("");
  });

  it("sets httpOnly access_token and XSRF-TOKEN cookies", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    const cookies = parseCookies(res.headers["set-cookie"]);
    expect(cookies["access_token"]).toBeDefined();
    expect(cookies["XSRF-TOKEN"]).toBeDefined();
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email and password are required");
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must be at least 8 characters");
  });

  it("returns 409 when email already exists", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("An account with this email already exists");
  });

  it("email conflict check is case-insensitive", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "USER@EXAMPLE.COM", password: "password123" });
    expect(res.status).toBe(409);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/auth/signup")
      .send({
        email: "user@example.com",
        password: "password123",
        name: "Alice",
      });
  });

  it("returns 200 with user data on valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "user@example.com",
      name: "Alice",
    });
  });

  it("sets auth cookies on successful login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "password123" });
    const cookies = parseCookies(res.headers["set-cookie"]);
    expect(cookies["access_token"]).toBeDefined();
    expect(cookies["XSRF-TOKEN"]).toBeDefined();
  });

  it("accepts email in any case", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "USER@EXAMPLE.COM", password: "password123" });
    expect(res.status).toBe(200);
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when email is not found", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("returns 401 when password is wrong", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});

describe("POST /auth/logout", () => {
  async function signupAndGetCookies() {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    return parseCookies(res.headers["set-cookie"]);
  }

  it("returns 200 and success when authenticated with valid CSRF", async () => {
    const cookies = await signupAndGetCookies();
    const res = await request(app)
      .post("/auth/logout")
      .set(
        "Cookie",
        `access_token=${cookies["access_token"]}; XSRF-TOKEN=${cookies["XSRF-TOKEN"]}`,
      )
      .set("x-xsrf-token", cookies["XSRF-TOKEN"]);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 401 when auth cookie is absent", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(401);
  });

  it("returns 403 when CSRF header is absent", async () => {
    const cookies = await signupAndGetCookies();
    const res = await request(app)
      .post("/auth/logout")
      .set(
        "Cookie",
        `access_token=${cookies["access_token"]}; XSRF-TOKEN=${cookies["XSRF-TOKEN"]}`,
      );
    expect(res.status).toBe(403);
  });
});

describe("GET /auth/me", () => {
  it("returns user data for a valid session", async () => {
    const signupRes = await request(app)
      .post("/auth/signup")
      .send({
        email: "user@example.com",
        password: "password123",
        name: "Alice",
      });
    const cookies = parseCookies(signupRes.headers["set-cookie"]);

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `access_token=${cookies["access_token"]}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "user@example.com",
      name: "Alice",
    });
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists in the store", async () => {
    const signupRes = await request(app)
      .post("/auth/signup")
      .send({ email: "user@example.com", password: "password123" });
    const cookies = parseCookies(signupRes.headers["set-cookie"]);

    users.length = 0;

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `access_token=${cookies["access_token"]}`);
    expect(res.status).toBe(404);
  });
});
