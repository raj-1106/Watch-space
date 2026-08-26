import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

// Extend Express Request globally so all routes get req.user without casting
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email: string };
    }
  }
}

// Re-export as alias for backward compat with route files
export type AuthRequest = Request;

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Missing or invalid authorization token."));
    return;
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { uid: string; email: string };
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Token expired or invalid."));
  }
}
