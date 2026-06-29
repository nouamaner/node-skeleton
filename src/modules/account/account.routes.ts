import { Router } from "express";
import { users } from "../auth/auth.store";
import { requireAuth, requireCsrf } from "../auth/auth.middleware";

const router = Router();

router.put("/name", requireAuth, requireCsrf, (req, res) => {
  const user = users.find((u) => u.id === Number(req.user?.sub));
  if (!user) return res.status(404).json({ error: "User not found" });

  user.name = req.body.name || user.name;
  return res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export default router;
