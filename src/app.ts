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

app.get("/stats", (_req, res) => res.type("text").send("up"));

app.use("/auth", authRoutes);
app.use("/account", accountRoutes);

export default app;
