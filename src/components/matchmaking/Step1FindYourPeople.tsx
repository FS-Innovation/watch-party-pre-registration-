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

  const isValid = displayName.trim() && email.trim() && phone.trim() && city.trim();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16 ambient-glow">
      <div className="w-full max-w-md relative z-10">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-doac-gray text-xs tracking-[0.3em] mb-8"
        >
          BEHIND THE DIARY &middot; PRIVATE SCREENING
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-headline font-extrabold text-5xl md:text-6xl text-white mb-3 tracking-tighter leading-none uppercase"
        >
          TAKE YOUR
          <br />
          SEAT
        </motion.h1>

        {/* Script subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-script text-doac-sand text-lg -rotate-2 ml-1 mb-14"
        >
          just the basics — we keep it simple
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-8"
        >
          <div className="group">
            <label className="block text-[10px] tracking-[0.15em] text-white/40 uppercase mb-2 font-semibold">First name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="input-glow text-lg"
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

          <div className="group">
            <label className="block text-[10px] tracking-[0.15em] text-white/40 uppercase mb-2 font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@address.com"
              className="input-glow"
              autoComplete="email"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
                  phoneInput?.focus();
                }
              }}
            />
          </div>

          <div className="group">
            <label className="block text-[10px] tracking-[0.15em] text-white/40 uppercase mb-2 font-semibold">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="input-glow"
              autoComplete="tel"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const cityInput = document.querySelector('input[autocomplete="address-level2"]') as HTMLInputElement;
                  cityInput?.focus();
                }
              }}
            />
            <p className="mt-3 text-xs text-white/25">
              For your magic link on screening night. We don&apos;t spam. Ever.
            </p>
          </div>

          <div className="group">
            <label className="block text-[10px] tracking-[0.15em] text-white/40 uppercase mb-2 font-semibold">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="input-glow"
              autoComplete="address-level2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) handleSubmit();
              }}
            />
          </div>

          {error && (
            <p className="text-doac-red text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`w-full py-5 text-lg font-headline font-bold tracking-[0.15em] transition-all duration-500 mt-2 ${
              isValid
                ? "bg-white text-black hover:bg-doac-sand active:scale-[0.98]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            I&apos;M IN
          </button>
        </motion.div>
      </div>
    </div>
  );
}
