"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  crewName: string;
  crewEmoji: string;
  crewId: string;
  aiSegment: string;
  displayName: string;
  onCommit: () => void;
}

export default function Step5CrewReveal({
  crewName,
  crewEmoji,
  crewId,
  aiSegment,
  displayName,
  onCommit,
}: Props) {
  const [phase, setPhase] = useState<"crew" | "commitment">("crew");
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    trackEvent("crew_assigned", {
      crew_id: crewId,
      crew_name: crewName,
      segment: aiSegment,
    });

    // Show crew badge briefly, then transition to commitment
    const t0 = setTimeout(() => setPhase("commitment"), 2500);
    return () => clearTimeout(t0);
  }, [crewId, crewName, aiSegment]);

  useEffect(() => {
    if (phase !== "commitment") return;

    const t1 = setTimeout(() => setShowSecondLine(true), 2000);
    const t2 = setTimeout(() => setShowButton(true), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  const handleCommit = () => {
    const timeOnScreen = (Date.now() - screenEnteredAt.current) / 1000;
    trackEvent("crew_accepted", {
      crew_id: crewId,
      crew_name: crewName,
      time_on_reveal_screen: timeOnScreen,
    });
    trackEvent("commitment_confirmed", { time_spent_on_screen: timeOnScreen });
    onCommit();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {phase === "crew" && (
          <motion.div
            key="crew"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-doac-gray text-xs tracking-[0.3em] uppercase mb-6">
              You&apos;re watching with
            </p>
            <span className="text-6xl block mb-4">{crewEmoji}</span>
            <h2 className="font-serif text-4xl md:text-5xl text-white">
              {crewName}
            </h2>
          </motion.div>
        )}

        {phase === "commitment" && (
          <motion.div
            key="commitment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="font-serif text-2xl md:text-3xl text-white text-center max-w-lg leading-relaxed"
            >
              This screening happens once.
              <br />
              When the doors open, be there.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showSecondLine ? 1 : 0 }}
              transition={{ duration: 1.5 }}
              className="text-doac-gray text-lg text-center mt-8 max-w-md"
            >
              If you can&apos;t make it, give your seat to someone who will.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showButton ? 1 : 0, y: showButton ? 0 : 10 }}
              transition={{ duration: 0.8 }}
              className="mt-14"
            >
              <button
                onClick={handleCommit}
                className="border border-white/60 text-white px-12 py-4 text-lg tracking-wide hover:border-white transition-colors"
              >
                I&apos;ll be there
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
