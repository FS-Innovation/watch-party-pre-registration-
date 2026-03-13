"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { CREW_SEGMENTS, Crew } from "@/lib/types";

interface Props {
  crewName: string;
  crewEmoji: string;
  crewId: string;
  aiSegment: string;
  aiReasoningText: string;
  displayName: string;
  onEnter: () => void;
  onSwitch: (newCrewId: string) => void;
}

export default function Step5CrewReveal({
  crewName,
  crewEmoji,
  crewId,
  aiSegment,
  aiReasoningText,
  displayName,
  onEnter,
  onSwitch,
}: Props) {
  const [showSwitchOptions, setShowSwitchOptions] = useState(false);
  const [alternativeCrews, setAlternativeCrews] = useState<Crew[]>([]);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    trackEvent("crew_assigned", {
      crew_id: crewId,
      crew_name: crewName,
      segment: aiSegment,
    });
  }, [crewId, crewName, aiSegment]);

  const handleEnter = () => {
    trackEvent("crew_accepted", {
      crew_id: crewId,
      time_on_reveal_screen: (Date.now() - enteredAt.current) / 1000,
    });
    onEnter();
  };

  const handleSwitchClick = async () => {
    if (!showSwitchOptions) {
      // Fetch alternative crews
      try {
        const res = await fetch(`/api/crew/alternatives?current=${crewId}&event_id=screening-001`);
        const data = await res.json();
        setAlternativeCrews(data.crews || []);
      } catch {
        // Show segment-based options as fallback
        const fallback = Object.entries(CREW_SEGMENTS)
          .filter(([key]) => key !== aiSegment)
          .map(([key, info]) => ({
            id: key,
            event_id: "screening-001",
            name: info.name,
            emoji: info.emoji,
            primary_segment: key,
            status: "open" as const,
            min_threshold: 20,
            max_capacity: 40,
            current_count: 0,
            merged_into_crew_id: null,
          }));
        setAlternativeCrews(fallback);
      }
      setShowSwitchOptions(true);
    } else {
      setShowSwitchOptions(false);
    }
  };

  const handleSwitchTo = (newCrew: Crew) => {
    trackEvent("crew_switched", {
      from_crew_id: crewId,
      to_crew_id: newCrew.id,
      to_crew_name: newCrew.name,
    });
    onSwitch(newCrew.id);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-doac-gray text-xs tracking-[0.3em] mb-8"
        >
          YOUR CREW
        </motion.p>

        {/* Crew emoji and name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="text-6xl block mb-4">{crewEmoji}</span>
          <h2 className="font-serif text-4xl md:text-5xl text-white">
            {crewName}
          </h2>
        </motion.div>

        {/* AI reasoning message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12"
        >
          <p className="text-doac-gray text-base leading-relaxed max-w-md mx-auto">
            {aiReasoningText || `Based on what you shared, ${displayName}, you belong with the ${crewName} crew — people who share your wavelength.`}
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            onClick={handleEnter}
            className="bg-doac-red text-white px-14 py-4 text-lg tracking-wide hover:opacity-90 transition-opacity"
          >
            Take me in
          </button>

          <button
            onClick={handleSwitchClick}
            className="text-doac-gray/40 text-xs hover:text-doac-gray transition-colors"
          >
            {showSwitchOptions ? "Never mind" : "Switch rooms"}
          </button>
        </motion.div>

        {/* Alternative crews */}
        {showSwitchOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 grid grid-cols-1 gap-3 max-w-sm mx-auto"
          >
            {alternativeCrews.map((crew) => {
              const info = CREW_SEGMENTS[crew.primary_segment];
              return (
                <button
                  key={crew.id}
                  onClick={() => handleSwitchTo(crew)}
                  className="border border-white/10 p-4 text-left hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info?.emoji || crew.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {info?.name || crew.name}
                      </p>
                      <p className="text-doac-gray/50 text-xs">
                        {info?.description || ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
