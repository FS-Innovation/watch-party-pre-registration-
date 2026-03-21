// DISABLED: Twilio/SMS is disabled until account is confirmed.
// All SMS functions return null / no-op. Re-enable when Twilio creds are ready.

import Twilio from "twilio";

let _client: ReturnType<typeof Twilio> | null = null;

export function getTwilioClient() {
  if (_client) return _client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  _client = Twilio(accountSid, authToken);
  return _client;
}

export function getTwilioPhoneNumber(): string {
  return process.env.TWILIO_PHONE_NUMBER || "";
}

/**
 * Send an SMS via Twilio.
 * Returns the message SID on success, null on failure.
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<string | null> {
  const client = getTwilioClient();
  if (!client) {
    console.warn("Twilio not configured — SMS not sent");
    return null;
  }

  const from = getTwilioPhoneNumber();
  if (!from) {
    console.warn("TWILIO_PHONE_NUMBER not set — SMS not sent");
    return null;
  }

  try {
    const message = await client.messages.create({ to, from, body });
    return message.sid;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return null;
  }
}
