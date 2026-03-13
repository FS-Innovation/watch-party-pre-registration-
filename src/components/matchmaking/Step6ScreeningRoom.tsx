"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { MatchmakingState, DEMO_EVENT } from "@/lib/types";

interface Props {
  state: MatchmakingState;
}

export default function Step6ScreeningRoom({ state }: Props) {
  useEffect(() => {
    trackEvent("screening_joined", {
      crew_id: state.crewId,
      crew_name: state.crewName,
    });
  }, [state.crewId, state.crewName]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        {/* Crew badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 mb-10"
        >
          <span className="text-lg">{state.crewEmoji}</span>
          <span className="text-white text-sm">{state.crewName}</span>
        </motion.div>

        {/* Welcome message */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="font-serif text-3xl md:text-4xl text-white mb-6"
        >
          You&apos;re in, {state.displayName}.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-doac-gray text-lg mb-10 leading-relaxed"
        >
          Welcome to the {state.crewName} section.
          <br />
          Your screening of <span className="text-white">{DEMO_EVENT.title}</span> with{" "}
          <span className="text-white">{DEMO_EVENT.guest_name}</span> is about to begin.
        </motion.p>

        {/* Screening info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="border border-white/10 p-8 text-left mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-doac-gray text-xs tracking-[0.2em] mb-1">
                BEHIND THE DIARY
              </p>
              <p className="font-serif text-xl text-white">
                {DEMO_EVENT.title}
              </p>
              <p className="text-doac-gray text-sm mt-1">
                with {DEMO_EVENT.guest_name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl">{state.crewEmoji}</span>
              <p className="text-doac-gray text-xs mt-1">{state.crewName}</p>
            </div>
          </div>

          {state.guestQuestion && (
            <div className="border-t border-white/5 pt-4">
              <p className="text-doac-gray text-xs tracking-[0.15em] mb-1">YOUR QUESTION</p>
              <p className="text-white/70 text-sm italic">
                &ldquo;{state.guestQuestion}&rdquo;
              </p>
            </div>
          )}
        </motion.div>

        {/* Pre-show state */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <motion.div
              className="w-2 h-2 rounded-full bg-doac-red"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-doac-gray text-sm">Pre-show</span>
          </div>
          <p className="text-doac-gray/40 text-xs">
            The screening room is filling up. Sit tight — we start soon.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
