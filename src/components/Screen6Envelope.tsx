"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent, RegistrationState } from "@/lib/types";
import { formatDateForTimezone, generateICS } from "@/lib/utils";
import CinemaTicket from "./CinemaTicket";

interface Props {
  event: ScreeningEvent;
  state: RegistrationState;
}

export default function Screen6Envelope({ event, state }: Props) {
  const [phase, setPhase] = useState<"sealed" | "opening" | "ticket" | "postcard">("sealed");
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartRef = useRef(0);

  const handleOpen = () => {
    setPhase("opening");
    trackEvent("envelope_opened", { ticket_number: state.ticketNumber });

    setTimeout(() => {
      setPhase("ticket");
      trackEvent("ticket_claimed", { ticket_number: state.ticketNumber });

      // Reveal postcard after a beat
      setTimeout(() => setPhase("postcard"), 2000);
    }, 1200);
  };

  const handleShare = async (method: string) => {
    trackEvent("ticket_shared", {
      share_method: method,
      ticket_number: state.ticketNumber,
    });

    if (method === "copy") {
      const url = `${window.location.origin}/register?ref=${state.referralCode}`;
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } else if (method === "twitter") {
      const text = encodeURIComponent(
        `I just got my ticket to the DOAC screening of "${event.title}" with ${event.guest_name}. Grab yours:`
      );
      const url = encodeURIComponent(
        `${window.location.origin}/register?ref=${state.referralCode}`
      );
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    } else if (method === "whatsapp") {
      const text = encodeURIComponent(
        `I just got my ticket to the DOAC screening. Join me: ${window.location.origin}/register?ref=${state.referralCode}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  const handleSaveCalendar = () => {
    const ics = generateICS(
      `DOAC Screening: ${event.title}`,
      `Watch party with ${event.guest_name}`,
      event.date,
      event.time
    );
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doac-screening.ics";
    a.click();
    URL.revokeObjectURL(url);

    trackEvent("calendar_saved", { ticket_number: state.ticketNumber });
  };

  const handleReferral = () => {
    const url = `${window.location.origin}/register?ref=${state.referralCode}`;
    navigator.clipboard.writeText(url);
    trackEvent("referral_link_generated", { referral_code: state.referralCode });
    alert("Referral link copied!");
  };

  const formattedDate = formatDateForTimezone(event.date, event.time, state.timezone || "UTC");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {/* Sealed Envelope */}
        {phase === "sealed" && (
          <motion.div
            key="sealed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="cursor-pointer"
            onClick={handleOpen}
          >
            <div className="w-80 h-56 md:w-96 md:h-64 relative flex items-center justify-center">
              {/* Envelope body */}
              <div className="absolute inset-0 border border-white/30 bg-black">
                {/* Flap */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 border-b border-white/20"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
                  }}
                />
                {/* Wax seal */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-doac-red/60 flex items-center justify-center">
                  <span className="font-serif text-doac-red text-sm font-bold tracking-widest">
                    DOAC
                  </span>
                </div>
              </div>
            </div>
            <p className="text-doac-gray text-sm text-center mt-6 animate-pulse">
              Tap to open
            </p>
          </motion.div>
        )}

        {/* Opening animation */}
        {phase === "opening" && (
          <motion.div
            key="opening"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className="w-80 h-56 md:w-96 md:h-64 relative"
          >
            <div className="absolute inset-0 border border-white/30 bg-black">
              {/* Flap opening */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{ rotateX: 180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute top-0 left-0 right-0 h-1/2 border-b border-white/20 bg-black"
              />
            </div>
          </motion.div>
        )}

        {/* Ticket revealed */}
        {(phase === "ticket" || phase === "postcard") && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            <CinemaTicket
              firstName={state.firstName}
              ticketNumber={state.ticketNumber}
              eventTitle={event.title}
              guestName={event.guest_name}
              formattedDate={formattedDate}
              question={state.guestQuestion}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={() => handleShare("copy")}
                className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors"
              >
                Share your ticket
              </button>
              <button
                onClick={handleReferral}
                className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors"
              >
                Invite a friend
              </button>
              <button
                onClick={handleSaveCalendar}
                className="text-doac-gray text-sm border border-white/20 px-5 py-2 hover:border-white/50 transition-colors"
              >
                Save the date
              </button>
            </div>

            {/* Social share icons */}
            <div className="flex justify-center gap-6 mt-4">
              <button
                onClick={() => handleShare("twitter")}
                className="text-doac-gray/50 text-xs hover:text-white transition-colors"
              >
                Twitter/X
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="text-doac-gray/50 text-xs hover:text-white transition-colors"
              >
                WhatsApp
              </button>
            </div>

            {/* Steven's Video Postcard */}
            {phase === "postcard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mt-12"
              >
                <div className="w-full max-w-xs mx-auto aspect-[3/4] relative overflow-hidden rounded-lg">
                  <video
                    ref={videoRef}
                    src={event.postcard_video_url}
                    className="w-full h-full object-cover"
                    playsInline
                    controls={false}
                    poster={event.thumbnail_url}
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                          videoStartRef.current = Date.now();
                          trackEvent("postcard_video_played", {
                            ticket_number: state.ticketNumber,
                          });
                        } else {
                          videoRef.current.pause();
                        }
                      }
                    }}
                    onEnded={() => {
                      const duration =
                        (Date.now() - videoStartRef.current) / 1000;
                      trackEvent("postcard_video_completed", {
                        watch_duration: duration,
                        completed: true,
                      });
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-l-[18px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
                <p className="text-doac-gray/50 text-xs text-center mt-3">
                  A message from Steven
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
