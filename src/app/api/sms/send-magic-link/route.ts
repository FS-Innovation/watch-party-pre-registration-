import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";

/**
 * POST /api/sms/send-magic-link
 *
 * Send a magic link SMS to a registered user.
 *
 * Body:
 *   { registration_id: string }
 *
 * Or for bulk send (admin only):
 *   { event_id: string }
 *
 * Requires ADMIN_SECRET bearer token for bulk sends.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- Bulk send (all registrations for an event) ---
    if (body.event_id && !body.registration_id) {
      // Require admin auth for bulk sends
      const authHeader = request.headers.get("authorization");
      const adminSecret = process.env.ADMIN_SECRET;
      if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return handleBulkSend(body.event_id);
    }

    // --- Single send ---
    if (!body.registration_id) {
      return NextResponse.json(
        { error: "registration_id is required" },
        { status: 400 }
      );
    }

    return handleSingleSend(body.registration_id);
  } catch (err) {
    console.error("SMS send error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleSingleSend(registrationId: string) {
  // Look up registration
  const { data: reg, error } = await db
    .from("registrations")
    .select("id, display_name, first_name, phone, magic_token, event_id")
    .eq("id", registrationId)
    .single();

  if (error || !reg) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  if (!reg.phone) {
    return NextResponse.json(
      { error: "No phone number on file" },
      { status: 400 }
    );
  }

  if (!reg.magic_token) {
    return NextResponse.json(
      { error: "No magic token generated" },
      { status: 400 }
    );
  }

  const name = reg.display_name || reg.first_name || "there";
  const magicLink = buildMagicLink(reg.magic_token);

  const messageBody =
    `Hey ${name} — your screening is about to start. ` +
    `Tap to enter the room:\n\n${magicLink}\n\n` +
    `This link is yours. Don't share it.`;

  const sid = await sendSMS(reg.phone, messageBody);

  if (!sid) {
    return NextResponse.json(
      { error: "SMS failed to send. Check Twilio configuration." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    message_sid: sid,
    sent_to: maskPhone(reg.phone),
  });
}

async function handleBulkSend(eventId: string) {
  // Get all registrations with phone numbers for this event
  const { data: registrations, error } = await db
    .from("registrations")
    .select("id, display_name, first_name, phone, magic_token")
    .eq("event_id", eventId)
    .not("phone", "eq", "")
    .not("magic_token", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!registrations || registrations.length === 0) {
    return NextResponse.json(
      { error: "No registrations found with phone numbers" },
      { status: 404 }
    );
  }

  let sent = 0;
  let failed = 0;
  const errors: { id: string; error: string }[] = [];

  // Send sequentially to respect Twilio rate limits
  for (const reg of registrations) {
    const name = reg.display_name || reg.first_name || "there";
    const magicLink = buildMagicLink(reg.magic_token);

    const messageBody =
      `Hey ${name} — your screening is about to start. ` +
      `Tap to enter the room:\n\n${magicLink}\n\n` +
      `This link is yours. Don't share it.`;

    const sid = await sendSMS(reg.phone, messageBody);
    if (sid) {
      sent++;
    } else {
      failed++;
      errors.push({ id: reg.id, error: "SMS send failed" });
    }
  }

  return NextResponse.json({
    success: true,
    total: registrations.length,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}

function buildMagicLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (baseUrl) {
    const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    return `${url}/watch?token=${token}`;
  }
  // Fallback — will be replaced with actual domain
  return `https://watchparty.btd.com/watch?token=${token}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return "***" + phone.slice(-4);
}
