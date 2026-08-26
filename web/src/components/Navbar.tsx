import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Film, ChevronDown, Plus, LogOut, UserPlus, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Space } from "../types";

interface NavbarProps {
  currentSpaceId?: string;
  onAddClick?: () => void;
}

function InviteModal({ spaceId, onClose }: { spaceId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const invite = useMutation({
    mutationFn: (email: string) =>
      api.post<{ token: string; joinUrl: string }>(`/spaces/${spaceId}/invite`, { email }),
    onSuccess: (data) => setJoinUrl(data.joinUrl),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-velvet border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl text-cream">Invite to Space</h2>
            <p className="text-smoke text-xs mt-0.5">Generates a 7-day join link for that email</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-smoke hover:text-cream rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!joinUrl ? (
          <form
            onSubmit={(e) => { e.preventDefault(); invite.mutate(email); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-mono text-smoke mb-1">Friend's Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="friend@example.com"
                className="w-full bg-midnight border border-white/10 rounded-lg px-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {invite.isError && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {(invite.error as any)?.message || "Something went wrong"}
              </p>
            )}

            <button
              type="submit"
              disabled={invite.isPending}
              className="w-full bg-gold hover:bg-gold/90 text-midnight font-display text-lg tracking-wide py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {invite.isPending ? "Generating..." : "GENERATE LINK"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-smoke text-sm">
              Share this link with <span className="text-gold font-medium">{email}</span>. It expires in 7 days.
            </p>

            <div className="flex gap-2">
              <div className="flex-1 min-w-0 bg-midnight border border-white/10 rounded-lg px-3 py-2.5">
                <p className="text-cream text-xs font-mono truncate">{joinUrl}</p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-medium text-sm transition-all
                  ${copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gold/10 text-gold hover:bg-gold hover:text-midnight border border-gold/30"}`}
              >
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>

            <button
              onClick={() => { setJoinUrl(""); setEmail(""); }}
              className="w-full text-smoke hover:text-cream text-sm py-2 transition-colors"
            >
              Invite someone else →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function Navbar({ currentSpaceId, onAddClick }: NavbarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => api.get("/spaces"),
  });

  const activeSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-midnight/95 backdrop-blur border-b border-white/5 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Branding & Space Switcher */}
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/spaces" className="flex items-center gap-2 shrink-0 group outline-none focus-visible:ring-2 focus-visible:ring-gold rounded">
              <Film className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
              <span className="font-display text-2xl text-gold tracking-wide hidden sm:block">SOFA SYNDICATE</span>
            </Link>

            {activeSpace && (
              <>
                <div className="w-px h-6 bg-white/10 shrink-0 hidden sm:block" />
                <div className="relative min-w-0">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-2 py-1 -ml-2 min-w-0"
                  >
                    <span className="font-display text-xl text-cream truncate">{activeSpace.name}</span>
                    <ChevronDown className="w-4 h-4 text-smoke shrink-0" />
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-56 bg-velvet border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-2">
                        <div className="px-3 py-2 text-xs font-mono text-smoke uppercase tracking-wider">Switch Space</div>
                        {spaces.map((space) => (
                          <Link
                            key={space.id}
                            to={`/spaces/${space.id}`}
                            onClick={() => setMenuOpen(false)}
                            className={`block px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 ${
                              space.id === currentSpaceId ? "text-gold" : "text-cream"
                            }`}
                          >
                            {space.name}
                          </Link>
                        ))}
                        <div className="border-t border-white/5 mt-2 pt-2">
                          <Link
                            to="/spaces"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-smoke hover:text-cream transition-colors"
                          >
                            View all spaces
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {activeSpace && (
              <button
                onClick={() => setInviteOpen(true)}
                title="Invite someone"
                className="flex items-center gap-2 text-smoke hover:text-cream px-3 py-2 rounded-full hover:bg-white/5 transition-colors text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}

            {activeSpace && onAddClick && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-gold/10 hover:bg-gold text-gold hover:text-midnight px-3 sm:px-4 py-2 rounded-full transition-colors group text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Title</span>
              </button>
            )}

            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Log out"
              className="p-2 text-smoke hover:text-cream rounded-full hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {inviteOpen && currentSpaceId && (
          <InviteModal spaceId={currentSpaceId} onClose={() => setInviteOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
