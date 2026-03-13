"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  onComplete: () => void;
  minimumDelay?: number;
}

export default function Step4FindingCrew({ onComplete, minimumDelay = 4000 }: Props) {
  const startedAt = useRef(Date.now());
  const triggered = useRef(false);

  useEffect(() => {
    trackEvent("crew_matching_started");

    const timer = setTimeout(() => {
      if (!triggered.current) {
        triggered.current = true;
        onComplete();
      }
    }, minimumDelay);

    return () => clearTimeout(timer);
  }, [onComplete, minimumDelay]);

  // Notify parent immediately that it can start the API call
  // The minimum delay ensures the UI stays visible for at least 4s
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Premium DOAC-branded spinner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-14"
      >
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 border border-white/10 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 border border-white/20 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner pulse */}
          <motion.div
            className="absolute inset-4 border border-white/30 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Center dot */}
          <motion.div
            className="absolute inset-[42%] bg-doac-red rounded-full"
            animate={{
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center"
      >
        <h2 className="font-serif text-2xl md:text-3xl text-white mb-4">
          Finding your crew...
        </h2>
        <p className="text-doac-gray text-base">
          Matching you with people on your wavelength.
        </p>
      </motion.div>

      {/* Animated progress messages */}
      <div className="mt-10 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="text-doac-gray/40 text-xs"
        >
          Reading your answers...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="text-doac-gray/40 text-xs mt-2"
        >
          Finding people like you...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.5 }}
          className="text-doac-gray/40 text-xs mt-2"
        >
          Preparing your crew...
        </motion.p>
      </div>
    </div>
  );
}
