"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import DOACLogo from "./DOACLogo";
import { trackEvent } from "@/lib/analytics";
import { ScreeningEvent } from "@/lib/types";

interface Props {
  event: ScreeningEvent;
  onNext: () => void;
}

export default function Screen1Invitation({ event, onNext }: Props) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchStartRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setLogoVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (logoVisible) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {
            // Auto-play blocked — show CTA immediately
            setVideoEnded(true);
          });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [logoVisible]);

  const handleVideoPlay = useCallback(() => {
    setVideoStarted(true);
    watchStartRef.current = Date.now();
    trackEvent("invite_video_played", { event_id: event.id });
  }, [event.id]);

  const handleVideoEnd = useCallback(() => {
    const duration = (Date.now() - watchStartRef.current) / 1000;
    trackEvent("invite_video_completed", {
      watch_duration: duration,
      completed: true,
      event_id: event.id,
    });
    setVideoEnded(true);
  }, [event.id]);

  const handleSkip = useCallback(() => {
    if (videoRef.current && videoStarted) {
      const duration = (Date.now() - watchStartRef.current) / 1000;
      trackEvent("invite_video_skipped", {
        watch_duration: duration,
        completed: false,
        event_id: event.id,
      });
    }
    setVideoEnded(true);
  }, [videoStarted, event.id]);

  const handleStepInside = () => {
    trackEvent("step_inside_clicked", { event_id: event.id });
    onNext();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative px-4">
      {/* Logo fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: logoVisible ? 1 : 0 }}
        transition={{ duration: 2 }}
        className="mb-12"
      >
        <DOACLogo className="text-4xl md:text-5xl" />
      </motion.div>

      {/* Video */}
      <div className="w-full max-w-3xl aspect-video relative mb-10">
        <video
          ref={videoRef}
          src={event.trailer_url}
          className="w-full h-full object-cover"
          playsInline
          muted
          onPlay={handleVideoPlay}
          onEnded={handleVideoEnd}
          onClick={handleSkip}
          poster={event.thumbnail_url}
        />
        {videoStarted && !videoEnded && (
          <button
            onClick={handleSkip}
            className="absolute bottom-4 right-4 text-doac-gray text-sm hover:text-white transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: videoEnded ? 1 : 0, y: videoEnded ? 0 : 10 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center"
      >
        <p className="font-serif text-xl md:text-2xl text-white mb-8">
          An exclusive screening for people who show up.
        </p>
        <button
          onClick={handleStepInside}
          className="border border-white text-white px-12 py-4 text-lg tracking-wide hover:bg-doac-red hover:border-doac-red transition-all duration-300"
        >
          Step inside
        </button>
      </motion.div>

      {/* Show CTA immediately if no video available */}
      {!videoStarted && !videoEnded && (
        <button
          onClick={() => setVideoEnded(true)}
          className="absolute bottom-8 text-doac-gray text-xs hover:text-white transition-colors"
        >
          Continue without video
        </button>
      )}
    </div>
  );
}
