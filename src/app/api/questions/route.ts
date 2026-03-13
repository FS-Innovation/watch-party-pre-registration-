import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { question, event_id } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Store in signal_responses table for pre-registration questions
    const { error } = await supabase.from("signal_responses").insert({
      question_key: "guest_question",
      answer_text: question,
      segment_tag: event_id || "",
    });

    if (error) {
      console.error("Question submission error:", error);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
