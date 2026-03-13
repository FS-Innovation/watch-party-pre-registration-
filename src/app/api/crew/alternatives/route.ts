import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const currentCrewId = request.nextUrl.searchParams.get("current");
  const eventId = request.nextUrl.searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ crews: [] });
  }

  try {
    let query = supabase
      .from("crews")
      .select("*")
      .eq("event_id", eventId)
      .in("status", ["forming", "open"])
      .lt("current_count", 40)
      .order("current_count", { ascending: false });

    if (currentCrewId) {
      query = query.neq("id", currentCrewId);
    }

    const { data, error } = await query.limit(4);

    if (error) {
      return NextResponse.json({ crews: [] });
    }

    return NextResponse.json({ crews: data || [] });
  } catch {
    return NextResponse.json({ crews: [] });
  }
}
