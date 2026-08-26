import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Film } from "lucide-react";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/spaces";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password, rememberMe);
      } else {
        await register(email, password, displayName);
      }
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <Film className="w-8 h-8 text-gold" />
            <h1 className="font-display text-5xl text-gold tracking-wider drop-shadow-[0_0_12px_rgba(232,178,61,0.5)]">
              SOFA SYNDICATE
            </h1>
          </div>
          <p className="text-smoke text-sm">Your shared cinema space</p>
        </div>

        {/* Card */}
        <div className="bg-velvet rounded-2xl p-8 border border-white/5 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex bg-midnight rounded-xl p-1 mb-8">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  mode === m ? "bg-velvet text-cream shadow" : "text-smoke hover:text-cream"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs text-smoke mb-1 font-mono">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-midnight border border-white/10 rounded-lg px-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-xs text-smoke mb-1 font-mono">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-midnight border border-white/10 rounded-lg px-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-smoke mb-1 font-mono">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-midnight border border-white/10 rounded-lg px-4 py-3 text-cream placeholder:text-smoke/50 outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            {error && (
              <p className="text-stub text-sm bg-stub/10 border border-stub/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            {mode === "login" && (
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div
                  onClick={() => setRememberMe(v => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    rememberMe
                      ? "bg-gold border-gold"
                      : "border-white/20 bg-midnight group-hover:border-gold/50"
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-midnight" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-smoke group-hover:text-cream transition-colors">
                  Remember me for 30 days
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold/90 text-midnight font-display text-xl tracking-wide py-3 rounded-lg transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-velvet mt-2"
            >
              {loading ? "..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
