import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  learningLang: z.string().min(1).max(60),
  nativeLang: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  kind: z.enum(["pairs", "dictation", "story"]),
  topic: z.string().max(80).optional(),
});

async function callAI(apiKey: string, system: string, user: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI error: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

export const generateActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    if (data.kind === "pairs") {
      const result = await callAI(
        apiKey,
        `You produce vocabulary pairs for a language learning game. Always return strict JSON.`,
        `Generate 6 unique ${data.learningLang} words/short phrases appropriate for CEFR ${data.level}${data.topic ? ` about "${data.topic}"` : ""} with their ${data.nativeLang} translations.
Return JSON: { "pairs": [{ "target": "...", "native": "..." }, ... 6 items ] }. No commentary.`,
      );
      const pairs = Array.isArray(result.pairs)
        ? result.pairs.filter((p: { target?: string; native?: string }) => p?.target && p?.native).slice(0, 6)
        : [];
      if (pairs.length < 4) throw new Error("Could not generate enough pairs. Try again.");
      return { pairs } as { pairs: { target: string; native: string }[] };
    }

    if (data.kind === "dictation") {
      const result = await callAI(
        apiKey,
        `You produce dictation sentences for language learners. Always return strict JSON.`,
        `Generate ONE short ${data.learningLang} sentence (5–12 words) at CEFR ${data.level}${data.topic ? ` about "${data.topic}"` : ""} that a learner should write down after hearing.
Return JSON: { "sentence": "...", "translation": "<${data.nativeLang} meaning>" }. No commentary.`,
      );
      if (!result.sentence) throw new Error("Could not generate a sentence. Try again.");
      return { sentence: String(result.sentence), translation: String(result.translation ?? "") };
    }

    // story
    const result = await callAI(
      apiKey,
      `You write tiny bilingual stories for language learners. Always return strict JSON.`,
      `Write a 4-sentence ${data.learningLang} micro-story at CEFR ${data.level}${data.topic ? ` about "${data.topic}"` : ""}.
Return JSON: { "title": "<short ${data.learningLang} title>", "lines": [{ "target": "<sentence in ${data.learningLang}>", "native": "<${data.nativeLang} translation>" }, ... 4 items ] }. No commentary.`,
    );
    const lines = Array.isArray(result.lines)
      ? result.lines.filter((l: { target?: string; native?: string }) => l?.target && l?.native).slice(0, 6)
      : [];
    if (lines.length < 3) throw new Error("Could not generate a story. Try again.");
    return { title: String(result.title ?? "Story"), lines } as { title: string; lines: { target: string; native: string }[] };
  });