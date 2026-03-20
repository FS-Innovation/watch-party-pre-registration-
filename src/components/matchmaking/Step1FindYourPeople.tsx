"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { detectCity } from "@/lib/utils";
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
  const [cityDetected, setCityDetected] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    detectCity().then(({ city: detectedCity, timezone: tz }) => {
      if (detectedCity) {
        setCity(detectedCity);
        setCityDetected(true);
      }
      setTimezone(tz);
    });
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 relative">
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

      {/* Cinema screen container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-3xl"
      >
        {/* Screen frame */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.3) 100%)",
            boxShadow: "0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="border border-white/[0.08] rounded-lg">
            <div className="px-8 py-12 md:px-16 md:py-16">
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center mb-12"
              >
                <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">
                  Take your seat
                </h1>
                <p className="text-doac-gray/60 text-xs tracking-[0.3em] uppercase">
                  Private Screening Registration
                </p>
              </motion.div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="max-w-md mx-auto space-y-8"
              >
                {/* Name */}
                <div>
                  <label className="text-doac-gray/70 text-sm mb-2 block">Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="E.g. Julian Noir"
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
                  <label className="text-doac-gray/70 text-sm mb-2 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="julian@cinema.noir"
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
                  <label className="text-doac-gray/70 text-sm mb-2 block">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
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
                  <label className="text-doac-gray/70 text-sm mb-2 block">Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setCityDetected(false);
                    }}
                    placeholder="Your city"
                    className="input-underline text-base"
                    autoComplete="address-level2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && displayName.trim() && email.trim() && phone.trim()) handleSubmit();
                    }}
                  />
                  {cityDetected && (
                    <p className="text-doac-gray/30 text-[10px] tracking-[0.2em] uppercase mt-2">
                      Auto-detected for premiere scheduling
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-doac-red text-sm text-center">{error}</p>
                )}
              </motion.div>
            </div>
          </div>
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
