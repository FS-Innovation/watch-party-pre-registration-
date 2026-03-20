"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  screeningDate: string;
  screeningTime: string;
  onNext: (data: { displayName: string; email: string; phone: string; city: string; timezone: string }) => void;
}

export default function Step1FindYourPeople({ onNext }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const handleSubmit = () => {
    setError("");
    if (!displayName.trim()) {
      setError("We need your name to get you in.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || !/^[+]?[\d\s\-().]{7,}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    trackEvent("name_submitted", {
      display_name: displayName.trim(),
      has_city: !!city.trim(),
      has_phone: true,
    });

    onNext({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      timezone,
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-doac-gray text-xs tracking-[0.3em] mb-6"
        >
          BEHIND THE DIARY &middot; PRIVATE SCREENING
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-4xl md:text-5xl text-white mb-6"
        >
          Take your seat
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-doac-gray text-base leading-relaxed mb-14 max-w-sm mx-auto"
        >
          A few quick details and you&apos;re in.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-6"
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should we call you?"
            className="input-underline text-center text-lg"
            autoComplete="given-name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                emailInput?.focus();
              }
            }}
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="input-underline text-center"
            autoComplete="email"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
                phoneInput?.focus();
              }
            }}
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="input-underline text-center"
            autoComplete="tel"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const cityInput = document.querySelector('input[autocomplete="address-level2"]') as HTMLInputElement;
                cityInput?.focus();
              }
            }}
          />

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city"
            className="input-underline text-center"
            autoComplete="address-level2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && displayName.trim() && email.trim() && phone.trim()) handleSubmit();
            }}
          />

          {error && (
            <p className="text-doac-red text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-doac-red text-white py-4 text-lg tracking-wide hover:opacity-90 transition-opacity mt-4"
          >
            I&apos;m in
          </button>
        </motion.div>
      </div>
    </div>
  );
}
