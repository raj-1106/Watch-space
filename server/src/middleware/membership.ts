import { Response, NextFunction } from "express";
import { SpaceRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "./auth";
import { AppError } from "./errorHandler";

const ROLE_HIERARCHY: SpaceRole[] = ["MEMBER", "ADMIN", "OWNER"];

export function membershipMiddleware(requiredRole?: SpaceRole) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const spaceId = req.params.id;
      const userId = req.user?.uid;

      if (!userId) throw new AppError(401, "Unauthorized.");

      const membership = await prisma.spaceMembership.findUnique({
        where: { spaceId_userId: { spaceId, userId } },
      });

      if (!membership) throw new AppError(403, "You are not a member of this space.");

      if (requiredRole) {
        const userLevel = ROLE_HIERARCHY.indexOf(membership.role);
        const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
        if (userLevel < requiredLevel) {
          throw new AppError(403, "Insufficient permissions.");
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
