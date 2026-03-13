"use client";

import { useState, useEffect, useCallback } from "react";
import { DEMO_EVENT, INITIAL_STATE, RegistrationState } from "@/lib/types";
import { initAnalytics, trackEvent, trackPage, getUTMParams } from "@/lib/analytics";
import { generateTicketNumber, generateReferralCode } from "@/lib/utils";
import ScreenTransition from "@/components/ScreenTransition";
import Screen1Invitation from "@/components/Screen1Invitation";
import Screen2VibePicker from "@/components/Screen2VibePicker";
import Screen3GuestQuestion from "@/components/Screen3GuestQuestion";
import Screen4Identity from "@/components/Screen4Identity";
import Screen5Commitment from "@/components/Screen5Commitment";
import Screen6Envelope from "@/components/Screen6Envelope";

const event = DEMO_EVENT;

export default function RegisterPage() {
  const [state, setState] = useState<RegistrationState>(INITIAL_STATE);

  useEffect(() => {
    initAnalytics();
    const utms = getUTMParams();
    trackPage("registration", { ...utms, event_id: event.id });

    // Check for referral code
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setState((prev) => ({ ...prev, referredBy: ref }));
      trackEvent("referral_link_used", { referral_code: ref });
    }
  }, []);

  const goToScreen = useCallback((screen: number) => {
    setState((prev) => ({
      ...prev,
      currentScreen: screen,
      screenEnteredAt: Date.now(),
    }));
    trackEvent("screen_viewed", { screen_number: screen, event_id: event.id });
    window.scrollTo({ top: 0 });
  }, []);

  // Screen 1 → 2
  const handleInvitationNext = useCallback(() => goToScreen(2), [goToScreen]);

  // Screen 2 → 3
  const handleVibeSelected = useCallback(
    (choice: string, label: string) => {
      setState((prev) => ({
        ...prev,
        segmentChoice: choice,
        segmentLabel: label,
      }));
      goToScreen(3);
    },
    [goToScreen]
  );

  // Screen 3 → 4
  const handleQuestionSubmitted = useCallback(
    (question: string) => {
      setState((prev) => ({ ...prev, guestQuestion: question }));
      goToScreen(4);
    },
    [goToScreen]
  );

  // Screen 4 → 5 (submit registration)
  const handleIdentitySubmitted = useCallback(
    async (data: {
      firstName: string;
      email: string;
      city: string;
      timezone: string;
    }) => {
      const ticketNumber = generateTicketNumber();
      const referralCode = generateReferralCode(data.firstName);

      const updatedState = {
        ...state,
        ...data,
        ticketNumber,
        referralCode,
      };

      // Submit to API
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: event.id,
            first_name: data.firstName,
            email: data.email,
            city: data.city,
            timezone: data.timezone,
            segment_choice: state.segmentChoice,
            guest_question: state.guestQuestion,
            ticket_number: ticketNumber,
            referral_code: referralCode,
            referred_by: state.referredBy,
          }),
        });

        const result = await res.json();
        if (result.id) {
          updatedState.registrationId = result.id;
        }
      } catch {
        // Continue even if API fails — don't block the experience
      }

      trackEvent("registration_completed", {
        event_id: event.id,
        has_question: !!state.guestQuestion,
        segment: state.segmentChoice,
        referral_code_used: !!state.referredBy,
      });

      setState((prev) => ({ ...prev, ...updatedState }));
      goToScreen(5);
    },
    [state, goToScreen]
  );

  // Screen 5 → 6
  const handleCommitmentConfirmed = useCallback(async () => {
    // Update registration with commitment
    if (state.registrationId) {
      try {
        await fetch("/api/register", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: state.registrationId,
            commitment_confirmed: true,
          }),
        });
      } catch {
        // Non-blocking
      }
    }

    goToScreen(6);
  }, [state.registrationId, goToScreen]);

  return (
    <main className="bg-black min-h-screen">
      <ScreenTransition screenKey={state.currentScreen}>
        {state.currentScreen === 1 && (
          <Screen1Invitation event={event} onNext={handleInvitationNext} />
        )}
        {state.currentScreen === 2 && (
          <Screen2VibePicker onNext={handleVibeSelected} />
        )}
        {state.currentScreen === 3 && (
          <Screen3GuestQuestion
            event={event}
            onNext={handleQuestionSubmitted}
          />
        )}
        {state.currentScreen === 4 && (
          <Screen4Identity onNext={handleIdentitySubmitted} />
        )}
        {state.currentScreen === 5 && (
          <Screen5Commitment onNext={handleCommitmentConfirmed} />
        )}
        {state.currentScreen === 6 && (
          <Screen6Envelope event={event} state={state} />
        )}
      </ScreenTransition>
    </main>
  );
}
