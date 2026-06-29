import request from "supertest";
import app from "./app";
import { users } from "./modules/auth/auth.store";

beforeEach(() => {
  users.length = 0;
});

describe("app", () => {
  it("routes POST /auth/signup", async () => {
    const res = await request(app).post("/auth/signup").send({});
    expect(res.status).not.toBe(404);
  });

  it("routes POST /auth/login", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).not.toBe(404);
  });

  it("routes PUT /account/name", async () => {
    const res = await request(app).put("/account/name").send({});
    expect(res.status).not.toBe(404);
  });

  it("parses JSON request bodies", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@a.com", password: "password123" }));
    expect(res.status).toBe(201);
  });

  it("returns 404 for undefined routes", async () => {
    const res = await request(app).get("/not-a-real-route");
    expect(res.status).toBe(404);
  });
});
