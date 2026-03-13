"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_EVENT, INITIAL_MATCHMAKING_STATE, MatchmakingState, CREW_SEGMENTS } from "@/lib/types";
import { initAnalytics, trackEvent, trackPage, getUTMParams } from "@/lib/analytics";
import ScreenTransition from "@/components/ScreenTransition";
import Step1FindYourPeople from "@/components/matchmaking/Step1FindYourPeople";
import Step2Motivation from "@/components/matchmaking/Step2Motivation";
import Step3Question from "@/components/matchmaking/Step3Question";
import Step4FindingCrew from "@/components/matchmaking/Step4FindingCrew";
import Step5CrewReveal from "@/components/matchmaking/Step5CrewReveal";
import Step6ScreeningRoom from "@/components/matchmaking/Step6ScreeningRoom";

const event = DEMO_EVENT;

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
      const updatedQuestion = guestQuestion;
      setState((prev) => ({ ...prev, guestQuestion: updatedQuestion }));

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
          guest_question: updatedQuestion,
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
          };
          crewMatchResult.current = fallback;
          return fallback;
        });

      goToStep(4);
    },
    [state, goToStep]
  );

  // Step 4 → 5: Loading complete, reveal crew
  const handleStep4Complete = useCallback(async () => {
    // Wait for the API result if it hasn't arrived yet
    if (!crewMatchResult.current && crewMatchPromise.current) {
      await crewMatchPromise.current;
    }

    const result = crewMatchResult.current;
    if (result) {
      setState((prev) => ({
        ...prev,
        registrationId: (result.registration_id as string) || null,
        crewId: (result.crew_id as string) || null,
        crewName: (result.crew_name as string) || "Connection",
        crewEmoji: (result.crew_emoji as string) || "\u{1F91D}",
        aiSegment: (result.ai_segment as string) || "connector",
        aiReasoningText: (result.ai_reasoning as string) || "",
        aiTags: (result.ai_tags as Record<string, unknown>) || null,
      }));
    }

    goToStep(5);
  }, [goToStep]);

  // Step 5 → 6: Enter screening room
  const handleCrewAccepted = useCallback(() => {
    trackEvent("screening_joined", {
      crew_id: state.crewId,
      crew_name: state.crewName,
      event_id: event.id,
    });
    goToStep(6);
  }, [state.crewId, state.crewName, goToStep]);

  // Crew switch
  const handleCrewSwitch = useCallback(
    async (newCrewId: string) => {
      try {
        const res = await fetch("/api/crew/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: state.registrationId,
            from_crew_id: state.crewId,
            to_crew_id: newCrewId,
          }),
        });

        const data = await res.json();
        if (data.crew) {
          const segInfo = CREW_SEGMENTS[data.crew.primary_segment];
          setState((prev) => ({
            ...prev,
            crewId: data.crew.id,
            crewName: segInfo?.name || data.crew.name,
            crewEmoji: segInfo?.emoji || data.crew.emoji,
            aiSegment: data.crew.primary_segment,
          }));
        }
      } catch {
        // Stay in current crew
      }
    },
    [state.registrationId, state.crewId]
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
            aiReasoningText={state.aiReasoningText}
            displayName={state.displayName}
            onEnter={handleCrewAccepted}
            onSwitch={handleCrewSwitch}
          />
        )}
        {state.currentStep === 6 && (
          <Step6ScreeningRoom state={state} />
        )}
      </ScreenTransition>
    </main>
  );
}
