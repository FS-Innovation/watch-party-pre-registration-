"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent, MatchmakingState } from "@/lib/types";
import { formatDateForTimezone, generateICS } from "@/lib/utils";
import CinemaTicket from "@/components/CinemaTicket";

interface Props {
  event: ScreeningEvent;
  state: MatchmakingState;
}

type Phase =
  | "sealed"
  | "flap-opening"
  | "pull-ticket"
  | "ticket-out"
  | "pull-postcard"
  | "postcard-out";

const PULL_THRESHOLD = -160; // How far up to drag before it "pops" out

export default function Step7Envelope({ event, state }: Props) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [ticketFullyOut, setTicketFullyOut] = useState(false);
  const [postcardFullyOut, setPostcardFullyOut] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartRef = useRef(0);

  // Drag values for ticket
  const ticketY = useMotionValue(0);
  const ticketOpacity = useTransform(ticketY, [0, PULL_THRESHOLD], [0.6, 1]);

  // Drag values for postcard
  const postcardY = useMotionValue(0);
  const postcardOpacity = useTransform(postcardY, [0, PULL_THRESHOLD], [0.6, 1]);

  // Tap to break the seal
  const handleSealTap = useCallback(() => {
    setPhase("flap-opening");
    trackEvent("envelope_opened", { ticket_number: state.ticketNumber });

    setTimeout(() => {
      setPhase("pull-ticket");
    }, 900);
  }, [state.ticketNumber]);

  // Ticket drag end
  const handleTicketDragEnd = useCallback(() => {
    const current = ticketY.get();
    if (current < PULL_THRESHOLD) {
      // Pulled far enough — animate it fully out
      animate(ticketY, -500, {
        type: "spring",
        stiffness: 200,
        damping: 30,
        onComplete: () => {
          setPhase("ticket-out");
          setTicketFullyOut(true);
          trackEvent("ticket_claimed", { ticket_number: state.ticketNumber });
        },
      });
    } else {
      // Snap back
      animate(ticketY, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }, [ticketY, state.ticketNumber]);

  // Postcard drag end
  const handlePostcardDragEnd = useCallback(() => {
    const current = postcardY.get();
    if (current < PULL_THRESHOLD) {
      animate(postcardY, -500, {
        type: "spring",
        stiffness: 200,
        damping: 30,
        onComplete: () => {
          setPhase("postcard-out");
          setPostcardFullyOut(true);
          trackEvent("postcard_revealed", { ticket_number: state.ticketNumber });
        },
      });
    } else {
      animate(postcardY, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }, [postcardY, state.ticketNumber]);

  // Auto-play video when postcard is fully out
  useEffect(() => {
    if (postcardFullyOut && videoRef.current) {
      videoRef.current.play().catch(() => {});
      videoStartRef.current = Date.now();
      trackEvent("postcard_video_played", { ticket_number: state.ticketNumber });
    }
  }, [postcardFullyOut, state.ticketNumber]);

  // Show "pull postcard" after ticket is out for a beat
  useEffect(() => {
    if (ticketFullyOut) {
      const t = setTimeout(() => setPhase("pull-postcard"), 1500);
      return () => clearTimeout(t);
    }
  }, [ticketFullyOut]);

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
            {/* Envelope back */}
            <div className="absolute inset-0 border border-white/20 bg-[#0a0a0a] rounded-sm" />

            {/* Flap (closed) */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 border-b border-white/10 rounded-t-sm"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 100%)",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
            />

            {/* Wax seal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 rounded-full bg-doac-red/20 border-2 border-doac-red/50 flex items-center justify-center shadow-[0_0_20px_rgba(233,69,96,0.15)]">
                <span className="font-serif text-doac-red text-[10px] font-bold tracking-[0.2em]">
                  BTD
                </span>
              </div>
            </div>

            {/* Peek of ticket inside */}
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

          {/* Flap opening animation */}
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

          {/* Peek of contents */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -10 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute bottom-3 left-4 right-4 h-12 border border-white/10 bg-white/[0.03] rounded-sm"
          />
        </div>
      )}

      {/* ===== PULL TICKET OUT ===== */}
      {phase === "pull-ticket" && (
        <div className="relative">
          {/* Envelope body (stays put) */}
          <div className="w-80 h-56 md:w-[420px] md:h-[280px] relative z-0">
            <div className="absolute inset-0 border border-white/20 bg-[#0a0a0a] rounded-sm" />
            {/* Open flap */}
            <div
              className="absolute -top-[1px] left-0 right-0 h-1/2 border-t border-white/10"
              style={{
                background: "linear-gradient(0deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
                clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
              }}
            />
          </div>

          {/* Draggable ticket (sitting inside envelope) */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -400, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleTicketDragEnd}
            style={{ y: ticketY, opacity: ticketOpacity }}
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

            {/* Pull hint */}
            <motion.div
              animate={{ y: [-2, -8, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center mt-3"
            >
              <div className="w-5 h-5 border-l-2 border-t-2 border-white/30 rotate-45 -mb-1" />
              <p className="text-doac-gray/50 text-xs mt-2">Pull up to reveal your ticket</p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ===== TICKET FULLY OUT ===== */}
      {(phase === "ticket-out" || phase === "pull-postcard") && !postcardFullyOut && (
        <div className="w-full max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-10">
            {/* Ticket side */}
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
                question={state.guestQuestion}
                crewEmoji={state.crewEmoji}
                crewName={state.crewName}
              />
            </motion.div>

            {/* Postcard side — envelope with draggable postcard */}
            {phase === "pull-postcard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full md:w-1/2 md:max-w-sm relative"
              >
                <p className="text-doac-gray/40 text-xs text-center mb-4">
                  There&apos;s something else in your envelope...
                </p>

                <div className="relative mx-auto w-72 h-44 md:w-80 md:h-48">
                  <div className="absolute inset-0 border border-white/15 bg-[#0a0a0a] rounded-sm" />
                  <div
                    className="absolute -top-[1px] left-0 right-0 h-1/2 border-t border-white/5"
                    style={{
                      clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
                      background: "linear-gradient(0deg, rgba(255,255,255,0.015) 0%, transparent 100%)",
                    }}
                  />

                  <motion.div
                    drag="y"
                    dragConstraints={{ top: -300, bottom: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handlePostcardDragEnd}
                    style={{ y: postcardY, opacity: postcardOpacity }}
                    className="absolute top-4 left-3 right-3 z-10 cursor-grab active:cursor-grabbing"
                  >
                    <div className="bg-[#0d0d0d] border border-white/15 rounded-sm overflow-hidden shadow-[0_-4px_30px_rgba(0,0,0,0.8)]">
                      <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                            <div className="w-0 h-0 border-l-[10px] border-l-white/60 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1" />
                          </div>
                          <p className="text-white/30 text-xs">Video from Steven</p>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ y: [-2, -8, -2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex flex-col items-center mt-3"
                    >
                      <div className="w-4 h-4 border-l-2 border-t-2 border-white/25 rotate-45 -mb-1" />
                      <p className="text-doac-gray/40 text-xs mt-2">Pull up</p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleShare("copy")} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Share your ticket</button>
              <button onClick={() => { const url = `${window.location.origin}/register?ref=${state.referralCode}`; navigator.clipboard.writeText(url); trackEvent("referral_link_generated", { referral_code: state.referralCode }); alert("Referral link copied!"); }} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Invite a friend</button>
              <button onClick={handleSaveCalendar} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Save the date</button>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <button onClick={() => handleShare("twitter")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">Twitter/X</button>
              <button onClick={() => handleShare("whatsapp")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">WhatsApp</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== POSTCARD FULLY OUT (video auto-plays) ===== */}
      {postcardFullyOut && (
        <div className="w-full max-w-5xl">
          {/* Side-by-side on desktop, stacked on mobile */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-10">
            {/* Ticket */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="w-full md:w-1/2 md:max-w-md"
            >
              <CinemaTicket
                firstName={state.displayName}
                ticketNumber={state.ticketNumber}
                eventTitle={event.title}
                guestName={event.guest_name}
                formattedDate={formattedDate}
                question={state.guestQuestion}
                crewEmoji={state.crewEmoji}
                crewName={state.crewName}
              />
            </motion.div>

            {/* Steven's Video Postcard */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="w-full md:w-1/2 md:max-w-sm"
            >
              <div className="w-full aspect-[3/4] relative overflow-hidden rounded-lg border border-white/10">
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
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}
                  onEnded={() => {
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

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleShare("copy")} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Share your ticket</button>
              <button onClick={() => { const url = `${window.location.origin}/register?ref=${state.referralCode}`; navigator.clipboard.writeText(url); trackEvent("referral_link_generated", { referral_code: state.referralCode }); alert("Referral link copied!"); }} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Invite a friend</button>
              <button onClick={handleSaveCalendar} className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors">Save the date</button>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <button onClick={() => handleShare("twitter")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">Twitter/X</button>
              <button onClick={() => handleShare("whatsapp")} className="text-doac-gray/50 text-xs hover:text-white transition-colors">WhatsApp</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
