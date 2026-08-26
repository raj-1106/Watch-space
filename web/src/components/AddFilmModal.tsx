import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { TmdbResult } from "../types";

interface AddFilmModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function AddFilmModal({ isOpen, onClose, spaceId }: AddFilmModalProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);
  const qc = useQueryClient();

  // Reset on close
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const { data: results = [], isFetching } = useQuery<TmdbResult[]>({
    queryKey: ["tmdb-search", debouncedQuery],
    queryFn: () => api.get(`/catalog/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length > 2,
  });

  const addItem = useMutation({
    mutationFn: (item: TmdbResult) => api.post(`/spaces/${spaceId}/media`, item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["space-media", spaceId] });
      onClose();
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
          />

          {/* Modal (bottom sheet on mobile, modal on desktop) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-velvet sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
          >
            {/* Mobile Drag Handle */}
            <div className="w-full flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-smoke" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search for movies, series, or anime..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-midnight border border-white/10 rounded-full pl-12 pr-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors text-lg"
                />
              </div>
              <button
                onClick={onClose}
                className="p-2 text-smoke hover:text-cream rounded-full hover:bg-white/5 transition-colors hidden sm:block outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {isFetching ? (
                <div className="text-center text-smoke py-10 animate-pulse">Searching catalog...</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((result, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={result.externalId}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
                    >
                      <div className="w-12 h-16 bg-midnight rounded shrink-0 overflow-hidden">
                        {result.posterUrl && (
                          <img src={result.posterUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-lg text-cream truncate">{result.title}</h4>
                        <div className="flex gap-2 text-xs text-smoke font-mono mt-1">
                          <span>{result.releaseYear || "—"}</span>
                          <span className="uppercase">{result.mediaType}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addItem.mutate(result)}
                        disabled={addItem.isPending}
                        className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center hover:bg-gold hover:text-midnight transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-velvet disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : query.length > 2 ? (
                <div className="text-center text-smoke py-10">No results found for "{query}"</div>
              ) : (
                <div className="text-center text-smoke/50 py-10">Type at least 3 characters to search TMDb</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
