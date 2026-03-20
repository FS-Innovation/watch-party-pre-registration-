import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

// Selected columns instead of SELECT * (avoids pulling large JSONB fields)
const SELECTED_COLUMNS = [
  "id",
  "event_id",
  "display_name",
  "email",
  "phone",
  "city",
  "timezone",
  "device_type",
  "motivation_text",
  "guest_question",
  "ai_segment",
  "ticket_number",
  "referral_code",
  "magic_token",
  "commitment_confirmed",
  "committed_at",
  "created_at",
].join(",");

export async function GET(request: NextRequest) {
  // Basic auth check
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await db
      .from("registrations")
      .select(SELECTED_COLUMNS, { count: "estimated" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { registrations: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registrations: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ registrations: [], total: 0 }, { status: 500 });
  }
}
