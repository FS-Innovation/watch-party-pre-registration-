"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  onNext: () => void;
}

export default function Screen5Commitment({ onNext }: Props) {
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    const t1 = setTimeout(() => setShowSecondLine(true), 2000);
    const t2 = setTimeout(() => setShowButton(true), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleCommit = () => {
    const timeOnScreen = (Date.now() - screenEnteredAt.current) / 1000;
    trackEvent("commitment_confirmed", { time_spent_on_screen: timeOnScreen });
    onNext();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
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
    </div>
  );
}
