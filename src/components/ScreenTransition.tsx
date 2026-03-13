"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ScreenTransitionProps {
  screenKey: number;
  children: ReactNode;
}

export default function ScreenTransition({ screenKey, children }: ScreenTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
