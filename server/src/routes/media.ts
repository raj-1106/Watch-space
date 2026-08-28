import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { MediaType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { membershipMiddleware } from "../middleware/membership";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(authMiddleware);

// ─── Shared axios instance for external APIs ──────────────────────────────────
const http = axios.create({ timeout: 6000 });

type SearchResult = {
  externalId: string;
  title: string;
  mediaType: "MOVIE" | "SERIES" | "ANIME";
  releaseYear: number | null;
  posterUrl: string | null;
  overview: string | null;
  originalLanguage: string;
};

// ─── GET /catalog/search?q= ───────────────────────────────────────────────────
router.get("/catalog/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) throw new AppError(400, "q must be at least 2 characters.");
    if (!process.env.TMDB_API_KEY) throw new AppError(503, "Set TMDB_API_KEY on the server.");

    const key = process.env.TMDB_API_KEY;
    const query = String(q).trim();

    // ── Parallel fetches — each silently ignored on failure ───────────────────
    const [tmdb1, tmdb2, jikanRes] = await Promise.allSettled([
      http.get("https://api.themoviedb.org/3/search/multi", {
        params: { api_key: key, query, page: 1 },
      }),
      http.get("https://api.themoviedb.org/3/search/multi", {
        params: { api_key: key, query, page: 2 },
      }),
      http.get("https://api.jikan.moe/v4/anime", {
        params: { q: query, limit: 8, order_by: "score", sort: "desc" },
      }),
    ]);

    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    // ── TMDb ──────────────────────────────────────────────────────────────────
    for (const settled of [tmdb1, tmdb2]) {
      if (settled.status !== "fulfilled") continue;
      for (const r of (settled.value.data?.results || [])) {
        if (!["movie", "tv"].includes(r.media_type)) continue;
        const uid = `tmdb-${r.id}`;
        if (seen.has(uid)) continue;
        seen.add(uid);
        merged.push({
          externalId: String(r.id),
          title: r.title || r.name || "Unknown",
          mediaType: r.media_type === "movie" ? "MOVIE" : "SERIES",
          releaseYear: parseInt((r.release_date || r.first_air_date || "").slice(0, 4)) || null,
          posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
          overview: r.overview || null,
          originalLanguage: r.original_language || "en",
        });
      }
    }

    // ── Jikan (MyAnimeList) ───────────────────────────────────────────────────
    if (jikanRes.status === "fulfilled") {
      for (const a of (jikanRes.value.data?.data || [])) {
        const uid = `mal-${a.mal_id}`;
        if (seen.has(uid)) continue;
        seen.add(uid);
        merged.push({
          externalId: uid,
          title: a.title_english || a.title || "Unknown",
          mediaType: "ANIME",
          releaseYear: a.aired?.prop?.from?.year ?? null,
          posterUrl: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
          overview: a.synopsis || null,
          originalLanguage: "ja",
        });
      }
    }

    // Boost results with posters to top
    merged.sort((a, b) => (a.posterUrl && !b.posterUrl ? -1 : !a.posterUrl && b.posterUrl ? 1 : 0));

    res.json(merged.slice(0, 20));
  } catch (err) {
    next(err);
  }
});


// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getEnrichedMedia(spaceId: string, userId: string) {
  const spaceMedia = await prisma.spaceMediaItem.findMany({
    where: { spaceId },
    include: { 
      mediaItem: true,
      tags: { include: { tag: true } }
    },
    orderBy: { addedAt: "desc" },
  });

  return Promise.all(
    spaceMedia.map(async (sm) => {
      const interactions = await prisma.mediaInteraction.findMany({
        where: { spaceId, mediaItemId: sm.mediaItemId },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      });

      const scores = interactions.filter((i) => i.score !== null).map((i) => i.score as number);
      const avgScore = scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
      const myInteraction = interactions.find((i) => i.userId === userId);

      return {
        ...sm.mediaItem,
        spaceMediaItemId: sm.id,
        addedBy: sm.addedBy,
        addedAt: sm.addedAt,
        remarks: sm.remarks,
        avgScore,
        tags: sm.tags.map(t => t.tag),
        myInteraction: myInteraction
          ? { watched: myInteraction.watched, score: myInteraction.score, watchedAt: myInteraction.watchedAt, reviewText: myInteraction.reviewText }
          : null,
        memberInteractions: interactions.map((i) => ({
          userId: i.userId,
          displayName: i.user.displayName,
          avatarUrl: i.user.avatarUrl,
          watched: i.watched,
          score: i.score,
          reviewText: i.reviewText,
        })),
      };
    })
  );
}

