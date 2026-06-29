import { Router } from "express";
import { users } from "../auth/auth.store";
import { requireAuth, requireCsrf } from "../auth/auth.middleware";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *               format: email
 *             name:
 *               type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @openapi
 * /account/name:
 *   put:
 *     tags: [Account]
 *     summary: Update the authenticated user's display name
 *     security:
 *       - cookieAuth: []
 *         csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Name updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Invalid CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/name", requireAuth, requireCsrf, (req, res) => {
  const user = users.find((u) => u.id === Number(req.user?.sub));
  if (!user) return res.status(404).json({ error: "User not found" });

  user.name = req.body.name || user.name;
  return res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export default router;
