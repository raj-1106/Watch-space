import { Router, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const signAccess = (uid: string, email: string): string =>
  jwt.sign({ uid, email }, process.env.JWT_SECRET!, { expiresIn: "15m" });

const signRefresh = (uid: string): string =>
  jwt.sign({ uid }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

const setRefreshCookie = (res: Response, token: string, remember: boolean): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}), // 30 days or session
  });
};

// ─── POST /auth/register ─────────────────────────────────────────────────────
router.post("/register", async (req, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      throw new AppError(400, "email, password and displayName are required.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email already in use.");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });

    const accessToken = signAccess(user.id, user.email);
    setRefreshCookie(res, signRefresh(user.id), true); // always remember on register

    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post("/login", async (req, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    if (!email || !password) throw new AppError(400, "email and password are required.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new AppError(401, "Invalid credentials.");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, "Invalid credentials.");

    const accessToken = signAccess(user.id, user.email);
    setRefreshCookie(res, signRefresh(user.id), Boolean(rememberMe));

    res.json({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post("/refresh", (req, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw new AppError(401, "No refresh token.");

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { uid: string };
    const accessToken = jwt.sign({ uid: payload.uid }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    res.json({ accessToken });
  } catch (err) {
    if (err instanceof AppError) next(err);
    else next(new AppError(401, "Refresh token invalid or expired."));
  }
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post("/logout", (_req, res: Response) => {
  res.clearCookie("refresh_token");
  res.json({ message: "Logged out." });
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.uid },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });
    if (!user) throw new AppError(404, "User not found.");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
