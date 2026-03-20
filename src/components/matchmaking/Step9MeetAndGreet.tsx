"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent, MatchmakingState } from "@/lib/types";
import { formatDateForTimezone, generateICS } from "@/lib/utils";

interface Props {
  displayName: string;
  registrationId: string | null;
  event: ScreeningEvent;
  state: MatchmakingState;
  onComplete: (wants: boolean, why: string) => void;
}

export default function Step9MeetAndGreet({ displayName, registrationId, event, state, onComplete }: Props) {
  const [phase, setPhase] = useState<"ask" | "why" | "confirmed" | "declined">("ask");
  const [whyText, setWhyText] = useState("");
  const [error, setError] = useState("");

  const handleYes = () => {
    trackEvent("meet_greet_interested", {
      registration_id: registrationId,
      wants: true,
    });
    setPhase("why");
  };

  const handleNo = () => {
    trackEvent("meet_greet_interested", {
      registration_id: registrationId,
      wants: false,
    });
    onComplete(false, "");
    setPhase("declined");
  };

  const handleSubmitWhy = () => {
    if (!whyText.trim()) {
      setError("Tell us in one sentence.");
      return;
    }
    trackEvent("meet_greet_why_submitted", {
      registration_id: registrationId,
      word_count: whyText.trim().split(/\s+/).length,
    });
    onComplete(true, whyText.trim());
    setPhase("confirmed");
  };

  const handleShare = async (method: string) => {
    trackEvent("ticket_shared", { share_method: method, ticket_number: state.ticketNumber });
    const refUrl = `${window.location.origin}/register?ref=${state.referralCode}`;

    if (method === "copy") {
      await navigator.clipboard.writeText(refUrl);
      alert("Link copied!");
    } else if (method === "twitter") {
      const text = encodeURIComponent(
        `I just got my ticket to the Behind The Diary screening of "${event.title}" with ${event.guest_name}. Grab yours:`
      );
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(refUrl)}`, "_blank");
    } else if (method === "whatsapp") {
      const text = encodeURIComponent(
        `I just got my ticket to the Behind The Diary screening. Join me: ${refUrl}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  const handleSaveCalendar = () => {
    const ics = generateICS(
      `Behind The Diary: ${event.title}`,
      `Private screening with ${event.guest_name}`,
      event.date,
      event.time
    );
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "behind-the-diary-screening.ics";
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("calendar_saved", { ticket_number: state.ticketNumber });
  };

  const isDone = phase === "confirmed" || phase === "declined";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {phase === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg"
          >
            <p className="text-doac-gray text-xs tracking-[0.3em] uppercase mb-8">
              One more thing
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-12">
              5 people will get to meet Steven after the screening. Want to be considered?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleYes}
                className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
              >
                Yes
              </button>
              <button
                onClick={handleNo}
                className="border border-white/40 text-white px-10 py-4 text-lg tracking-wide hover:border-white/70 transition-colors"
              >
                No
              </button>
            </div>
          </motion.div>
        )}

        {phase === "why" && (
          <motion.div
            key="why"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg w-full"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-10">
              In one sentence, why should it be you?
            </h2>
            <textarea
              value={whyText}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setWhyText(e.target.value);
                  setError("");
                }
              }}
              placeholder="Tell us..."
              className="w-full bg-transparent border border-white/20 text-white text-lg p-4 rounded-sm focus:outline-none focus:border-white/50 transition-colors resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2 mb-8">
              <p className="text-doac-gray/40 text-xs">
                {whyText.length}/200
              </p>
              {error && <p className="text-doac-red text-sm">{error}</p>}
            </div>
            <button
              onClick={handleSubmitWhy}
              className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          </motion.div>
        )}

        {phase === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-6">
              We&apos;ll let you know on the night.
            </h2>
            <p className="text-doac-gray text-base leading-relaxed">
              Make sure you complete all polls during the screening to stay eligible.
            </p>
          </motion.div>
        )}

        {phase === "declined" && (
          <motion.div
            key="declined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed">
              No worries — we&apos;ll see you at the screening.
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share buttons — appear after meet-and-greet is answered */}
      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-14 relative w-full max-w-lg"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.2 }}
            className="absolute -inset-4 rounded-2xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="relative backdrop-blur-sm rounded-xl border border-white/12 bg-white/[0.04] px-6 py-6">
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleShare("copy")} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Share your ticket</button>
              <button onClick={() => { const url = `${window.location.origin}/register?ref=${state.referralCode}`; navigator.clipboard.writeText(url); trackEvent("referral_link_generated", { referral_code: state.referralCode }); alert("Referral link copied!"); }} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Invite a friend</button>
              <button onClick={handleSaveCalendar} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Save the date</button>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <button onClick={() => handleShare("twitter")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">Twitter/X</button>
              <button onClick={() => handleShare("whatsapp")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">WhatsApp</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
