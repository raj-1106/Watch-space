import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Film, ChevronDown, Plus, LogOut } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Space } from "../types";

interface NavbarProps {
  currentSpaceId?: string;
  onAddClick?: () => void;
}

export function Navbar({ currentSpaceId, onAddClick }: NavbarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => api.get("/spaces"),
  });

  const activeSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
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
        <div className="flex items-center gap-3 shrink-0">
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
  );
}
