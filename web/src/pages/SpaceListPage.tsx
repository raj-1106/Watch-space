import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Space } from "../types";

export function SpaceListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [error, setError] = useState("");

  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => api.get("/spaces"),
  });

  const createSpace = useMutation({
    mutationFn: (name: string) => api.post<Space>("/spaces", { name }),
    onSuccess: (space) => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      setShowCreate(false);
      setSpaceName("");
      navigate(`/spaces/${space.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;
    setError("");
    createSpace.mutate(spaceName.trim());
  };

  return (
    <div className="min-h-screen bg-midnight p-6 lg:p-12 font-body">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="font-display text-5xl text-gold tracking-wider mb-2">YOUR SPACES</h1>
          <p className="text-smoke">Select a space or create a new one to get started.</p>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-velvet/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {spaces.map((space) => (
                <motion.button
                  key={space.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  onClick={() => navigate(`/spaces/${space.id}`)}
                  className="w-full bg-velvet hover:bg-velvet/80 border border-white/5 hover:border-gold/30 rounded-xl p-5 flex items-center justify-between transition-all group outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-display text-xl text-cream tracking-wide">{space.name}</p>
                      <p className="text-xs text-smoke font-mono capitalize">{space.role?.toLowerCase()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-smoke group-hover:text-gold transition-colors" />
                </motion.button>
              ))}
            </AnimatePresence>

            {spaces.length === 0 && (
              <p className="text-center text-smoke py-16">No spaces yet. Create one below!</p>
            )}
          </div>
        )}

        {/* Create space */}
        <AnimatePresence>
          {showCreate ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="bg-velvet border border-gold/20 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-display text-xl text-gold">NEW SPACE</h2>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Friday Movie Night"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="w-full bg-midnight border border-white/10 rounded-lg px-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
              />
              {error && <p className="text-stub text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createSpace.isPending}
                  className="flex-1 bg-gold hover:bg-gold/90 text-midnight font-display text-lg tracking-wide py-2.5 rounded-lg transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {createSpace.isPending ? "CREATING..." : "CREATE"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError(""); }}
                  className="px-5 py-2.5 text-smoke hover:text-cream rounded-lg border border-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="cta"
              onClick={() => setShowCreate(true)}
              className="w-full border-2 border-dashed border-white/10 hover:border-gold/40 rounded-xl p-5 flex items-center justify-center gap-3 text-smoke hover:text-gold transition-all outline-none focus-visible:ring-2 focus-visible:ring-gold group"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create a new space</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
