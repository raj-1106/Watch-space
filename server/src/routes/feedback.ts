import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(authMiddleware);

// ─── POST /feedback ────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, message, pageUrl } = req.body;

    if (type !== "BUG" && type !== "SUGGESTION") {
      throw new AppError(400, "type must be 'BUG' or 'SUGGESTION'.");
    }
    const trimmed = String(message ?? "").trim();
    if (!trimmed) throw new AppError(400, "Message can't be empty.");
    if (trimmed.length > 2000) throw new AppError(400, "Message must be under 2000 characters.");

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.uid,
        type,
        message: trimmed,
        pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
      },
    });

    res.status(201).json({ id: feedback.id });
  } catch (err) {
    next(err);
  }
});

export default router;
