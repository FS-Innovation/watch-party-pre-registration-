"use client";

import { useState, useCallback } from "react";
import { DEMO_EVENT, INITIAL_MATCHMAKING_STATE, MatchmakingState } from "@/lib/types";
import { initAnalytics, trackEvent, trackPage, getUTMParams } from "@/lib/analytics";
import { generateTicketNumber, generateReferralCode } from "@/lib/utils";
import ScreenTransition from "@/components/ScreenTransition";
import Step1FindYourPeople from "@/components/matchmaking/Step1FindYourPeople";
import Step2Motivation from "@/components/matchmaking/Step2Motivation";
import Step3Question from "@/components/matchmaking/Step3Question";
import Step5CrewReveal from "@/components/matchmaking/Step5CrewReveal";
import Step7Envelope from "@/components/matchmaking/Step7Envelope";
import Step9MeetAndGreet from "@/components/matchmaking/Step9MeetAndGreet";
import { useEffect } from "react";

const event = DEMO_EVENT;

// Flow (v2 — no crew matching):
// 1. Registration (name, email, phone, city)
// 2. What brings you here tonight? (open text)
// 3. Question for Steven (A/B tested)
// 4. Commitment ("This screening happens once...")
// 5. The Envelope (sealed → ticket → share → Steven video postcard)
// 6. Meet and Greet intent (new)

export default function RegisterPage() {
  const [state, setState] = useState<MatchmakingState>(INITIAL_MATCHMAKING_STATE);

  useEffect(() => {
    initAnalytics();
    const utms = getUTMParams();
    trackPage("preshow_landing", { ...utms, event_id: event.id });
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      stepEnteredAt: Date.now(),
    }));
    trackEvent("step_viewed", { step_number: step, event_id: event.id });
    window.scrollTo({ top: 0 });
  }, []);

  // Step 1 → 2: Identity captured
  const handleStep1Complete = useCallback(
    (data: { displayName: string; email: string; phone: string; city: string; timezone: string }) => {
      setState((prev) => ({ ...prev, ...data }));
      goToStep(2);
    },
    [goToStep]
  );

  // Step 2 → 3: Motivation submitted
  const handleStep2Complete = useCallback(
    (motivationText: string) => {
      setState((prev) => ({ ...prev, motivationText }));
      goToStep(3);
    },
    [goToStep]
  );

  // Step 3 → 4: Question submitted, register user
  const handleStep3Complete = useCallback(
    (guestQuestion: string) => {
      setState((prev) => ({ ...prev, guestQuestion }));

      // Register the user via API (no crew matching)
      fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          display_name: state.displayName,
          email: state.email,
          phone: state.phone,
          city: state.city,
          timezone: state.timezone,
          motivation_text: state.motivationText,
          guest_question: guestQuestion,
          ab_variant: state.abVariant,
        }),
      })
        .then((r) => r.json())
        .then((result) => {
          setState((prev) => ({
            ...prev,
            registrationId: result.registration_id || null,
            ticketNumber: result.ticket_number || generateTicketNumber(),
            referralCode: generateReferralCode(prev.displayName),
            magicToken: result.magic_token || "",
          }));
        })
        .catch((err) => {
          console.error("Registration error:", err);
          setState((prev) => ({
            ...prev,
            ticketNumber: generateTicketNumber(),
            referralCode: generateReferralCode(prev.displayName),
          }));
        });

      // Move to commitment screen immediately (registration is non-blocking)
      goToStep(4);
    },
    [state, goToStep]
  );

  // Step 4 → 5: Commitment confirmed → Envelope
  const handleCommitmentConfirmed = useCallback(async () => {
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
    goToStep(5);
  }, [state.registrationId, goToStep]);

  // Step 6: Meet and greet complete
  const handleMeetGreetComplete = useCallback(
    async (wants: boolean, why: string) => {
      setState((prev) => ({ ...prev, meetGreetWants: wants, meetGreetWhy: why }));

      // Submit meet-and-greet intent to API
      if (state.registrationId) {
        try {
          await fetch("/api/meet-greet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registration_id: state.registrationId,
              wants_consideration: wants,
              why_answer: why || null,
            }),
          });
        } catch {
          // Non-blocking
        }
      }

      // Flow complete — stay on the confirmation screen
    },
    [state.registrationId]
  );

  return (
    <main className="bg-black min-h-screen">
      <ScreenTransition screenKey={state.currentStep}>
        {state.currentStep === 1 && (
          <Step1FindYourPeople
            screeningDate={event.date}
            screeningTime={event.time}
            onNext={handleStep1Complete}
          />
        )}
        {state.currentStep === 2 && (
          <Step2Motivation
            displayName={state.displayName}
            onNext={handleStep2Complete}
          />
        )}
        {state.currentStep === 3 && (
          <Step3Question
            aiSegment={state.aiSegment || "connector"}
            abVariant={state.abVariant}
            onNext={handleStep3Complete}
          />
        )}
        {state.currentStep === 4 && (
          <Step5CrewReveal
            displayName={state.displayName}
            onCommit={handleCommitmentConfirmed}
          />
        )}
        {state.currentStep === 5 && (
          <Step7Envelope event={event} state={state} onNext={() => goToStep(6)} />
        )}
        {state.currentStep === 6 && (
          <Step9MeetAndGreet
            displayName={state.displayName}
            registrationId={state.registrationId}
            onComplete={handleMeetGreetComplete}
          />
        )}
      </ScreenTransition>
    </main>
  );
}
