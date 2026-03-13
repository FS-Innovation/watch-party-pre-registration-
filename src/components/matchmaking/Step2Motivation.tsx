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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <span className="text-doac-gray text-xs tracking-[0.2em]">QUICK INTRO</span>
          <span className="text-doac-gray/40 text-xs">&middot;</span>
          <span className="text-white text-xs">1 of 3</span>
        </motion.div>

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif text-2xl md:text-3xl text-white mb-4"
        >
          What brings you here tonight{displayName ? `, ${displayName}` : ""}?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-doac-gray text-sm mb-10"
        >
          Help us connect you with the right people and make this night unforgettable.
        </motion.p>

        {/* Text input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I'm here because..."
            className="w-full bg-transparent border border-white/20 text-white text-base p-5 min-h-[120px] resize-none focus:border-white/50 focus:outline-none transition-colors placeholder:text-white/20"
            maxLength={500}
            autoFocus
          />

          <div className="flex justify-between items-center mt-2 mb-8">
            <span className="text-doac-gray/30 text-xs">
              {text.length}/500
            </span>
            {text.trim().split(/\s+/).filter(Boolean).length > 0 && (
              <span className="text-doac-gray/30 text-xs">
                {text.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="bg-white text-black px-12 py-4 text-lg tracking-wide hover:bg-doac-gray transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing..." : "Next"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
