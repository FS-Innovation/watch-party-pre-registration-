export function generateTicketNumber(): string {
  const num = Math.floor(Math.random() * 9999) + 1;
  return String(num).padStart(4, "0");
}

export function generateReferralCode(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}-${rand}`;
}

export function formatDateForTimezone(dateStr: string, timeStr: string, timezone: string): string {
  try {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short",
    });
  } catch {
    return `${dateStr} at ${timeStr}`;
  }
}

export function generateICS(
  title: string,
  description: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 120
): string {
  const start = new Date(`${dateStr}T${timeStr}:00Z`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DOAC//Watch Party//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function detectCity(): Promise<{ city: string; timezone: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return {
      city: data.city || "",
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch {
    return {
      city: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}
