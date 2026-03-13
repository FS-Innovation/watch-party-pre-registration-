"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { detectCity } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface Props {
  onNext: (data: { firstName: string; email: string; city: string; timezone: string }) => void;
}

export default function Screen4Identity({ onNext }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [cityDetected, setCityDetected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    detectCity().then(({ city: detectedCity, timezone: tz }) => {
      if (detectedCity) {
        setCity(detectedCity);
        setCityDetected(true);
      }
      setTimezone(tz);
    });
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!firstName.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    trackEvent("identity_submitted", {
      has_city: !!city.trim(),
      city_auto_detected: cityDetected,
    });

    onNext({
      firstName: firstName.trim(),
      email: email.trim(),
      city: city.trim(),
      timezone,
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-2xl md:text-3xl text-white text-center mb-4"
      >
        Almost there.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-doac-gray text-lg text-center mb-14"
      >
        Where should we send your ticket?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="input-underline"
            autoComplete="given-name"
          />
        </div>

        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-underline"
            autoComplete="email"
          />
        </div>

        <div>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCityDetected(false);
            }}
            placeholder="City"
            className="input-underline"
            autoComplete="address-level2"
          />
          {cityDetected && (
            <p className="text-doac-gray/50 text-xs mt-2">
              Based on your location
            </p>
          )}
        </div>

        {error && <p className="text-doac-red text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-doac-red text-white py-4 text-lg tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
        >
          {submitting ? "Sending..." : "Get my ticket"}
        </button>
      </motion.div>
    </div>
  );
}
