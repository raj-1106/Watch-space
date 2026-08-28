import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Comment, MediaItem } from "../types";
import { Star } from "lucide-react";

interface CommentsSectionProps {
  spaceId: string;
  item: MediaItem;
}

export function CommentsSection({ spaceId, item }: CommentsSectionProps) {
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", item.id],
    queryFn: () => api.get(`/spaces/${spaceId}/media/${item.id}/comments`),
  });
  const [body, setBody] = useState("");
  const qc = useQueryClient();

  const postComment = useMutation({
    mutationFn: (body: string) => api.post(`/spaces/${spaceId}/media/${item.id}/comments`, { body }),
    onMutate: async (newBody) => {
      await qc.cancelQueries({ queryKey: ["comments", item.id] });
      const previous = qc.getQueryData<Comment[]>(["comments", item.id]);
      
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        spaceMediaItemId: item.spaceMediaItemId!,
        userId: "me", // Assuming current user, UI just needs a placeholder
        body: newBody,
        createdAt: new Date().toISOString(),
        user: { id: "me", displayName: "Posting...", avatarUrl: null }
      };

      qc.setQueryData<Comment[]>(["comments", item.id], (old = []) => [...old, optimisticComment as Comment]);
      return { previous };
    },
    onError: (_err, _newBody, context) => {
      if (context?.previous) qc.setQueryData(["comments", item.id], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["comments", item.id] });
    },
    onSuccess: () => {
      setBody("");
    },
  });

  const reviewsWithText = item.memberInteractions?.filter(mi => mi.reviewText && mi.reviewText.trim().length > 0) || [];

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Pinned Reviews */}
      {reviewsWithText.length > 0 && (
        <div className="flex flex-col gap-2">
          {reviewsWithText.map(review => (
            <div key={review.userId} className="rounded-lg bg-gold/5 border border-gold/20 p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gold text-sm">{review.displayName}</span>
                <span className="text-smoke/60 text-xs font-mono">rated it</span>
                {review.score && (
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono text-xs text-gold font-medium">{review.score}</span>
                    <span className="font-mono text-[10px] text-smoke/50">/10</span>
                  </div>
                )}
              </div>
              <p className="text-cream/90 text-sm italic">"{review.reviewText}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Divider if both exist */}
      {reviewsWithText.length > 0 && comments.length > 0 && (
        <hr className="border-white/10" />
      )}

      {/* Comments Thread */}
      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto hide-scrollbar">
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-medium text-cream">{c.user.displayName}</span>{" "}
            <span className="text-smoke/50 text-xs font-mono">
              {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <p className="text-smoke mt-0.5">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && reviewsWithText.length === 0 && (
          <p className="text-smoke/50 text-sm font-mono text-center py-2">No comments yet.</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) postComment.mutate(body.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-cream placeholder:text-smoke/50 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/40 transition-all"
        />
        <button
          type="submit"
          disabled={!body.trim() || postComment.isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-midnight disabled:opacity-40 transition-opacity"
        >
          Post
        </button>
      </form>
    </div>
  );
}
