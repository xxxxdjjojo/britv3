import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GenerateDescriptionBody = {
  address?: string;
  property_type?: string;
  bedrooms?: number;
  tone?: "professional" | "friendly" | "luxury";
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Write in a clear, authoritative, professional tone suitable for discerning buyers. Focus on features and location benefits.",
  friendly: "Write in a warm, approachable, welcoming tone. Use accessible language that feels inviting and personal.",
  luxury: "Write in an aspirational, premium tone with evocative language. Emphasise exclusivity, quality, and lifestyle.",
};

/**
 * POST /api/agent/listings/generate-description
 * Generate an AI property description using Claude.
 * Limited to 3 calls per listing — enforced client-side in the wizard.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateDescriptionBody;
  try {
    body = (await request.json()) as GenerateDescriptionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address = "", property_type = "", bedrooms = 0, tone = "professional" } = body;
  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI description unavailable" }, { status: 503 });
  }

  const prompt = `You are an expert UK estate agent copywriter. Write a compelling property description for the following:

Property: ${bedrooms} bedroom ${property_type}
Address: ${address}

${toneInstruction}

Write 2–3 paragraphs (150–250 words). Do not include the price. Start with a strong opening sentence.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    type AnthropicResponse = {
      content: Array<{ type: string; text: string }>;
    };
    const data = (await response.json()) as AnthropicResponse;
    const text = data.content.find((c) => c.type === "text")?.text ?? "";

    return NextResponse.json({ description: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
