"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent, MatchmakingState } from "@/lib/types";
import { formatDateForTimezone, generateICS } from "@/lib/utils";
import CinemaTicket from "@/components/CinemaTicket";

interface Props {
  event: ScreeningEvent;
  state: MatchmakingState;
  onMeetGreetComplete?: (wants: boolean, why: string) => void;
}

type Phase = "sealed" | "flap-opening" | "pull" | "revealed";
type MeetGreetPhase = "hidden" | "ask" | "why" | "confirmed" | "declined";

const PULL_THRESHOLD = -160;

export default function Step7Envelope({ event, state, onMeetGreetComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [videoEnded, setVideoEnded] = useState(false);
  const [meetGreetPhase, setMeetGreetPhase] = useState<MeetGreetPhase>("hidden");
  const [whyText, setWhyText] = useState("");
  const [whyError, setWhyError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartRef = useRef(0);
  const meetGreetRef = useRef<HTMLDivElement>(null);

  // Drag values
  const pullY = useMotionValue(0);
  const pullOpacity = useTransform(pullY, [0, PULL_THRESHOLD], [0.6, 1]);

  // Tap to break the seal
  const handleSealTap = useCallback(() => {
    setPhase("flap-opening");
    trackEvent("envelope_opened", { ticket_number: state.ticketNumber });

    setTimeout(() => {
      setPhase("pull");
    }, 900);
  }, [state.ticketNumber]);

  // Single pull — reveals everything
  const handlePullEnd = useCallback(() => {
    const current = pullY.get();
    if (current < PULL_THRESHOLD) {
      animate(pullY, -500, {
        type: "spring",
        stiffness: 200,
        damping: 30,
        onComplete: () => {
          setPhase("revealed");
          trackEvent("ticket_claimed", { ticket_number: state.ticketNumber });
        },
      });
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }, [pullY, state.ticketNumber]);

  // Auto-play video when revealed
  useEffect(() => {
    if (phase === "revealed" && videoRef.current) {
      const t = setTimeout(() => {
        videoRef.current?.play().catch(() => {});
        videoStartRef.current = Date.now();
        trackEvent("postcard_video_played", { ticket_number: state.ticketNumber });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase, state.ticketNumber]);

  // Show meet-and-greet after video ends
  useEffect(() => {
    if (videoEnded && meetGreetPhase === "hidden") {
      const t = setTimeout(() => {
        setMeetGreetPhase("ask");
        // Scroll to meet-and-greet
        setTimeout(() => {
          meetGreetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [videoEnded, meetGreetPhase]);

  const handleMeetGreetYes = () => {
    trackEvent("meet_greet_interested", { wants: true });
    setMeetGreetPhase("why");
  };

  const handleMeetGreetNo = () => {
    trackEvent("meet_greet_interested", { wants: false });
    setMeetGreetPhase("declined");
    onMeetGreetComplete?.(false, "");
  };

  const handleMeetGreetSubmit = () => {
    if (!whyText.trim()) {
      setWhyError("Tell us in one sentence.");
      return;
    }
    trackEvent("meet_greet_why_submitted", {
      word_count: whyText.trim().split(/\s+/).length,
    });
    setMeetGreetPhase("confirmed");
    onMeetGreetComplete?.(true, whyText.trim());
  };

  const meetGreetDone = meetGreetPhase === "confirmed" || meetGreetPhase === "declined";

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

  const formattedDate = formatDateForTimezone(event.date, event.time, state.timezone || "UTC");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 select-none">
      {/* ===== SEALED ENVELOPE ===== */}
      {phase === "sealed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="cursor-pointer"
          onClick={handleSealTap}
        >
          <div className="w-80 h-56 md:w-[420px] md:h-[280px] relative">
            <div className="absolute inset-0 border border-white/20 bg-[#0a0a0a] rounded-sm" />
            <div
              className="absolute top-0 left-0 right-0 h-1/2 border-b border-white/10 rounded-t-sm"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 100%)",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 rounded-full bg-doac-red/20 border-2 border-doac-red/50 flex items-center justify-center shadow-[0_0_20px_rgba(233,69,96,0.15)]">
                <span className="font-serif text-doac-red text-[10px] font-bold tracking-[0.2em]">
                  BTD
                </span>
              </div>
            </div>
            <div className="absolute bottom-3 left-4 right-4 h-8 border border-white/5 bg-white/[0.02] rounded-sm" />
          </div>

          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-doac-gray text-sm text-center mt-8"
          >
            Tap to open
          </motion.p>
        </motion.div>
      )}

      {/* ===== FLAP OPENING ===== */}
      {phase === "flap-opening" && (
        <div className="w-80 h-56 md:w-[420px] md:h-[280px] relative">
          <div className="absolute inset-0 border border-white/20 bg-[#0a0a0a] rounded-sm" />
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 180 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "top center", perspective: 800 }}
            className="absolute top-0 left-0 right-0 h-1/2 z-20"
          >
            <div
              className="w-full h-full border-b border-white/10 bg-[#0a0a0a]"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
          </motion.div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -10 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute bottom-3 left-4 right-4 h-12 border border-white/10 bg-white/[0.03] rounded-sm"
          />
        </div>
      )}

      {/* ===== PULL TO REVEAL ===== */}
      {phase === "pull" && (
        <div className="relative">
          <div className="w-80 h-56 md:w-[420px] md:h-[280px] relative z-0">
            <div className="absolute inset-0 border border-white/20 bg-[#0a0a0a] rounded-sm" />
            <div
              className="absolute -top-[1px] left-0 right-0 h-1/2 border-t border-white/10"
              style={{
                background: "linear-gradient(0deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
                clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
              }}
            />
          </div>
          <motion.div
            drag="y"
            dragConstraints={{ top: -400, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handlePullEnd}
            style={{ y: pullY, opacity: pullOpacity }}
            className="absolute top-8 left-4 right-4 z-10 cursor-grab active:cursor-grabbing"
          >
            <div className="bg-[#0d0d0d] border border-white/15 p-5 rounded-sm shadow-[0_-4px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-serif text-lg tracking-[0.2em] text-white/80">BTD</span>
                <span className="text-white/40 text-xs">#{state.ticketNumber}</span>
              </div>
              <p className="text-white/60 text-sm">{state.displayName}</p>
              <p className="text-white/30 text-xs mt-1">{event.title}</p>
            </div>
            <motion.div
              animate={{ y: [-2, -8, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center mt-3"
            >
              <div className="w-5 h-5 border-l-2 border-t-2 border-white/30 rotate-45 -mb-1" />
              <p className="text-doac-gray/50 text-xs mt-2">Pull up to reveal</p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ===== EVERYTHING REVEALED ===== */}
      {phase === "revealed" && (
        <div className="w-full max-w-5xl">
          {/* Ticket + Video */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full md:w-1/2 md:max-w-md"
            >
              <CinemaTicket
                firstName={state.displayName}
                ticketNumber={state.ticketNumber}
                eventTitle={event.title}
                guestName={event.guest_name}
                formattedDate={formattedDate}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="w-full md:w-1/2 md:max-w-md"
            >
              <div className="w-full aspect-video relative overflow-hidden rounded-lg border border-white/10">
                <video
                  ref={videoRef}
                  src={event.postcard_video_url}
                  className="w-full h-full object-cover"
                  playsInline
                  poster={event.thumbnail_url}
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setVideoEnded(false);
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}
                  onEnded={() => {
                    setVideoEnded(true);
                    const duration = (Date.now() - videoStartRef.current) / 1000;
                    trackEvent("postcard_video_completed", {
                      watch_duration: duration,
                      completed: true,
                    });
                  }}
                />
              </div>
              <p className="text-doac-gray/40 text-xs text-center mt-3">
                A message from Steven
              </p>
            </motion.div>
          </div>

          {/* ===== MEET AND GREET — inline after video ===== */}
          <div ref={meetGreetRef}>
            <AnimatePresence mode="wait">
              {meetGreetPhase === "ask" && (
                <motion.div
                  key="mg-ask"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="mt-14 text-center"
                >
                  <p className="text-doac-gray text-xs tracking-[0.3em] uppercase mb-6">
                    One more thing
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-10 max-w-xl mx-auto">
                    5 people will get to meet Steven after the screening. Want to be considered?
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleMeetGreetYes}
                      className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleMeetGreetNo}
                      className="border border-white/40 text-white px-10 py-4 text-lg tracking-wide hover:border-white/70 transition-colors"
                    >
                      No
                    </button>
                  </div>
                </motion.div>
              )}

              {meetGreetPhase === "why" && (
                <motion.div
                  key="mg-why"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="mt-14 text-center max-w-lg mx-auto"
                >
                  <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-8">
                    In one sentence, why should it be you?
                  </h2>
                  <textarea
                    value={whyText}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setWhyText(e.target.value);
                        setWhyError("");
                      }
                    }}
                    placeholder="Tell us..."
                    className="w-full bg-transparent border border-white/20 text-white text-lg p-4 rounded-sm focus:outline-none focus:border-white/50 transition-colors resize-none select-text"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2 mb-6">
                    <p className="text-doac-gray/40 text-xs">{whyText.length}/200</p>
                    {whyError && <p className="text-doac-red text-sm">{whyError}</p>}
                  </div>
                  <button
                    onClick={handleMeetGreetSubmit}
                    className="bg-doac-red text-white px-10 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
                  >
                    Submit
                  </button>
                </motion.div>
              )}

              {meetGreetPhase === "confirmed" && (
                <motion.div
                  key="mg-confirmed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="mt-14 text-center"
                >
                  <h2 className="font-serif text-2xl md:text-3xl text-white leading-relaxed mb-4">
                    We&apos;ll let you know on the night.
                  </h2>
                  <p className="text-doac-gray text-base leading-relaxed">
                    Make sure you complete all polls during the screening to stay eligible.
                  </p>
                </motion.div>
              )}

              {meetGreetPhase === "declined" && (
                <motion.div
                  key="mg-declined"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="mt-14 text-center"
                >
                  <h2 className="font-serif text-xl md:text-2xl text-white/80 leading-relaxed">
                    No worries — we&apos;ll see you at the screening.
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== SHARE BUTTONS — appear after meet-and-greet is done ===== */}
          {meetGreetDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-12 relative"
            >
              <div
                className="absolute -inset-4 rounded-2xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
                }}
              />
              <div className="relative backdrop-blur-sm rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-6">
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
      )}
    </div>
  );
}
