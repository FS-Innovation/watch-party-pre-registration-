import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CREW_NAMES: Record<string, { name: string; emoji: string }> = {
  "meaning-seeker": { name: "Reflection", emoji: "\u{1F30A}" },
  builder: { name: "Builders", emoji: "\u{1F6E0}\u{FE0F}" },
  creative: { name: "Creative Lab", emoji: "\u2728" },
  connector: { name: "Connection", emoji: "\u{1F91D}" },
};

export async function POST(request: NextRequest) {
  try {
    const {
      event_id,
      display_name,
      email,
      city,
      timezone,
      motivation_text,
      guest_question,
      ab_variant,
    } = await request.json();

    // Step 1: AI segmentation via Claude
    const aiResult = await classifyWithAI(motivation_text, guest_question);

    const segment = String(aiResult.primary_segment || "connector");
    const crewInfo = CREW_NAMES[segment] || CREW_NAMES.connector;

    // Step 2: Find or create a crew for this segment
    const crew = await findOrCreateCrew(event_id, segment, crewInfo);

    // Step 3: Create registration
    const ua = request.headers.get("user-agent") || "";
    const device_type = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id,
        first_name: display_name,
        display_name,
        email,
        city: city || "",
        timezone: timezone || "",
        device_type,
        segment_choice: segment,
        motivation_text,
        guest_question: guest_question || "",
        ab_variant: ab_variant || "",
        ai_segment: segment,
        ai_tags: aiResult,
        ai_reasoning_text: String(aiResult.reasoning || ""),
        crew_id: crew.id,
        crew_accepted: true,
        ticket_number: String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0"),
        referral_code: "",
      })
      .select("id")
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // Step 4: Increment crew count
    try {
      await supabase
        .from("crews")
        .update({ current_count: crew.current_count + 1 })
        .eq("id", crew.id);
    } catch {
      // Non-critical
    }

    // Step 5: Update heatmap async (non-blocking)
    if (guest_question) {
      updateHeatmap(event_id, guest_question, aiResult.topic_tags).catch(console.error);
    }

    return NextResponse.json({
      registration_id: registration.id,
      crew_id: crew.id,
      crew_name: crewInfo.name,
      crew_emoji: crewInfo.emoji,
      ai_segment: segment,
      ai_reasoning: String(aiResult.reasoning || ""),
      ai_tags: aiResult,
    });
  } catch (err) {
    console.error("Crew matching error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function classifyWithAI(
  motivationText: string,
  guestQuestion: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback: keyword-based classification
    return fallbackClassification(motivationText);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `You are matching a community member to their crew for a live screening event. Based on their answers, classify them and write a personal message explaining why they belong.

Their motivation: "${motivationText}"
${guestQuestion ? `Their question for the host: "${guestQuestion}"` : ""}

Return a JSON object with these exact fields:
- primary_segment: one of ["meaning-seeker", "builder", "creative", "connector"]
- secondary_interests: array of 2-3 interest tags
- topic_tags: array of 2-3 topic tags from their question (or empty if no question)
- curiosity_cluster: one of ["personal-growth", "business", "relationships", "health", "creativity", "philosophy", "career", "other"]
- sentiment: one of ["curious", "vulnerable", "ambitious", "reflective", "challenging"]
- intent_depth: one of ["casual", "moderate", "deep"]
- question_specificity_score: 1-5 (only if question provided, else null)
- reasoning: a 2-3 sentence personal message explaining WHY they were placed in this crew. Reference their actual words. Use warm, direct language. Address them directly. Example: "You came here specifically wanting to connect with people, and you're drawn to founder stories — that tells me you're naturally community-minded and love learning from others' journeys. I'm placing you in our Connection section where you'll be surrounded by other people who value meaningful relationships and bringing people together."

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return fallbackClassification(motivationText);

    return JSON.parse(content);
  } catch {
    return fallbackClassification(motivationText);
  }
}

function fallbackClassification(text: string): Record<string, unknown> {
  const lower = text.toLowerCase();

  let segment = "connector";
  if (/meaning|purpose|reflect|soul|deep|healing|growth|feel/i.test(lower)) {
    segment = "meaning-seeker";
  } else if (/build|startup|business|product|founder|scale|entrepreneur/i.test(lower)) {
    segment = "builder";
  } else if (/creat|art|craft|story|design|write|content|film/i.test(lower)) {
    segment = "creative";
  } else if (/connect|community|people|together|friends|network|belong/i.test(lower)) {
    segment = "connector";
  }

  return {
    primary_segment: segment,
    secondary_interests: [],
    topic_tags: [],
    curiosity_cluster: "other",
    sentiment: "curious",
    intent_depth: "moderate",
    question_specificity_score: null,
    reasoning: "",
  };
}

async function findOrCreateCrew(
  eventId: string,
  segment: string,
  crewInfo: { name: string; emoji: string }
) {
  // Find an existing open crew for this segment
  const { data: existingCrew } = await supabase
    .from("crews")
    .select("*")
    .eq("event_id", eventId)
    .eq("primary_segment", segment)
    .in("status", ["forming", "open"])
    .lt("current_count", 40)
    .order("current_count", { ascending: false })
    .limit(1)
    .single();

  if (existingCrew) {
    // Update status to 'open' if it crossed the threshold
    if (existingCrew.current_count >= 20 && existingCrew.status === "forming") {
      await supabase
        .from("crews")
        .update({ status: "open" })
        .eq("id", existingCrew.id);
    }
    return existingCrew;
  }

  // Create a new crew
  const { data: newCrew, error } = await supabase
    .from("crews")
    .insert({
      event_id: eventId,
      name: crewInfo.name,
      emoji: crewInfo.emoji,
      primary_segment: segment,
      status: "forming",
      current_count: 0,
    })
    .select("*")
    .single();

  if (error || !newCrew) {
    // Return a fallback
    return {
      id: "temp-" + segment,
      event_id: eventId,
      name: crewInfo.name,
      emoji: crewInfo.emoji,
      primary_segment: segment,
      status: "forming",
      current_count: 0,
    };
  }

  return newCrew;
}

async function updateHeatmap(
  eventId: string,
  question: string,
  topicTags: unknown
) {
  const tags = Array.isArray(topicTags) ? topicTags : [];

  for (const tag of tags) {
    const tagStr = String(tag);
    // Upsert heatmap entry
    const { data: existing } = await supabase
      .from("curiosity_heatmap")
      .select("*")
      .eq("event_id", eventId)
      .eq("topic_cluster", tagStr)
      .single();

    if (existing) {
      const samples = Array.isArray(existing.sample_questions)
        ? existing.sample_questions
        : [];
      if (samples.length < 5) samples.push(question);

      await supabase
        .from("curiosity_heatmap")
        .update({
          question_count: existing.question_count + 1,
          sample_questions: samples,
          generated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("curiosity_heatmap").insert({
        event_id: eventId,
        topic_cluster: tagStr,
        question_count: 1,
        percentage: 0,
        sample_questions: [question],
      });
    }
  }

  // Recalculate percentages
  const { data: allEntries } = await supabase
    .from("curiosity_heatmap")
    .select("*")
    .eq("event_id", eventId);

  if (allEntries && allEntries.length > 0) {
    const total = allEntries.reduce((sum, e) => sum + e.question_count, 0);
    for (const entry of allEntries) {
      await supabase
        .from("curiosity_heatmap")
        .update({ percentage: (entry.question_count / total) * 100 })
        .eq("id", entry.id);
    }
  }
}
