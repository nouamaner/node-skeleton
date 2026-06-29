import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ALLOWED_ORIGINS } from "./config.constants";
import authRoutes from "./modules/auth/auth.routes";
import accountRoutes from "./modules/account/account.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

/**
 * @openapi
 * /stats:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Server is up
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: up
 */
app.get("/stats", (_req, res) => res.type("text").send("up"));

app.use("/auth", authRoutes);
app.use("/account", accountRoutes);

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swaggerUi = require("swagger-ui-express");
  const { swaggerSpec } = require("./swagger");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default app;
