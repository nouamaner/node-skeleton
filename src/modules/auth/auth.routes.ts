import { Router } from "express";
import bcrypt from "bcryptjs";
import { users, nextUserId } from "./auth.store";
import { setAuthCookies, clearAuthCookies } from "../../cookie/cookie.helpers";
import { requireAuth, requireCsrf } from "./auth.middleware";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }
  if (users.find((u) => u.email === email.toLowerCase())) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId(),
    email: email.toLowerCase(),
    passwordHash,
    name: name || "",
  };
  users.push(user);

  setAuthCookies(res, user);
  return res
    .status(201)
    .json({ user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find((u) => u.email === email.toLowerCase());
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ error: "Invalid email or password" });

  setAuthCookies(res, user);
  return res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/logout", requireAuth, requireCsrf, (_req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = users.find((u) => u.id === Number(req.user?.sub));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export default router;
