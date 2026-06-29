import request from "supertest";
import app from "../../app";
import { users } from "../auth/auth.store";

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

describe("PUT /account/name", () => {
  let authCookies: Record<string, string>;

  beforeEach(async () => {
    users.length = 0;
    const res = await request(app).post("/auth/signup").send({
      email: "user@example.com",
      password: "password123",
      name: "Old Name",
    });
    authCookies = parseCookies(res.headers["set-cookie"]);
  });

  it("updates the user name and returns updated user", async () => {
    const res = await request(app)
      .put("/account/name")
      .set(
        "Cookie",
        `access_token=${authCookies["access_token"]}; XSRF-TOKEN=${authCookies["XSRF-TOKEN"]}`,
      )
      .set("x-xsrf-token", authCookies["XSRF-TOKEN"])
      .send({ name: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("New Name");
    expect(res.body.user.email).toBe("user@example.com");
  });

  it("keeps the existing name when no name is provided in body", async () => {
    const res = await request(app)
      .put("/account/name")
      .set(
        "Cookie",
        `access_token=${authCookies["access_token"]}; XSRF-TOKEN=${authCookies["XSRF-TOKEN"]}`,
      )
      .set("x-xsrf-token", authCookies["XSRF-TOKEN"])
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Old Name");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .put("/account/name")
      .send({ name: "New Name" });
    expect(res.status).toBe(401);
  });

  it("returns 403 when CSRF header is absent", async () => {
    const res = await request(app)
      .put("/account/name")
      .set("Cookie", `access_token=${authCookies["access_token"]}`)
      .send({ name: "New Name" });
    expect(res.status).toBe(403);
  });

  it("returns 404 when the user no longer exists in the store", async () => {
    users.length = 0;
    const res = await request(app)
      .put("/account/name")
      .set(
        "Cookie",
        `access_token=${authCookies["access_token"]}; XSRF-TOKEN=${authCookies["XSRF-TOKEN"]}`,
      )
      .set("x-xsrf-token", authCookies["XSRF-TOKEN"])
      .send({ name: "New Name" });
    expect(res.status).toBe(404);
  });
});
