"use client";

import { useState, useCallback } from "react";
import { Sparkles, Copy, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AiFeedback } from "@/components/ai/AiFeedback";
import { cn } from "@/lib/utils";

type Tone = "professional" | "friendly" | "luxury";

type ListingAssistantProps = Readonly<{
  propertyAddress?: string;
  propertyDetails?: {
    beds: number;
    baths: number;
    type: string;
  };
}>;

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
];

const MOCK_TEXTS: Record<Tone, string> = {
  professional:
    "This beautifully presented three-bedroom terraced property offers generous living accommodation across two floors. The ground floor comprises a welcoming entrance hallway leading to a spacious reception room with period features. The modern fitted kitchen overlooks the rear garden and provides ample storage and workspace. Upstairs, three well-proportioned bedrooms are served by a contemporary family bathroom. Externally, the property benefits from a low-maintenance front garden and an enclosed rear garden, ideal for families.",
  friendly:
    "Welcome to your potential new home! This charming three-bedroom terrace has bags of character and sits on one of the most popular streets in the area. Step inside to find a lovely light-filled living room that\u2019s perfect for cosy evenings in. The kitchen has been recently updated and opens out to a gorgeous private garden \u2013 great for barbecues and lazy Sunday mornings. Upstairs you\u2019ll find three good-sized bedrooms and a sparkling bathroom. With local shops, parks, and excellent schools all within walking distance, this one really does tick all the boxes!",
  luxury:
    "An exceptional period residence of remarkable distinction, this three-bedroom property has been exquisitely appointed to the highest specification. The principal reception room showcases original architectural details including ornate cornicing and a statement marble fireplace. The bespoke handcrafted kitchen features Calacatta marble worktops and integrated Miele appliances. The master suite offers a private sanctuary with floor-to-ceiling sash windows flooding the space with natural light. Every detail, from the restored herringbone parquet flooring to the designer bathroom suites, reflects an unwavering commitment to luxury living.",
};

const MAX_REGENERATIONS = 3;
const MAX_CHARACTERS = 2000;

export function ListingAssistant({ propertyAddress, propertyDetails }: ListingAssistantProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [regenerationsLeft, setRegenerationsLeft] = useState(MAX_REGENERATIONS);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedText(MOCK_TEXTS[tone]);
      setIsGenerating(false);
    }, 1500);
  }, [tone]);

  const handleRegenerate = useCallback(() => {
    if (regenerationsLeft <= 0) return;
    setRegenerationsLeft((prev) => prev - 1);
    handleGenerate();
  }, [regenerationsLeft, handleGenerate]);

  const handleCopy = useCallback(async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silent fail
    }
  }, [generatedText]);

  const wordCount = generatedText
    ? generatedText.trim().split(/\s+/).length
    : 0;
  const charCount = generatedText.length;

  return (
    <Card className="w-full max-w-[800px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-brand-primary" />
          AI Listing Assistant
        </CardTitle>
        <CardDescription>
          Generate compelling property descriptions powered by AI. Select a tone and let the assistant craft your listing.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Property Context */}
        {(propertyAddress || propertyDetails) && (
          <div className="rounded-lg bg-brand-primary/5 border border-brand-primary/20 p-4">
            {propertyAddress && (
              <p className="text-sm font-semibold text-foreground">{propertyAddress}</p>
            )}
            {propertyDetails && (
              <p className="text-sm text-muted-foreground mt-1">
                {propertyDetails.beds} bed &middot; {propertyDetails.baths} bath &middot; {propertyDetails.type}
              </p>
            )}
          </div>
        )}

        {/* Tone Selector */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Select Tone</p>
          <div className="flex flex-wrap gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            {TONE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                className={cn(
                  "flex-1 min-w-[100px] h-10 rounded-lg text-sm font-medium transition-all",
                  tone === value
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {!generatedText && !isGenerating && (
          <Button
            onClick={handleGenerate}
            className="w-full h-12 gap-2 bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Sparkles className="size-4" />
            Generate Description
          </Button>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
        )}

        {/* Generated Text Area */}
        {generatedText && !isGenerating && (
          <div className="relative">
            <textarea
              className="w-full min-h-[280px] p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-800 focus:border-brand-primary dark:focus:border-brand-primary focus:ring-0 focus:outline-none text-foreground leading-relaxed text-base transition-all resize-none"
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
            />

            {/* Metrics Bar */}
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Characters:</span>{" "}
                  <span className="font-bold text-foreground">{charCount} / {MAX_CHARACTERS}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Words:</span>{" "}
                  <span className="font-bold text-foreground">{wordCount}</span>
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  <Copy className="size-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerationsLeft <= 0}
                  className="gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  Regenerate
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {regenerationsLeft} of {MAX_REGENERATIONS} regenerations remaining
                </span>
              </div>

              <AiFeedback
                featureId="listing-assistant"
                referenceId="mock-generation"
              />
            </div>
          </div>
        )}

        {/* AI Tip */}
        {!generatedText && !isGenerating && (
          <div className="flex gap-4 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
            <div className="text-brand-primary">
              <Lightbulb className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">AI Pro Tip</h4>
              <p className="text-sm text-muted-foreground">
                Properties with &ldquo;Friendly&rdquo; and &ldquo;Luxury&rdquo; descriptions tend to receive 15% more enquiries. Try toggling those tones to see how the AI rephrases your property&apos;s key features.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
