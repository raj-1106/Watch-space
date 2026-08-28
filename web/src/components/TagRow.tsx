import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Tag } from "../types";

interface TagRowProps {
  spaceId: string;
  mediaItemId: string;
  tags: Tag[];
}

export function TagRow({ spaceId, mediaItemId, tags }: TagRowProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const qc = useQueryClient();

  const addTag = useMutation({
    mutationFn: (label: string) => api.post(`/spaces/${spaceId}/media/${mediaItemId}/tags`, { label }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["space-media", spaceId] }),
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {tags.map((tag) => (
        <span key={tag.id} className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[11px] font-mono text-gold">
          {tag.label}
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              addTag.mutate(input.trim());
              setInput("");
              setAdding(false);
            }
            if (e.key === "Escape") setAdding(false);
          }}
          onBlur={() => setAdding(false)}
          placeholder="tag name…"
          className="w-24 bg-transparent border-b border-gold/40 text-[11px] text-cream focus:outline-none placeholder:text-smoke/50"
        />
      ) : (
        <button onClick={(e) => { e.stopPropagation(); setAdding(true); }} className="text-[11px] text-smoke/70 hover:text-gold transition-colors font-mono">
          + tag
        </button>
      )}
    </div>
  );
}
