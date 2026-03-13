import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error, count } = await supabase
      .from("registrations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        { registrations: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registrations: data || [],
      total: count || 0,
    });
  } catch {
    return NextResponse.json({ registrations: [], total: 0 }, { status: 500 });
  }
}
