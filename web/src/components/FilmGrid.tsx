import React from "react";
import { AnimatePresence } from "framer-motion";
import { FilmStubCard } from "./FilmStubCard";
import type { MediaItem, SpaceMember, SpaceRole } from "../types";
import { useAuth } from "../context/AuthContext";

interface FilmGridProps {
  items: MediaItem[];
  spaceId: string;
  members: SpaceMember[];
}

export function FilmGrid({ items, spaceId, members }: FilmGridProps) {
  const { user } = useAuth();
  const myRole = members.find((m) => m.user.id === user?.id)?.role ?? "MEMBER";

  const memberMap = members.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
  }));

  return (
    <div className="block columns-2 sm:columns-auto sm:flex sm:flex-col gap-2 sm:gap-3 pb-24">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <div key={item.id} className="break-inside-avoid mb-2 sm:mb-0">
            <FilmStubCard
              item={item}
              spaceId={spaceId}
              members={memberMap}
              myRole={myRole}
              index={index}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
