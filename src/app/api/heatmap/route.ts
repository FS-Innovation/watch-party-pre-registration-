import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ heatmap: [] });
  }

  try {
    const { data, error } = await supabase
      .from("curiosity_heatmap")
      .select("*")
      .eq("event_id", eventId)
      .order("question_count", { ascending: false });

    if (error) {
      return NextResponse.json({ heatmap: [] });
    }

    return NextResponse.json({ heatmap: data || [] });
  } catch {
    return NextResponse.json({ heatmap: [] });
  }
}
