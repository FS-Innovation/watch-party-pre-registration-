import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { registration_id, from_crew_id, to_crew_id } = await request.json();

    if (!registration_id || !to_crew_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Update registration
    const { error } = await supabase
      .from("registrations")
      .update({
        crew_id: to_crew_id,
        crew_accepted: false,
        switched_crew: true,
        switched_to_crew_id: to_crew_id,
      })
      .eq("id", registration_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Decrement old crew, increment new crew
    if (from_crew_id) {
      const { data: oldCrew } = await supabase
        .from("crews")
        .select("current_count")
        .eq("id", from_crew_id)
        .single();

      if (oldCrew) {
        await supabase
          .from("crews")
          .update({ current_count: Math.max(0, oldCrew.current_count - 1) })
          .eq("id", from_crew_id);
      }
    }

    const { data: newCrew } = await supabase
      .from("crews")
      .select("*")
      .eq("id", to_crew_id)
      .single();

    if (newCrew) {
      await supabase
        .from("crews")
        .update({ current_count: newCrew.current_count + 1 })
        .eq("id", to_crew_id);

      return NextResponse.json({
        success: true,
        crew: newCrew,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
