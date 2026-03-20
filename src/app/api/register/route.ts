import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event_id,
      display_name,
      email,
      phone,
      city,
      timezone,
      motivation_text,
      guest_question,
      ab_variant,
    } = body;

    if (!display_name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Generate magic token
    const magic_token = generateMagicToken();

    // Generate ticket number
    const ticket_number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");

    // Detect device type from user agent
    const ua = request.headers.get("user-agent") || "";
    const device_type = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id,
        first_name: display_name,
        display_name,
        email,
        phone,
        city: city || "",
        timezone: timezone || "",
        device_type,
        segment_choice: "",
        motivation_text: motivation_text || "",
        guest_question: guest_question || "",
        ab_variant: ab_variant || "",
        ai_segment: "",
        ai_tags: null,
        ai_reasoning_text: "",
        ticket_number,
        referral_code: "",
        magic_token,
        commitment_confirmed: false,
      })
      .select("id")
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // AI theme clustering (async, non-blocking)
    if (motivation_text) {
      clusterMotivationTheme(registration.id, motivation_text).catch(console.error);
    }
    if (guest_question) {
      tagQuestion(registration.id, guest_question).catch(console.error);
    }

    return NextResponse.json({
      registration_id: registration.id,
      ticket_number,
      magic_token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (updates.commitment_confirmed) {
      updates.committed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("registrations")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMagicToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function clusterMotivationTheme(registrationId: string, motivationText: string) {
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
            content: `Analyze this community member's motivation for joining a private screening event. Return a JSON object with:
- ai_theme: one of ["community", "steven-fan", "btd-superfan", "curiosity", "career-growth", "personal-growth", "creative-inspiration", "connection"]
- secondary_interests: array of 2-3 interest tags
- sentiment: one of ["curious", "vulnerable", "ambitious", "reflective", "challenging"]
- intent_depth: one of ["casual", "moderate", "deep"]

Motivation: "${motivationText}"

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return;

    const tags = JSON.parse(content);

    await supabase
      .from("registrations")
      .update({
        ai_tags: tags,
        ai_segment: tags.ai_theme || "",
      })
      .eq("id", registrationId);
  } catch {
    // AI clustering is non-critical
  }
}

async function tagQuestion(registrationId: string, question: string) {
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
            content: `Analyze this audience question for a screening event and return a JSON object with:
- topic_tags: array of 2-3 relevant topic tags
- curiosity_cluster: one of ["personal-growth", "business", "relationships", "health", "creativity", "philosophy", "career", "other"]
- sentiment: one of ["curious", "vulnerable", "ambitious", "reflective", "challenging"]
- quality_score: 1-5 (uniqueness and depth)

Question: "${question}"

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return;

    const tags = JSON.parse(content);

    // Store in signal_responses for the question
    await supabase.from("signal_responses").insert({
      registration_id: registrationId,
      question_key: "ask_steven",
      answer_text: question,
      ai_tags: tags,
      segment_tag: tags.curiosity_cluster || "",
      confidence_score: tags.quality_score || null,
    });
  } catch {
    // AI tagging is non-critical
  }
}
