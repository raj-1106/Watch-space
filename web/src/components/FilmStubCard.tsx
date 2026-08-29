import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { MediaItem } from "../types";
import { Star, Trash2, X, MessageSquare } from "lucide-react";
import { ReelRatingPicker } from "./ReelRatingPicker";
import { TagRow } from "./TagRow";
import { CommentsSection } from "./CommentsSection";
import { useAuth } from "../context/AuthContext";

interface FilmStubCardProps {
  item: MediaItem;
  spaceId: string;
  members: { id: string; displayName: string; avatarUrl?: string | null }[];
  myRole?: "OWNER" | "ADMIN" | "MEMBER";
  index?: number;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const mediaLabel: Record<string, string> = { MOVIE: "FILM", SERIES: "SERIES", ANIME: "ANIME" };

export function FilmStubCard({ item, spaceId, members, myRole, index }: FilmStubCardProps) {
  const reducedMotion = useReducedMotion();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const currentScore = item.myInteraction?.score ?? 0;
  const isWatched = item.myInteraction?.watched ?? false;

  const interact = useMutation({
    mutationFn: (data: { watched?: boolean; score?: number | null }) =>
      api.put(`/spaces/${spaceId}/media/${item.id}/interaction`, data),
    onMutate: async (data) => {
      // NOTE: the real query key is ["space-media", spaceId, filters] (see SpaceDetailPage.tsx).
      // setQueryData/getQueryData require an EXACT key match, so writing to
      // ["space-media", spaceId] alone silently misses the actual cache entry whenever any
      // filter is active — this optimistic update was a no-op for anyone with a filter set,
      // which is why it only ever "updated" after the onSettled refetch completed.
      // setQueriesData/getQueriesData (plural) do partial/fuzzy key matching, so { exact: false }
      // here correctly finds and updates the real entry no matter what `filters` currently is.
      await qc.cancelQueries({ queryKey: ["space-media", spaceId], exact: false });

      const previousEntries = qc.getQueriesData<MediaItem[]>({ queryKey: ["space-media", spaceId], exact: false });

      qc.setQueriesData<MediaItem[]>({ queryKey: ["space-media", spaceId], exact: false }, (old) =>
        old?.map((m) => {
          if (m.id !== item.id) return m;

          const nextMyInteraction = { ...m.myInteraction, watched: m.myInteraction?.watched ?? false, ...data };

          // Every other visible display — the rater badges above each pill, the mobile
          // member-breakdown list, and the avg-rating star + count — reads from
          // memberInteractions/avgScore/ratingCount, NOT myInteraction. Patching only
          // myInteraction (as this used to do) meant your own checkmark flipped instantly
          // but your entry in every one of those secondary displays kept showing the OLD
          // state until the network round trip finished — most visible exactly when
          // *removing* a watched mark or a rating, since that's when the stale gold
          // badge/dot lingering is actually noticeable.
          const nextMemberInteractions = user
            ? (m.memberInteractions ?? []).map((mi) =>
                mi.userId === user.id
                  ? { ...mi, watched: nextMyInteraction.watched, score: nextMyInteraction.score ?? null }
                  : mi
              )
            : m.memberInteractions;

          const scores = (nextMemberInteractions ?? [])
            .map((mi) => mi.score)
            .filter((s): s is number => s != null);
          const nextAvgScore = scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

          return {
            ...m,
            myInteraction: nextMyInteraction,
            memberInteractions: nextMemberInteractions,
            avgScore: nextAvgScore,
            ratingCount: scores.length,
          };
        })
      );

      return { previousEntries };
    },
    onError: (_err, _data, context) => {
      // roll back every matching cache entry we touched, not just one
      context?.previousEntries?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["space-media", spaceId], exact: false }),
  });

  const handleWatched = () => interact.mutate({ watched: !isWatched });
  const handleScore = (score: number) => interact.mutate({ score });
  const handleClearScore = () => interact.mutate({ score: null });

