import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageSquarePlus, X, Bug, Lightbulb } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

type FeedbackType = "BUG" | "SUGGESTION";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("BUG");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reducedMotion = useReducedMotion();

  const submit = useMutation({
    mutationFn: () =>
      api.post("/feedback", { type, message: message.trim(), pageUrl: window.location.pathname }),
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length === 0 || submit.isPending) return;
    submit.mutate();
  };

  return (
    <>
      {/* Floating trigger — bottom-left, so it never collides with the update banner (bottom-center) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Report a bug or suggest something"
        className="fixed bottom-4 left-4 z-40 w-11 h-11 rounded-full bg-velvet border border-white/10
          flex items-center justify-center text-smoke hover:text-gold hover:border-gold/30
          transition-colors shadow-lg shadow-black/40"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submit.isPending && setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal: bottom sheet on mobile, centered card on desktop — matches the AddFilmModal pattern */}
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2
                sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50
                bg-velvet rounded-t-2xl sm:rounded-2xl border border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-cream tracking-wide">SEND FEEDBACK</h2>
                <button
                  onClick={() => !submit.isPending && setOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-smoke hover:text-cream hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitted ? (
                <div className="py-8 text-center">
                  <p className="font-display text-gold text-xl tracking-wide">THANKS!</p>
                  <p className="text-smoke text-sm mt-1">Got it — appreciate you flagging it.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Type toggle */}
                  <div className="flex gap-2" role="radiogroup" aria-label="Feedback type">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={type === "BUG"}
                      onClick={() => setType("BUG")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${type === "BUG" ? "bg-stub/20 border border-stub/40 text-stub" : "bg-white/5 border border-transparent text-smoke hover:bg-white/10"}`}
                    >
                      <Bug className="w-4 h-4" /> Bug
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={type === "SUGGESTION"}
                      onClick={() => setType("SUGGESTION")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${type === "SUGGESTION" ? "bg-gold/20 border border-gold/40 text-gold" : "bg-white/5 border border-transparent text-smoke hover:bg-white/10"}`}
                    >
                      <Lightbulb className="w-4 h-4" /> Suggestion
                    </button>
                  </div>

                  <div>
                    <label htmlFor="feedback-message" className="sr-only">
                      {type === "BUG" ? "Describe the bug" : "Describe your suggestion"}
                    </label>
                    <textarea
                      id="feedback-message"
                      autoFocus
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder={
                        type === "BUG"
                          ? "What happened? What did you expect instead?"
                          : "What would make this better?"
                      }
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-cream
                        placeholder:text-smoke/60 focus:outline-none focus:ring-1 focus:ring-gold/40 resize-none"
                    />
                    <p className="text-right font-mono text-[10px] text-smoke/50 mt-1">{message.length}/2000</p>
                  </div>

                  {submit.isError && (
                    <p className="text-xs text-stub">Couldn't send that — try again in a moment.</p>
                  )}

                  <button
                    type="submit"
                    disabled={message.trim().length === 0 || submit.isPending}
                    className="w-full py-3 rounded-xl bg-gold text-midnight font-display tracking-wide
                      disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submit.isPending ? "SENDING…" : "SEND"}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
