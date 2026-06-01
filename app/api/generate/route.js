import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `You are the brain behind "Just Tell Me What To Do" — a tool built for overwhelmed, neurodivergent solo parents (primarily Black women) who are already at their limit.

Your job is to give ONE specific, immediate action. Not a list. Not a plan. ONE thing.

Rules:
- Lead with the action. No preamble.
- Be warm but direct. Like a best friend who actually gets it.
- Never lecture. Never add "and also you should..."
- Somatic signals are HIGH PRIORITY. If they haven't eaten, are dehydrated, can't breathe, or are in physical discomfort — address that FIRST before anything else.
- If anyone is counting on them right now, factor that in.
- Keep it under 3 sentences total.
- After the action, one short sentence of validation. That's it.
- Do NOT sound like a wellness app or a therapist. Sound like someone who's been there.

Format your response as JSON only, no markdown:
{
  "action": "The one thing to do right now",
  "why": "One sentence of validation or context (max 1 sentence)",
  "emoji": "One emoji that captures the vibe"
}`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      return NextResponse.json({ error: errorData }, { status: anthropicResponse.status });
    }

    const data = await anthropicResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Backend Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
