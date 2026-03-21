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
          <div className="w-[1px] h-4 bg-doac-sand" />
          <div className="w-[1px] h-2 bg-white/10" />
          <div className="w-[1px] h-2 bg-white/10" />
          <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase ml-3">2 of 2</span>
        </motion.div>

        {/* Script personal note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-script text-doac-sand text-lg -rotate-2 mb-6"
        >
          your question might get answered live
        </motion.p>

        {/* The question */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-headline font-black text-2xl md:text-3xl lg:text-4xl text-white mb-4 tracking-tighter leading-[0.95] uppercase"
        >
          IF YOU COULD ASK STEVEN ONE THING ABOUT WHAT GOES ON BEHIND THE DIARY — WHAT WOULD IT BE?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white/30 text-xs tracking-wide mb-10 italic"
        >
          Your question might be answered live during the screening.
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative group">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Your question..."
              className="input-glow text-lg"
              maxLength={300}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && question.trim()) handleSubmit();
              }}
            />
          </div>
          <div className="flex justify-end mt-2 mb-10">
            <span className="text-[10px] tracking-widest text-white/20 uppercase">{question.length}/300</span>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
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
