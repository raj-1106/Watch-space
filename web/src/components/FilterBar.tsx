import React from "react";
import { motion } from "framer-motion";
import type { MediaFilters } from "../types";
import { Search } from "lucide-react";

interface FilterBarProps {
  filters: MediaFilters;
  setFilters: React.Dispatch<React.SetStateAction<MediaFilters>>;
}

export function FilterBar({ filters, setFilters }: FilterBarProps) {
  const toggleFilter = (key: keyof MediaFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke" />
        <input
          type="text"
          placeholder="Search space..."
          value={filters.search || ""}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full bg-velvet border border-white/5 rounded-full pl-9 pr-4 py-2 text-sm text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
        />
      </div>

      {/* Pill Rows — horizontal scroll on mobile with fade affordance */}
      <div
        className="flex overflow-x-auto pb-2 scroll-fade-right hide-scrollbar"
        role="listbox"
        aria-label="Filter media"
      >
        <div className="flex items-center gap-2 pr-8 min-w-max">
          {/* Type Filters */}
          {(["MOVIE", "SERIES", "ANIME"] as const).map((type) => (
            <button
              key={type}
              role="option"
              aria-selected={filters.type === type}
              onClick={() => toggleFilter("type", type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                filters.type === type
                  ? "bg-gold text-midnight"
                  : "bg-white/5 text-smoke hover:bg-white/10 hover:text-cream border border-white/5"
              }`}
            >
              {type === "MOVIE" ? "Film" : type === "SERIES" ? "Series" : "Anime"}
            </button>
          ))}

          <div className="w-px h-5 bg-white/10 mx-2" />

          {/* Status Filters */}
          {(["watched", "unwatched"] as const).map((status) => {
            const isActive = filters.watched === (status === "watched");
            return (
              <button
                key={status}
                role="option"
                aria-selected={isActive}
                onClick={() => toggleFilter("watched", status === "watched")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  isActive
                    ? "bg-gold text-midnight"
                    : "bg-white/5 text-smoke hover:bg-white/10 hover:text-cream border border-white/5"
                }`}
              >
                {status === "watched" ? "Watched" : "Unwatched"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
