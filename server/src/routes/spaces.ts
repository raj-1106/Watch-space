import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { membershipMiddleware } from "../middleware/membership";
import { AppError } from "../middleware/errorHandler";
import { addDays } from "date-fns";

const router = Router();
router.use(authMiddleware);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const slugify = (text: string): string =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);

const makeUniqueSlug = async (base: string): Promise<string> => {
  let slug = slugify(base);
  let attempt = 0;
  while (await prisma.space.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${++attempt}`;
  }
  return slug;
};

// ─── POST /spaces ─────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) throw new AppError(400, "name is required.");

    const slug = await makeUniqueSlug(name);
    const space = await prisma.space.create({
      data: {
        name: name.trim(),
        slug,
        ownerId: req.user!.uid,
        memberships: { create: { userId: req.user!.uid, role: "OWNER" } },
      },
    });

    res.status(201).json({ ...space, role: "OWNER" });
  } catch (err) {
    next(err);
  }
});

// ─── GET /spaces ──────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await prisma.spaceMembership.findMany({
      where: { userId: req.user!.uid },
      include: { space: true },
      orderBy: { joinedAt: "desc" },
    });
    res.json(memberships.map((m) => ({ ...m.space, role: m.role })));
  } catch (err) {
    next(err);
  }
});

// ─── GET /spaces/:id ─────────────────────────────────────────────────────────
router.get("/:id", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = String(req.params.id);
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        memberships: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
    if (!space) throw new AppError(404, "Space not found.");
    res.json(space);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /spaces/:id ───────────────────────────────────────────────────────
router.patch("/:id", membershipMiddleware("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) throw new AppError(400, "name is required.");
    const space = await prisma.space.update({ where: { id: String(req.params.id) }, data: { name: name.trim() } });
    res.json(space);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /spaces/:id ──────────────────────────────────────────────────────
router.delete("/:id", membershipMiddleware("OWNER"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.space.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Space deleted." });
  } catch (err) {
    next(err);
  }
});

// ─── POST /spaces/:id/invite ─────────────────────────────────────────────────
router.post("/:id/invite", membershipMiddleware("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError(400, "email is required.");

    const invitation = await prisma.spaceInvitation.create({
      data: {
        spaceId: String(req.params.id),
        email,
        invitedBy: req.user!.uid,
        expiresAt: addDays(new Date(), 7),
      },
    });

    const joinUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/join/${invitation.token}`;
    res.json({ token: invitation.token, joinUrl });
  } catch (err) {
    next(err);
  }
});

// ─── POST /spaces/invitations/:token/accept ───────────────────────────────────
router.post("/invitations/:token/accept", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.params.token);
    const invitation = await prisma.spaceInvitation.findUnique({ where: { token } });
    if (!invitation || invitation.expiresAt < new Date()) {
      throw new AppError(400, "Invitation invalid or expired.");
    }
    if (invitation.acceptedAt) throw new AppError(400, "Invitation already used.");

    await prisma.spaceMembership.upsert({
      where: { spaceId_userId: { spaceId: invitation.spaceId, userId: req.user!.uid } },
      create: { spaceId: invitation.spaceId, userId: req.user!.uid, role: "MEMBER" },
      update: {},
    });

    await prisma.spaceInvitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    res.json({ spaceId: invitation.spaceId });
  } catch (err) {
    next(err);
  }
});

// ─── GET /spaces/:id/members ─────────────────────────────────────────────────
router.get("/:id/members", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.spaceMembership.findMany({
      where: { spaceId: String(req.params.id) },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /spaces/:id/members/:userId ──────────────────────────────────────
router.delete("/:id/members/:userId", membershipMiddleware("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = String(req.params.id);
    const userId = String(req.params.userId);

    const target = await prisma.spaceMembership.findUnique({
      where: { spaceId_userId: { spaceId, userId } },
    });
    if (!target) throw new AppError(404, "Member not found.");
    if (target.role === "OWNER") throw new AppError(403, "Cannot remove the space owner.");

    await prisma.spaceMembership.delete({ where: { spaceId_userId: { spaceId, userId } } });
    res.json({ message: "Member removed." });
  } catch (err) {
    next(err);
  }
});

export default router;
