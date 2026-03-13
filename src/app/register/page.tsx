"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_EVENT, INITIAL_MATCHMAKING_STATE, MatchmakingState } from "@/lib/types";
import { initAnalytics, trackEvent, trackPage, getUTMParams } from "@/lib/analytics";
import { generateTicketNumber, generateReferralCode } from "@/lib/utils";
import ScreenTransition from "@/components/ScreenTransition";
import Step1FindYourPeople from "@/components/matchmaking/Step1FindYourPeople";
import Step2Motivation from "@/components/matchmaking/Step2Motivation";
import Step3Question from "@/components/matchmaking/Step3Question";
import Step4FindingCrew from "@/components/matchmaking/Step4FindingCrew";
import Step5CrewReveal from "@/components/matchmaking/Step5CrewReveal";
import Step7Envelope from "@/components/matchmaking/Step7Envelope";

const event = DEMO_EVENT;

// Flow:
// 1. Find Your People (name, email, city)
// 2. What brings you here tonight? (open text)
// 3. Question for Steven (A/B tested)
// 4. Finding your crew... (loading + AI matching)
// 5. Crew Reveal → Commitment (merged: badge flashes → commitment text → "I'll be there")
// 6. The Envelope (sealed → ticket → share → Steven video postcard)

export default function RegisterPage() {
  const [state, setState] = useState<MatchmakingState>(INITIAL_MATCHMAKING_STATE);
  const crewMatchPromise = useRef<Promise<Record<string, unknown>> | null>(null);
  const crewMatchResult = useRef<Record<string, unknown> | null>(null);

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
    (data: { displayName: string; email: string; city: string; timezone: string }) => {
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

  // Step 3 → 4: Question submitted, start crew matching
  const handleStep3Complete = useCallback(
    (guestQuestion: string) => {
      setState((prev) => ({ ...prev, guestQuestion }));

      // Fire the crew matching API call NOW (runs in parallel with the loading screen)
      crewMatchPromise.current = fetch("/api/crew/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          display_name: state.displayName,
          email: state.email,
          city: state.city,
          timezone: state.timezone,
          motivation_text: state.motivationText,
          guest_question: guestQuestion,
          ab_variant: state.abVariant,
        }),
      })
        .then((r) => r.json())
        .then((result) => {
          crewMatchResult.current = result;
          return result;
        })
        .catch((err) => {
          console.error("Crew match error:", err);
          const fallback = {
            registration_id: null,
            crew_id: "fallback",
            crew_name: "Connection",
            crew_emoji: "\u{1F91D}",
            ai_segment: "connector",
            ai_reasoning: "",
            ticket_number: generateTicketNumber(),
          };
          crewMatchResult.current = fallback;
          return fallback;
        });

      goToStep(4);
    },
    [state, goToStep]
  );

  // Step 4 → 5: Loading complete, reveal crew + commitment
  const handleStep4Complete = useCallback(async () => {
    if (!crewMatchResult.current && crewMatchPromise.current) {
      await crewMatchPromise.current;
    }

    const result = crewMatchResult.current;
    if (result) {
      const ticketNum = String(result.ticket_number || generateTicketNumber());
      setState((prev) => ({
        ...prev,
        registrationId: (result.registration_id as string) || null,
        crewId: (result.crew_id as string) || null,
        crewName: (result.crew_name as string) || "Connection",
        crewEmoji: (result.crew_emoji as string) || "\u{1F91D}",
        aiSegment: (result.ai_segment as string) || "connector",
        aiReasoningText: (result.ai_reasoning as string) || "",
        aiTags: (result.ai_tags as Record<string, unknown>) || null,
        ticketNumber: ticketNum,
        referralCode: generateReferralCode(prev.displayName),
      }));
    }

    goToStep(5);
  }, [goToStep]);

  // Step 5 → 6: Commitment confirmed → Envelope
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
    goToStep(6);
  }, [state.registrationId, goToStep]);

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
          <Step4FindingCrew
            onComplete={handleStep4Complete}
            minimumDelay={4000}
          />
        )}
        {state.currentStep === 5 && (
          <Step5CrewReveal
            crewName={state.crewName}
            crewEmoji={state.crewEmoji}
            crewId={state.crewId || ""}
            aiSegment={state.aiSegment}
            displayName={state.displayName}
            onCommit={handleCommitmentConfirmed}
          />
        )}
        {state.currentStep === 6 && (
          <Step7Envelope event={event} state={state} />
        )}
      </ScreenTransition>
    </main>
  );
}
