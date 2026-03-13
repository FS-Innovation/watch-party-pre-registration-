"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  onNext: (choice: string, label: string) => void;
}

const VIBE_CARDS = [
  {
    id: "reflect",
    label: "Reflect",
    vibe: "I want to sit with something meaningful.",
    segment: "Meaning-seeker",
  },
  {
    id: "build",
    label: "Build",
    vibe: "I\u2019m building something and I need fuel.",
    segment: "Builder",
  },
  {
    id: "create",
    label: "Create",
    vibe: "I\u2019m drawn to the craft behind the content.",
    segment: "Creative",
  },
  {
    id: "connect",
    label: "Connect",
    vibe: "I want to be in a room with people like me.",
    segment: "Connector",
  },
];

export default function Screen2VibePicker({ onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (card: (typeof VIBE_CARDS)[number]) => {
    setSelected(card.id);

    trackEvent("screen_selected", {
      card_id: card.id,
      card_label: card.label,
      segment_mapped: card.segment,
    });

    // Auto-advance after 400ms
    setTimeout(() => {
      onNext(card.id, card.label);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-2xl md:text-4xl text-white text-center mb-16"
      >
        What brings you here tonight?
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {VIBE_CARDS.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            onClick={() => handleSelect(card)}
            className={`
              p-8 text-left border transition-all duration-300 group
              ${
                selected === card.id
                  ? "bg-white text-black border-white"
                  : selected
                    ? "border-white/20 opacity-40"
                    : "border-white/30 hover:border-white/60"
              }
            `}
          >
            <h3
              className={`font-serif text-2xl mb-3 ${
                selected === card.id ? "text-black" : "text-white"
              }`}
            >
              {card.label}
            </h3>
            <p
              className={`text-sm ${
                selected === card.id ? "text-black/70" : "text-doac-gray"
              }`}
            >
              {card.vibe}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
