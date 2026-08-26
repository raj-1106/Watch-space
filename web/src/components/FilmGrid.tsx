import React from "react";
import { AnimatePresence } from "framer-motion";
import { FilmStubCard } from "./FilmStubCard";
import type { MediaItem, SpaceMember } from "../types";

interface FilmGridProps {
  items: MediaItem[];
  spaceId: string;
  members: SpaceMember[];
}

export function FilmGrid({ items, spaceId, members }: FilmGridProps) {
  const memberMap = members.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
  }));

  return (
    <div className="flex flex-col gap-3 pb-24">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <FilmStubCard
            key={item.id}
            item={item}
            spaceId={spaceId}
            members={memberMap}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
