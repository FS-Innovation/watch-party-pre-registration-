import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { registration_id, wants_consideration, why_answer } = await request.json();

    if (!registration_id) {
      return NextResponse.json({ error: "registration_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("meet_greet_intent")
      .insert({
        user_id: registration_id,
        wants_consideration: wants_consideration || false,
        why_answer: why_answer || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Meet greet insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // AI theme clustering for the "why" answer (async, non-blocking)
    if (wants_consideration && why_answer) {
      clusterMeetGreetTheme(data.id, why_answer).catch(console.error);
    }

    return NextResponse.json({ id: data.id, success: true });
  } catch (err) {
    console.error("Meet greet error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function clusterMeetGreetTheme(intentId: string, whyAnswer: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return;

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
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `A community member wants to meet the host after a screening event. Analyze their answer and return a JSON object with:
- ai_theme: one of ["vulnerability", "ambition", "gratitude", "specific-question", "personal-story", "creative-connection", "mentorship", "other"]
- ai_quality_score: float 1.0-5.0 (uniqueness and authenticity)

Their answer to "Why should it be you?": "${whyAnswer}"

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return;

    const result = JSON.parse(content);

    await supabase
      .from("meet_greet_intent")
      .update({
        ai_theme: result.ai_theme || null,
        ai_quality_score: result.ai_quality_score || null,
      })
      .eq("id", intentId);
  } catch {
    // AI clustering is non-critical
  }
}
