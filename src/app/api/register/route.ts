import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event_id,
      first_name,
      email,
      city,
      timezone,
      segment_choice,
      guest_question,
      ticket_number,
      referral_code,
      referred_by,
    } = body;

    if (!first_name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Detect device type from user agent
    const ua = request.headers.get("user-agent") || "";
    const device_type = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { data, error } = await supabase
      .from("registrations")
      .insert({
        event_id,
        first_name,
        email,
        city: city || "",
        timezone: timezone || "",
        device_type,
        segment_choice: segment_choice || "",
        guest_question: guest_question || "",
        ai_tags: null,
        ticket_number,
        referral_code,
        referred_by: referred_by || null,
        commitment_confirmed: false,
        committed_at: null,
        ticket_shared: false,
        calendar_saved: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If referred, update referrals table
    if (referred_by) {
      await supabase.from("referrals").insert({
        referral_code: referred_by,
        referred_email: email,
        converted: true,
      });
    }

    // Trigger AI tagging of guest question (async, non-blocking)
    if (guest_question) {
      tagQuestion(data.id, guest_question).catch(console.error);
    }

    return NextResponse.json({ id: data.id, ticket_number });
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Analyze this audience question and return a JSON object with these fields:
- topic_tags: array of 2-3 relevant topic tags
- curiosity_cluster: one of ["personal-growth", "business", "relationships", "health", "creativity", "philosophy", "career", "other"]
- sentiment: one of ["curious", "vulnerable", "ambitious", "reflective", "challenging"]

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

    await supabase
      .from("registrations")
      .update({ ai_tags: tags })
      .eq("id", registrationId);
  } catch {
    // AI tagging is non-critical
  }
}
