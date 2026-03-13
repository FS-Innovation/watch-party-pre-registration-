import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    // Get referral count for this code
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_code", code)
      .eq("converted", true);

    return NextResponse.json({ referral_count: count || 0 });
  } catch {
    return NextResponse.json({ referral_count: 0 });
  }
}
