"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  displayName: string;
  registrationId: string | null;
  onComplete: (wants: boolean, why: string) => void;
}

export default function Step9MeetAndGreet({ displayName, registrationId, onComplete }: Props) {
  const [phase, setPhase] = useState<"ask" | "why" | "confirmed" | "declined">("ask");
  const [whyText, setWhyText] = useState("");
  const [error, setError] = useState("");

  const handleYes = () => {
    trackEvent("meet_greet_interested", {
      registration_id: registrationId,
      wants: true,
    });
    setPhase("why");
  };

  const handleNo = () => {
    trackEvent("meet_greet_interested", {
      registration_id: registrationId,
      wants: false,
    });
    setPhase("declined");
    setTimeout(() => onComplete(false, ""), 2000);
  };

  const handleSubmitWhy = () => {
    if (!whyText.trim()) {
      setError("Tell us in one sentence.");
      return;
    }
    trackEvent("meet_greet_why_submitted", {
      registration_id: registrationId,
      word_count: whyText.trim().split(/\s+/).length,
    });
    setPhase("confirmed");
    setTimeout(() => onComplete(true, whyText.trim()), 2500);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {phase === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg"
          >
            <p className="text-doac-gray text-xs tracking-[0.3em] uppercase mb-8">
              One more thing
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-12">
              5 people will get to meet Steven after the screening. Want to be considered?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleYes}
                className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
              >
                Yes
              </button>
              <button
                onClick={handleNo}
                className="border border-white/40 text-white px-10 py-4 text-lg tracking-wide hover:border-white/70 transition-colors"
              >
                No
              </button>
            </div>
          </motion.div>
        )}

        {phase === "why" && (
          <motion.div
            key="why"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg w-full"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-10">
              In one sentence, why should it be you?
            </h2>
            <textarea
              value={whyText}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setWhyText(e.target.value);
                  setError("");
                }
              }}
              placeholder="Tell us..."
              className="w-full bg-transparent border border-white/20 text-white text-lg p-4 rounded-sm focus:outline-none focus:border-white/50 transition-colors resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2 mb-8">
              <p className="text-doac-gray/40 text-xs">
                {whyText.length}/200
              </p>
              {error && <p className="text-doac-red text-sm">{error}</p>}
            </div>
            <button
              onClick={handleSubmitWhy}
              className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          </motion.div>
        )}

        {phase === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-6">
              We&apos;ll let you know on the night.
            </h2>
            <p className="text-doac-gray text-base leading-relaxed">
              Make sure you complete all polls during the screening to stay eligible.
            </p>
          </motion.div>
        )}

        {phase === "declined" && (
          <motion.div
            key="declined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed">
              No worries — we&apos;ll see you at the screening.
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
