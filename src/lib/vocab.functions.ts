import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Input = z.object({
  lang: z.string().min(1).max(60),
  nativeLang: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

const VocabSchema = z.object({
  items: z.array(z.object({
    word: z.string().min(1).max(120),
    translation: z.string().min(1).max(200),
    example: z.string().max(300).optional().default(""),
  })).min(8).max(30),
});

export const ensureVocab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const { count } = await supabaseAdmin
      .from("vocab_items")
      .select("id", { count: "exact", head: true })
      .eq("lang", data.lang).eq("level", data.level);
    if ((count ?? 0) >= 10) return { added: 0 };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `Generate 20 essential vocabulary words for a student learning ${data.lang} at CEFR level ${data.level}, whose native language is ${data.nativeLang}.
Return STRICT JSON only: { "items": [ { "word": "<word in ${data.lang}>", "translation": "<meaning in ${data.nativeLang}>", "example": "<short example sentence in ${data.lang}>" } ] }.
No markdown, no commentary.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: "Generate the vocabulary now. JSON only." }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = VocabSchema.parse(JSON.parse(cleaned));

    const rows = parsed.items.map((it) => ({
      lang: data.lang, level: data.level,
      word: it.word, translation_en: it.translation, example: it.example || null,
    }));
    const { error } = await supabaseAdmin.from("vocab_items").insert(rows);
    if (error) throw new Error(error.message);
    return { added: rows.length };
  });