"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  displayName: string;
  onCommit: () => void;
}

export default function Step4Commitment({
  displayName,
  onCommit,
}: Props) {
  const [showButton, setShowButton] = useState(false);
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleCommit = () => {
    const timeOnScreen = (Date.now() - screenEnteredAt.current) / 1000;
    trackEvent("commitment_confirmed", {
      display_name: displayName,
      time_spent_on_screen: timeOnScreen,
    });
    onCommit();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 ambient-glow">
      <div className="w-full max-w-lg relative z-10">
        {/* Reel progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-end gap-2 mb-14"
        >
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-4 bg-doac-sand" />
          <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase ml-3">Final step</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Headline */}
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-white tracking-tighter leading-none uppercase mb-3">
            ONE LAST
            <br />
            THING
          </h1>

          <p className="font-script text-doac-sand text-lg -rotate-2 ml-1 mb-12">
            this is a real commitment
          </p>

          {/* Event card */}
          <div className="bg-doac-surface-light border border-white/[0.06] p-8 mb-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-doac-teal/5 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="font-headline font-bold text-2xl tracking-tight mb-4 text-white">
                I&apos;LL BE THERE
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/50 text-sm">
                <span>Live screening</span>
                <span>&middot;</span>
                <span>One night only</span>
                <span>&middot;</span>
                <span>Via Zoom</span>
              </div>
              <p className="text-white/25 text-sm mt-4 border-l border-doac-teal/20 pl-4">
                This is a live, one-time screening. No replay. Your seat is held for you.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: showButton ? 1 : 0, y: showButton ? 0 : 10 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-4"
        >
          <button
            onClick={handleCommit}
            className="w-full py-5 font-headline font-bold tracking-[0.2em] text-white border border-white/20 hover:border-doac-teal hover:text-doac-teal transition-all duration-500 active:scale-[0.98]"
            style={{
              background: "linear-gradient(to bottom right, rgba(26,107,122,0.08), transparent)",
            }}
          >
            I&apos;LL BE THERE
          </button>

          <button
            onClick={handleCommit}
            className="w-full py-4 text-white/30 text-sm tracking-wide hover:text-white/60 transition-colors"
          >
            I&apos;m interested but unsure
          </button>
        </motion.div>
      </div>
    </div>
  );
}
