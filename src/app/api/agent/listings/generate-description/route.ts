import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/services/ai/claude-service";

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
 * Generate an AI property description using the centralized callClaude wrapper.
 * Rate limiting, spend controls, and input sanitization handled by callClaude.
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

  const systemPrompt = `You are an expert UK estate agent copywriter. ${toneInstruction} Write 2–3 paragraphs (150–250 words). Do not include the price. Start with a strong opening sentence.`;

  const userMessage = `Property details:\n- Type: ${bedrooms} bedroom ${property_type}\n- Address: ${address}`;

  const result = await callClaude({
    feature: "property_description",
    userId: user.id,
    systemPrompt,
    userMessage,
    maxTokens: 512,
  });

  if (!result) {
    return NextResponse.json(
      { error: "AI description unavailable. Please try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({ description: result.text });
}
