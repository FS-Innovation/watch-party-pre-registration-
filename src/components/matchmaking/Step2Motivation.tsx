"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  displayName: string;
  onNext: (motivationText: string) => void;
}

export default function Step2Motivation({ displayName, onNext }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const enteredAt = useRef(Date.now());

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSubmitting(true);

    trackEvent("motivation_submitted", {
      motivation_text: text.trim(),
      word_count: text.trim().split(/\s+/).length,
      time_on_step: (Date.now() - enteredAt.current) / 1000,
    });

    onNext(text.trim());
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 ambient-glow">
      <div className="w-full max-w-lg relative z-10">
        {/* Reel progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-end gap-2 mb-14"
        >
          <div className="w-[1px] h-4 bg-doac-sand" />
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-2 bg-white/10" />
          <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase ml-3">1 of 2</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-headline font-extrabold text-4xl md:text-5xl text-white mb-3 tracking-tighter leading-none uppercase"
        >
          WHAT BRINGS
          <br />
          YOU HERE{displayName ? "," : ""}
          {displayName && <br />}
          {displayName ? displayName.toUpperCase() : ""}?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-script text-doac-sand text-base -rotate-1 ml-1 mb-10"
        >
          this helps us shape the night
        </motion.p>

        {/* Text input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I'm here because..."
              className="w-full bg-[#0e0e0e] border-none text-white text-lg p-6 min-h-[160px] resize-none focus:outline-none placeholder:text-white/15 transition-all"
              maxLength={500}
              autoFocus
            />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 group-focus-within:bg-doac-sand/50 transition-all duration-500" />
          </div>

          <div className="flex justify-between items-center mt-3 mb-10">
            <span className="text-[10px] tracking-widest text-white/20 uppercase">
              {text.length}/500
            </span>
            {text.trim().split(/\s+/).filter(Boolean).length > 0 && (
              <span className="text-[10px] tracking-widest text-white/20 uppercase">
                {text.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="group flex items-center gap-3 font-headline font-bold text-xl tracking-tighter text-white hover:text-doac-sand transition-colors disabled:opacity-15 disabled:cursor-not-allowed"
            >
              {submitting ? "..." : "NEXT"}
              <span className="text-2xl group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
