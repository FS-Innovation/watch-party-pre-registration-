"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  aiSegment: string;
  abVariant: "A" | "B";
  onNext: (question: string) => void;
}

export default function Step3Question({ aiSegment, abVariant, onNext }: Props) {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const enteredAt = useRef(Date.now());

  const handleSubmit = () => {
    if (!question.trim()) return;
    setSubmitting(true);

    trackEvent("question_submitted", {
      question_text: question.trim(),
      ab_variant: abVariant,
      word_count: question.trim().split(/\s+/).length,
      time_on_step: (Date.now() - enteredAt.current) / 1000,
      segment_at_time: aiSegment,
    });

    onNext(question.trim());
  };

  const handleSkip = () => {
    trackEvent("question_skipped", {
      ab_variant: abVariant,
      time_on_step: (Date.now() - enteredAt.current) / 1000,
    });
    onNext("");
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
          <span className="text-white text-xs">2 of 2</span>
        </motion.div>

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl text-white mb-4 leading-relaxed"
        >
          If you could ask Steven one thing about what goes on behind the diary — what would it be?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-doac-gray text-sm mb-10"
        >
          Your question might be answered live during the screening.
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="input-underline text-center text-lg mb-8"
            maxLength={300}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && question.trim()) handleSubmit();
            }}
          />

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
              className="bg-white text-black px-12 py-4 text-lg tracking-wide hover:bg-doac-gray transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Next"}
            </button>

            <button
              onClick={handleSkip}
              className="text-doac-gray/40 text-xs hover:text-doac-gray transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
