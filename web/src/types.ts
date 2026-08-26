// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

// ─── Spaces ──────────────────────────────────────────────────────────────────
export type SpaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Space {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  role?: SpaceRole;
}

export interface SpaceMember {
  id: string;
  role: SpaceRole;
  joinedAt: string;
  user: { id: string; displayName: string; avatarUrl?: string | null; email: string };
}

// ─── Media ───────────────────────────────────────────────────────────────────
export type MediaType = "MOVIE" | "SERIES" | "ANIME";

export interface MediaItem {
  id: string;
  title: string;
  mediaType: MediaType;
  originalLanguage: string;
  releaseYear?: number | null;
  posterUrl?: string | null;
  overview?: string | null;
  externalId?: string | null;
  spaceMediaItemId?: string;
  addedBy?: string;
  addedAt?: string;
  avgScore?: number | null;
  myInteraction?: {
    watched: boolean;
    score?: number | null;
    watchedAt?: string | null;
  } | null;
  memberInteractions?: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
    watched: boolean;
    score?: number | null;
  }[];
}

// ─── TMDb Search ─────────────────────────────────────────────────────────────
export interface TmdbResult {
  externalId: string;
  title: string;
  mediaType: MediaType;
  releaseYear?: number | null;
  posterUrl?: string | null;
  overview?: string;
  originalLanguage: string;
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface MediaFilters {
  type?: MediaType;
  language?: string;
  minRating?: number;
  watched?: boolean;
  search?: string;
}
