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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <motion.div
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
    </div>
  );
}
