import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { FilterBar } from "../components/FilterBar";
import { FilmGrid } from "../components/FilmGrid";
import { AddFilmModal } from "../components/AddFilmModal";
import type { MediaItem, SpaceMember, MediaFilters } from "../types";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-gold/20 text-gold border-gold/30",
  ADMIN: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  MEMBER: "bg-white/5 text-smoke border-white/10",
};

export function SpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<MediaFilters>({});

  const { data: members = [] } = useQuery<SpaceMember[]>({
    queryKey: ["space-members", spaceId],
    queryFn: () => api.get(`/spaces/${spaceId}/members`),
    enabled: !!spaceId,
  });

  const qs = new URLSearchParams();
  if (filters.type) qs.set("type", filters.type);
  if (filters.watched !== undefined) qs.set("watched", filters.watched.toString());
  if (filters.search) qs.set("search", filters.search);

  const { data: media = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["space-media", spaceId, filters],
    queryFn: () => api.get(`/spaces/${spaceId}/media?${qs.toString()}`),
    enabled: !!spaceId,
  });

  if (!spaceId) return null;

  return (
    <div className="min-h-screen bg-midnight font-body">
      <Navbar currentSpaceId={spaceId} onAddClick={() => setModalOpen(true)} />

      {/* ── Members strip ── */}
      <div className="border-b border-white/5 bg-velvet/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-smoke text-xs font-mono mr-1">
            <Users className="w-3.5 h-3.5" />
            <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
          {members.map((m) => (
            <motion.div
              key={m.user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 bg-midnight/60 rounded-full px-3 py-1 border border-white/5"
            >
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
                {(m.user.displayName ?? "?")[0].toUpperCase()}
              </div>
              <span className="text-cream text-xs">{m.user.displayName ?? "Unknown"}</span>
              <span className={`text-[9px] font-mono border rounded-full px-1.5 py-0.5 ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}>
                {m.role}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <FilterBar filters={filters} setFilters={setFilters} />

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="h-40 bg-velvet rounded-xl"
              />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="text-5xl opacity-20">🎬</div>
            <p className="font-display text-2xl text-smoke tracking-widest">YOUR SPACE IS EMPTY</p>
            <p className="text-smoke/50 text-sm">Hit <span className="text-gold">+ Add Title</span> to add your first movie, series or anime.</p>
          </div>
        ) : (
          <FilmGrid items={media} spaceId={spaceId} members={members} />
        )}
      </main>

      <AddFilmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        spaceId={spaceId}
      />
    </div>
  );
}
