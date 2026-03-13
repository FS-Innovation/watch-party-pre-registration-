"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { CREW_SEGMENTS } from "@/lib/types";

interface Props {
  aiSegment: string;
  abVariant: "A" | "B";
  onNext: (question: string) => void;
}

// Segment-contextual question topics for variant A
const SEGMENT_TOPICS: Record<string, string> = {
  "meaning-seeker": "finding your purpose and sitting with life\u2019s biggest questions",
  builder: "what it takes to build something meaningful",
  creative: "the creative process and the craft behind great content",
  connector: "building meaningful connections and bringing people together",
};

export default function Step3Question({ aiSegment, abVariant, onNext }: Props) {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const enteredAt = useRef(Date.now());

  const segmentTopic = SEGMENT_TOPICS[aiSegment] || "life, work, and everything in between";
  const segmentInfo = CREW_SEGMENTS[aiSegment];

  const questionText =
    abVariant === "A"
      ? `If you could ask Steven one thing about ${segmentTopic} \u2014 what would it be?`
      : "If you could ask Steven anything, what would it be?";

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
          <span className="text-white text-xs">2 of 3</span>
        </motion.div>

        {/* Segment hint (for variant A) */}
        {abVariant === "A" && segmentInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <span className="text-doac-gray/50 text-xs border border-white/10 px-3 py-1">
              {segmentInfo.emoji} {segmentInfo.name}
            </span>
          </motion.div>
        )}

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl text-white mb-4 leading-relaxed"
        >
          {questionText}
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
