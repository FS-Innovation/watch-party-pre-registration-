"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

interface Props {
  screeningDate: string;
  screeningTime: string;
  onNext: (data: { displayName: string; email: string; phone: string; city: string; timezone: string }) => void;
}

export default function Step1FindYourPeople({ screeningDate, screeningTime, onNext }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Live countdown
  useEffect(() => {
    const target = new Date(`${screeningDate}T${screeningTime}:00`).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown("Starting now");
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screeningDate, screeningTime]);

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 md:px-8 py-12 relative">
      {/* Warm glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 5%, rgba(233,69,96,0.4) 30%, rgba(233,69,96,0.6) 50%, rgba(233,69,96,0.4) 70%, transparent 95%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top center, rgba(233,69,96,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Countdown background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-mono text-[8rem] md:text-[12rem] text-white/[0.03] font-bold tracking-widest select-none">
          {countdown}
        </span>
      </div>

      {/* Cinema screen container — widescreen TV proportions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-6xl"
      >
        {/* The screen */}
        <div
          className="relative rounded-md overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 40%, rgba(0,0,0,0.4) 100%)",
            boxShadow: "0 0 100px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <div className="border border-white/[0.07] rounded-md">
            {/* Inner bezel */}
            <div
              className="m-[3px] rounded-sm"
              style={{
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -1px 4px rgba(0,0,0,0.3)",
              }}
            >
              <div className="px-8 py-10 md:px-20 md:py-14 lg:px-28 lg:py-16">
                {/* Heading */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center mb-10 md:mb-12"
                >
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-3">
                    Take your seat
                  </h1>
                  <p className="text-doac-gray/50 text-[11px] tracking-[0.3em] uppercase">
                    Private Screening Registration
                  </p>
                </motion.div>

                {/* Form — 2 column grid on desktop */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7 max-w-3xl mx-auto"
                >
                  {/* Name */}
                  <div>
                    <label className="text-doac-gray/60 text-sm mb-2 block">Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-underline text-base"
                      autoComplete="given-name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                          emailInput?.focus();
                        }
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-doac-gray/60 text-sm mb-2 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-underline text-base"
                      autoComplete="email"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
                          phoneInput?.focus();
                        }
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-doac-gray/60 text-sm mb-2 block">Phone number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-underline text-base"
                      autoComplete="tel"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const cityInput = document.querySelector('input[autocomplete="address-level2"]') as HTMLInputElement;
                          cityInput?.focus();
                        }
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-doac-gray/60 text-sm mb-2 block">Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-underline text-base"
                      autoComplete="address-level2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && displayName.trim() && email.trim() && phone.trim()) handleSubmit();
                      }}
                    />
                  </div>
                </motion.div>

                {error && (
                  <p className="text-doac-red text-sm text-center mt-6">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thin stand / base line under the screen */}
        <div className="flex justify-center mt-1">
          <div
            className="h-[2px] w-2/3 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            }}
          />
        </div>

        {/* CTA below the screen */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleSubmit}
            className="bg-doac-red text-white px-16 py-4 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          >
            I&apos;m in
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
