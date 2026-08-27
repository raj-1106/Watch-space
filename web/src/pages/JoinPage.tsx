import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoading) return; // wait for session to resolve from cookie

    if (!user) {
      navigate(`/login?next=/join/${token}`);
      return;
    }

    api.post<{ spaceId: string }>(`/spaces/invitations/${token}/accept`, {})
      .then(({ spaceId }) => {
        queryClient.invalidateQueries({ queryKey: ["spaces"] });
        setStatus("success");
        setTimeout(() => navigate(`/spaces/${spaceId}`), 1500);
      })
      .catch((err: Error) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token, user, navigate, isLoading, queryClient]);

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 font-body">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-velvet rounded-2xl p-10 border border-white/5 text-center max-w-sm w-full"
      >
        {status === "loading" && (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-smoke">Joining space...</p>
          </>
        )}
        {status === "success" && (
          <>
            <p className="font-display text-4xl text-gold mb-2">JOINED!</p>
            <p className="text-smoke text-sm">Redirecting you to the space...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="font-display text-3xl text-stub mb-2">OOPS</p>
            <p className="text-smoke text-sm">{message || "This invite link is invalid or expired."}</p>
            <button
              onClick={() => navigate("/spaces")}
              className="mt-6 px-6 py-2 bg-gold text-midnight rounded-full font-display text-lg"
            >
              GO HOME
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