// ─── GET /spaces/:id/media ────────────────────────────────────────────────────
router.get("/spaces/:id/media", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, language, minRating, watched, search } = req.query;
    const spaceId = String(req.params.id);
    const userId = req.user!.uid;

    let results = await getEnrichedMedia(spaceId, userId);

    if (type) results = results.filter((m) => m.mediaType === String(type).toUpperCase());
    if (language) results = results.filter((m) => m.originalLanguage === language);
    if (minRating) results = results.filter((m) => m.avgScore !== null && m.avgScore >= Number(minRating));
    if (watched !== undefined) {
      const wantWatched = watched === "true";
      results = results.filter((m) => (m.myInteraction?.watched ?? false) === wantWatched);
    }
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter((m) => m.title.toLowerCase().includes(q));
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ─── POST /spaces/:id/media ───────────────────────────────────────────────────
router.post("/spaces/:id/media", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, mediaType, externalId, releaseYear, posterUrl, overview, originalLanguage } = req.body;
    const spaceId = String(req.params.id);

    if (!title || !mediaType) throw new AppError(400, "title and mediaType are required.");
    if (!["MOVIE", "SERIES", "ANIME"].includes(mediaType)) {
      throw new AppError(400, "mediaType must be MOVIE, SERIES, or ANIME.");
    }

    // Upsert global catalog entry
    const mediaItem = await prisma.mediaItem.upsert({
      where: { externalId_mediaType: { externalId: externalId || "", mediaType: mediaType as MediaType } },
      create: {
        title,
        mediaType: mediaType as MediaType,
        externalId: externalId || null,
        releaseYear: releaseYear || null,
        posterUrl: posterUrl || null,
        overview: overview || null,
        originalLanguage: originalLanguage || "en",
      },
      update: { title, posterUrl: posterUrl || null, overview: overview || null },
    });

    // Link to space (idempotent)
    const spaceMediaItem = await prisma.spaceMediaItem.upsert({
      where: { spaceId_mediaItemId: { spaceId, mediaItemId: mediaItem.id } },
      create: { spaceId, mediaItemId: mediaItem.id, addedBy: req.user!.uid },
      update: {},
    });

    res.status(201).json({ ...mediaItem, spaceMediaItemId: spaceMediaItem.id });
  } catch (err) {
    next(err);
  }
});

// ─── GET /spaces/:id/media/:mediaItemId ──────────────────────────────────────
router.get("/spaces/:id/media/:mediaItemId", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = String(req.params.id);
    const mediaItemId = String(req.params.mediaItemId);

    const mediaItem = await prisma.mediaItem.findUnique({ where: { id: mediaItemId } });
    if (!mediaItem) throw new AppError(404, "Media item not found.");

    const interactions = await prisma.mediaInteraction.findMany({
      where: { spaceId, mediaItemId },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    const scores = interactions.filter((i) => i.score !== null).map((i) => i.score as number);
    const avgScore = scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

    res.json({ ...mediaItem, avgScore, interactions });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /spaces/:id/media/:mediaItemId ────────────────────────────────────
router.delete("/spaces/:id/media/:mediaItemId", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.spaceMediaItem.delete({
      where: { spaceId_mediaItemId: { spaceId: String(req.params.id), mediaItemId: String(req.params.mediaItemId) } },
    });
    res.json({ message: "Removed from space." });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /spaces/:id/media/:mediaItemId/interaction ──────────────────────────
router.put("/spaces/:id/media/:mediaItemId/interaction", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = String(req.params.id);
    const mediaItemId = String(req.params.mediaItemId);
    const userId = req.user!.uid;
    const { watched, score, reviewText } = req.body;

    if (score !== undefined && (typeof score !== "number" || score < 1 || score > 10)) {
      throw new AppError(400, "score must be a number between 1 and 10.");
    }

    const now = new Date();
    const data: Record<string, unknown> = { updatedAt: now };
    if (watched !== undefined) {
      data.watched = watched;
      data.watchedAt = watched ? now : null;
    }
    if (score !== undefined) data.score = score;
    if (reviewText !== undefined) data.reviewText = reviewText;

    const interaction = await prisma.mediaInteraction.upsert({
      where: { userId_mediaItemId_spaceId: { userId, mediaItemId, spaceId } },
      create: { userId, mediaItemId, spaceId, ...data },
      update: data,
    });

    res.json(interaction);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /spaces/:id/media/:mediaItemId/interaction ───────────────────────
router.delete("/spaces/:id/media/:mediaItemId/interaction", membershipMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.mediaInteraction.deleteMany({
      where: { userId: req.user!.uid, mediaItemId: String(req.params.mediaItemId), spaceId: String(req.params.id) },
    });
    res.json({ message: "Interaction cleared." });
  } catch (err) {
    next(err);
  }
});

export default router;
