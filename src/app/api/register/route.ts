import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

// Allowed fields for PATCH updates (lockdown)
const ALLOWED_PATCH_FIELDS = new Set([
  "commitment_confirmed",
  "ticket_shared",
  "calendar_saved",
]);

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

    // --- Input validation ---
    if (!display_name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Sanitize and enforce max lengths
    const clean = {
      event_id: String(event_id || "").slice(0, 100),
      display_name: String(display_name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 254),
      phone: String(phone).trim().slice(0, 20),
      city: String(city || "").trim().slice(0, 100),
      timezone: String(timezone || "").trim().slice(0, 100),
      motivation_text: String(motivation_text || "").trim().slice(0, 500),
      guest_question: String(guest_question || "").trim().slice(0, 300),
      ab_variant: String(ab_variant || "").slice(0, 2),
    };

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
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

    const { data: registration, error: regError } = await db
      .from("registrations")
      .insert({
        event_id: clean.event_id,
        first_name: clean.display_name,
        display_name: clean.display_name,
        email: clean.email,
        phone: clean.phone,
        city: clean.city,
        timezone: clean.timezone,
        device_type,
        segment_choice: "",
        motivation_text: clean.motivation_text,
        guest_question: clean.guest_question,
        ab_variant: clean.ab_variant,
        ai_segment: "",
        ai_tags: null,
        ai_reasoning_text: "",
        ticket_number,
        referral_code: "",
        magic_token,
        commitment_confirmed: false,
      })
      .select("id, ticket_number, magic_token")
      .single();

    if (regError) {
      // Handle duplicate email registration
      if (regError.code === "23505" && regError.message?.includes("unique_event_email")) {
        // Return existing registration info
        const { data: existing } = await db
          .from("registrations")
          .select("id, ticket_number, magic_token")
          .eq("event_id", clean.event_id)
          .eq("email", clean.email)
          .single();

        if (existing) {
          return NextResponse.json({
            registration_id: existing.id,
            ticket_number: existing.ticket_number,
            magic_token: existing.magic_token,
            already_registered: true,
          });
        }
      }

      console.error("Registration error:", regError);
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // AI theme clustering (async, non-blocking, with timeout)
    if (clean.motivation_text) {
      clusterMotivationTheme(registration.id, clean.motivation_text).catch(console.error);
    }
    if (clean.guest_question) {
      tagQuestion(registration.id, clean.guest_question).catch(console.error);
    }

    return NextResponse.json({
      registration_id: registration.id,
      ticket_number: registration.ticket_number,
      magic_token: registration.magic_token,
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
    const { id, ...rawUpdates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Only allow whitelisted fields
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_PATCH_FIELDS.has(key)) {
        updates[key] = rawUpdates[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (updates.commitment_confirmed) {
      updates.committed_at = new Date().toISOString();
    }

    const { error } = await db
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

// Fetch with timeout helper
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function clusterMotivationTheme(registrationId: string, motivationText: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return;

  try {
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
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
    }, 5000);

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return;

    const tags = JSON.parse(content);

    await db
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
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
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
    }, 5000);

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return;

    const tags = JSON.parse(content);

    await db.from("signal_responses").insert({
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
