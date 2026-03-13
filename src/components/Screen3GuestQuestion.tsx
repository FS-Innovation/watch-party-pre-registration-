"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent } from "@/lib/types";

interface Props {
  event: ScreeningEvent;
  onNext: (question: string) => void;
}

export default function Screen3GuestQuestion({ event, onNext }: Props) {
  const [question, setQuestion] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch question count
    fetch("/api/questions/count")
      .then((r) => r.json())
      .then((data) => setQuestionCount(data.count || 0))
      .catch(() => setQuestionCount(0));
  }, []);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setSubmitting(true);

    trackEvent("guest_question_submitted", {
      word_count: question.trim().split(/\s+/).length,
      event_id: event.id,
    });

    // Submit question to API for storage + AI tagging
    try {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          event_id: event.id,
        }),
      });
    } catch {
      // Continue even if API fails
    }

    onNext(question.trim());
  };

  const handleSkip = () => {
    trackEvent("guest_question_skipped", { event_id: event.id });
    onNext("");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Guest thumbnail as subtle background */}
      {event.thumbnail_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: `url(${event.thumbnail_url})` }}
        />
      )}

      <div className="relative z-10 w-full max-w-xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-2xl md:text-3xl text-white mb-12"
        >
          If you could ask {event.guest_name} one thing tonight, what would it
          be?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="input-underline text-center text-lg mb-8"
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && question.trim()) handleSubmit();
            }}
          />

          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
              className="bg-white text-black px-12 py-4 text-lg tracking-wide hover:bg-doac-gray transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>

            <button
              onClick={handleSkip}
              className="text-doac-gray text-xs hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>

          {questionCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-doac-gray text-sm mt-10"
            >
              {questionCount.toLocaleString()} questions submitted
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-doac-gray/60 text-xs mt-3"
          >
            Your question might be answered live.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
