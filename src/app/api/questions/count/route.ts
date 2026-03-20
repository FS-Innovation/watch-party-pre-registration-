import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET() {
  try {
    const { count, error } = await db
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .neq("guest_question", "");

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
