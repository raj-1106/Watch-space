import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import spacesRouter from "./routes/spaces";
import mediaRouter from "./routes/media";
import { errorHandler } from "./middleware/errorHandler";

// Load env before anything else
dotenv.config();

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));
app.use("/auth", authRouter);
app.use("/spaces", spacesRouter);
app.use("/", mediaRouter);

// ─── Central Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`🎬  Sofa Syndicate API   →  http://localhost:${PORT}`);
  console.log(`🌍  Environment   →  ${process.env.NODE_ENV ?? "development"}`);
});
