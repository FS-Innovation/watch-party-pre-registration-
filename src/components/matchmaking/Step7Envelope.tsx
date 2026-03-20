"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent, MatchmakingState } from "@/lib/types";
import { formatDateForTimezone } from "@/lib/utils";
import CinemaTicket from "@/components/CinemaTicket";

interface Props {
  event: ScreeningEvent;
  state: MatchmakingState;
  onNext?: () => void;
}

type Phase = "sealed" | "flap-opening" | "pull" | "revealed";

const PULL_THRESHOLD = -160;

export default function Step7Envelope({ event, state, onNext }: Props) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [videoEnded, setVideoEnded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartRef = useRef(0);

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
      // Small delay so the layout settles first
      const t = setTimeout(() => {
        videoRef.current?.play().catch(() => {});
        videoStartRef.current = Date.now();
        trackEvent("postcard_video_played", { ticket_number: state.ticketNumber });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase, state.ticketNumber]);

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
          {/* Envelope body */}
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

          {/* Draggable contents */}
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
          <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-10">
            {/* Ticket */}
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

            {/* Steven's Video Postcard */}
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

          {/* Continue to meet and greet — appears after video ends */}
          {onNext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: videoEnded ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-10 text-center"
            >
              <button
                onClick={onNext}
                className="border border-white/60 text-white px-12 py-4 text-lg tracking-wide hover:border-white transition-colors"
              >
                Continue
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