  const deleteMedia = useMutation({
    mutationFn: () => api.delete(`/spaces/${spaceId}/media/${item.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["space-media", spaceId] }),
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMedia.mutate();
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1], delay: reducedMotion ? 0 : Math.min((index ?? 0) * 0.03, 0.3) }}
        whileHover={reducedMotion ? undefined : { y: -3, transition: { duration: 0.15 } }}
        onClick={() => {
          if (window.innerWidth < 640) {
            setModalOpen(true);
          } else {
            setExpanded(e => !e);
          }
        }}
        className={`relative flex flex-col sm:flex-row rounded-xl overflow-hidden border transition-colors duration-200 group cursor-pointer sm:cursor-default
        ${isWatched
          ? "border-gold/50 shadow-[0_0_20px_rgba(232,178,61,0.12)]"
          : "border-white/5 hover:border-gold/25 hover:shadow-[0_0_16px_rgba(232,178,61,0.07)]"
        }
        bg-velvet`}
      style={{ minHeight: "160px" }}
    >
      {/* ── Poster ─────────────────────────────────────────── */}
      <div className="relative w-full aspect-[2/3] sm:aspect-auto sm:w-[110px] sm:h-auto flex-shrink-0 overflow-hidden bg-midnight">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className={`w-full h-full object-cover transition-all duration-300 ${isWatched ? "opacity-75 grayscale-[25%]" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${isWatched ? "opacity-75 grayscale-[25%]" : ""}`}>
            <span className="font-display text-4xl text-white/10">M</span>
          </div>
        )}

        {/* Mobile-only watched badge — desktop already shows the full stamp in the metadata column */}
        <AnimatePresence>
          {isWatched && (
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 22 }}
              className="sm:hidden absolute top-2 right-1.5 pointer-events-none z-20"
            >
              <div className="border-[2px] border-gold rounded px-1.5 py-0.5 rotate-[-12deg]
                shadow-[0_0_8px_rgba(232,178,61,0.5)] bg-midnight/60 backdrop-blur-[2px]">
                <span className="font-display text-gold text-[9px] tracking-[0.15em] opacity-90 leading-none">
                  WATCHED
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient fade into card */}
        <div className="absolute inset-x-0 sm:inset-x-auto bottom-0 sm:inset-y-0 right-0 h-6 sm:h-full w-full sm:w-6 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-velvet pointer-events-none" />
      </div>

      {/* ── Perforated divider ──────────────────────────────── */}
      <div className="hidden sm:flex relative flex-shrink-0 flex-row sm:flex-col items-center justify-center h-5 w-full sm:h-auto sm:w-5 select-none z-10">
        {/* Notches */}
        <div className="absolute -left-3 sm:left-1/2 top-1/2 sm:-top-3 -translate-y-1/2 sm:translate-y-0 sm:-translate-x-1/2 w-6 h-6 rounded-full bg-midnight" />
        <div className="flex-1 border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-white/10 mx-3 sm:mx-0 sm:my-3" />
        <div className="absolute -right-3 sm:right-auto sm:left-1/2 top-1/2 sm:top-auto sm:-bottom-3 -translate-y-1/2 sm:translate-y-0 sm:-translate-x-1/2 w-6 h-6 rounded-full bg-midnight" />
      </div>

      {/* ── Metadata ────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-1 min-w-0 flex-col p-3 sm:p-4 gap-2 relative overflow-hidden">
        
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          onBlur={() => setConfirmingDelete(false)}
          disabled={deleteMedia.isPending}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 z-30 disabled:opacity-50 ${
            confirmingDelete ? "text-red-400 bg-red-500/15" : "text-smoke/40 hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={confirmingDelete ? "Click again to confirm" : "Remove from space"}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* WATCHED stamp */}
        <AnimatePresence>
          {isWatched && (
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 22 }}
              className="absolute top-2 right-2 pointer-events-none z-20"
            >
              <div className="border-[2.5px] border-gold rounded-md px-2 py-0.5 rotate-[-12deg]
                shadow-[0_0_12px_rgba(232,178,61,0.4)] bg-midnight/40 backdrop-blur-[1px]">
                <span className="font-display text-gold text-sm tracking-[0.2em] opacity-90">
                  WATCHED
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title + badges */}
        <div className="min-w-0">
          <h3 className="font-display text-lg sm:text-xl text-cream leading-tight truncate" title={item.title}>
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.releaseYear && (
              <span className="font-mono text-[11px] text-smoke">{item.releaseYear}</span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-gold/30 text-gold/80 bg-gold/5">
              {mediaLabel[item.mediaType]}
            </span>
            <span className="font-mono text-[11px] text-smoke/60 uppercase">{item.originalLanguage}</span>
            {item.addedBy && members.find(m => m.id === item.addedBy) && (
              <span className="font-mono text-[11px] text-smoke/40 uppercase ml-1">
                • Added by {members.find(m => m.id === item.addedBy)?.displayName.split(" ")[0]}
              </span>
            )}
          </div>
          <TagRow spaceId={spaceId} mediaItemId={item.id} tags={item.tags || []} />
        </div>

        {/* Avg rating */}
        {item.avgScore != null && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-gold fill-gold flex-shrink-0" />
            <span className="font-mono text-xs text-gold font-medium">{item.avgScore.toFixed(1)}</span>
            <span className="font-mono text-[11px] text-smoke/50">/ 10</span>
            {!!item.ratingCount && (
              <span
                title={`${item.ratingCount} ${item.ratingCount === 1 ? "rating" : "ratings"}`}
                className="w-4 h-4 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center
                  font-mono text-[9px] text-gold/90 ml-0.5"
              >
                {item.ratingCount}
              </span>
            )}
          </div>
        )}

        {/* Member dots */}
        {item.memberInteractions && item.memberInteractions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.memberInteractions.map((mi) => (
              <div
                key={mi.userId}
                title={`${mi.displayName}${mi.watched ? " · Watched" : ""}${mi.score ? ` · ${mi.score}/10` : ""}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold
                  ring-1 transition-all ${mi.watched
                    ? "bg-gold text-midnight ring-gold/50"
                    : "bg-white/5 text-smoke ring-white/10"
                  }`}
              >
                {getInitials(mi.displayName)}
              </div>
            ))}
          </div>
        )}

        {/* Controls: watched + rating */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {/* Watched toggle */}
          <button
            onClick={handleWatched}
            disabled={interact.isPending}
            aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
            className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center
              transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-gold
              active:scale-95 ${isWatched
                ? "bg-gold text-midnight shadow-[0_0_10px_rgba(232,178,61,0.4)]"
                : "bg-white/5 text-smoke hover:bg-gold/15 hover:text-gold border border-white/10 hover:border-gold/30"
              }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Rating pills 1–10 */}
          <div className="flex items-end gap-0.5 flex-1 overflow-x-auto hide-scrollbar pt-4">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => {
              const active = hoverRating != null ? n <= hoverRating : n <= currentScore;
              const raters = item.memberInteractions?.filter((mi) => mi.score === n) ?? [];
              return (
                <div key={n} className="relative flex-1 min-w-[18px]">
                  {raters.length > 0 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex -space-x-1.5 z-10">
                      {raters.map((mi) => (
                        <div
                          key={mi.userId}
                          title={`${mi.displayName} rated ${n}/10`}
                          className="w-3.5 h-3.5 rounded-full bg-gold text-midnight ring-1 ring-velvet
                            flex items-center justify-center text-[7px] font-mono font-bold"
                        >
                          {getInitials(mi.displayName)}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => (n === currentScore ? handleClearScore() : handleScore(n))}
                    title={n === currentScore ? "Click again to clear your rating" : `Rate ${n}/10`}
                    className={`w-full h-8 sm:h-9 rounded text-[10px] font-mono font-medium
                      transition-all duration-75 outline-none focus-visible:ring-1 focus-visible:ring-gold active:scale-95
                      ${active
                        ? "bg-gold text-midnight"
                        : "bg-white/5 text-smoke/50 hover:bg-gold/20 hover:text-gold"
                      }`}
                  >
                    {n}
                  </button>
                </div>
              );
            })}
          </div>

          {currentScore > 0 && (
            <button
              onClick={handleClearScore}
              disabled={interact.isPending}
              title="Clear your rating"
              aria-label="Clear your rating"
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-smoke/50
                hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Expanded View */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 pt-4 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <CommentsSection spaceId={spaceId} item={item} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

      {/* ── Mobile Interaction Modal ─────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:hidden bg-midnight/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-velvet border-t border-white/10 rounded-t-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-cream leading-tight">{item.title}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-gold/30 text-gold/80 bg-gold/5">
                      {mediaLabel[item.mediaType]}
                    </span>
                    {item.releaseYear && <span className="font-mono text-xs text-smoke">{item.releaseYear}</span>}
                    {item.addedBy && members.find(m => m.id === item.addedBy) && (
                      <span className="font-mono text-[10px] text-smoke/60 uppercase ml-1">
                        • Added by {members.find(m => m.id === item.addedBy)?.displayName.split(" ")[0]}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <TagRow spaceId={spaceId} mediaItemId={item.id} tags={item.tags || []} />
                  </div>
                  {item.avgScore != null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="w-3.5 h-3.5 text-gold fill-gold flex-shrink-0" />
                      <span className="font-mono text-sm text-gold font-medium">{item.avgScore.toFixed(1)}</span>
                      <span className="font-mono text-xs text-smoke/50">/ 10</span>
                      {!!item.ratingCount && (
                        <span
                          title={`${item.ratingCount} ${item.ratingCount === 1 ? "rating" : "ratings"}`}
                          className="w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center
                            font-mono text-[10px] text-gold/90 ml-0.5"
                        >
                          {item.ratingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 text-smoke hover:text-cream bg-white/5 rounded-full shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Watched Toggle */}
              <button
                onClick={handleWatched}
                disabled={interact.isPending}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-colors font-display text-lg tracking-wide ${
                  isWatched
                    ? "bg-gold text-midnight"
                    : "bg-white/5 text-cream border border-white/10 hover:border-gold/30"
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {isWatched ? "WATCHED" : "MARK WATCHED"}
              </button>

              {/* Member breakdown — the desktop dots rely on hover tooltips for watched/score,
                  which don't work on touch at all, so this needs to be a real visible list here,
                  not a ported copy of the same circles. */}
              {item.memberInteractions && item.memberInteractions.length > 0 && (
                <div className="flex flex-col gap-1.5 -mt-2">
                  {item.memberInteractions.map((mi) => (
                    <div
                      key={mi.userId}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-mono font-bold
                            ring-1 ${mi.watched ? "bg-gold text-midnight ring-gold/50" : "bg-white/5 text-smoke ring-white/10"}`}
                        >
                          {getInitials(mi.displayName)}
                        </div>
                        <span className="text-sm text-cream/90 truncate">{mi.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {mi.watched ? (
                          <span className="font-mono text-[10px] text-gold/80 uppercase">Watched</span>
                        ) : (
                          <span className="font-mono text-[10px] text-smoke/50 uppercase">Not watched</span>
                        )}
                        {mi.score != null && (
                          <span className="flex items-center gap-1 font-mono text-xs text-gold">
                            <Star className="w-3 h-3 fill-gold" />
                            {mi.score}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rating Selector */}
              <div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <p className="font-mono text-xs text-smoke uppercase tracking-wider">Your Rating</p>
                  {currentScore > 0 && (
                    <button
                      onClick={handleClearScore}
                      disabled={interact.isPending}
                      className="font-mono text-[11px] text-smoke/60 hover:text-red-400 transition-colors disabled:opacity-40 underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ReelRatingPicker value={currentScore} onChange={handleScore} />
              </div>

              {/* Comments Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <CommentsSection spaceId={spaceId} item={item} />
              </div>

              {/* Mobile Delete Button */}
              <button
                onClick={handleDelete}
                onBlur={() => setConfirmingDelete(false)}
                disabled={deleteMedia.isPending}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-colors font-mono text-sm tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 mt-2 ${
                  confirmingDelete
                    ? "bg-red-500 text-white"
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmingDelete ? "TAP TO CONFIRM" : "REMOVE FROM SPACE"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
