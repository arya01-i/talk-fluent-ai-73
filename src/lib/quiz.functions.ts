import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Input = z.object({
  lang: z.string().min(1).max(60),
  nativeLang: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

const Schema = z.object({
  items: z.array(z.object({
    question: z.string().min(3).max(300),
    options: z.array(z.string().min(1).max(200)).min(3).max(4),
    correct_index: z.number().int().min(0).max(3),
    explanation: z.string().max(400).optional().default(""),
  })).min(5).max(15),
});

export const ensureQuizzes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const { count } = await supabaseAdmin
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("lang", data.lang).eq("level", data.level);
    if ((count ?? 0) >= 8) return { added: 0 };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `Create 10 multiple-choice quiz questions for a student learning ${data.lang} at CEFR level ${data.level}. The student's native language is ${data.nativeLang}.
Cover vocabulary, grammar, and comprehension. Each question must have 4 options and exactly one correct answer.
Question stems may be written in ${data.nativeLang} when helpful; options about ${data.lang} usage should be in ${data.lang}.
Return STRICT JSON only: { "items": [ { "question": "...", "options": ["a","b","c","d"], "correct_index": 0, "explanation": "short why" } ] }. No markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: "Generate now. JSON only." }],
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
    const parsed = Schema.parse(JSON.parse(cleaned));

    const rows = parsed.items.map((it) => ({
      lang: data.lang, level: data.level,
      question: it.question, options: it.options,
      correct_index: Math.min(it.correct_index, it.options.length - 1),
      explanation: it.explanation || null,
    }));
    const { error } = await supabaseAdmin.from("quiz_questions").insert(rows);
    if (error) throw new Error(error.message);
    return { added: rows.length };
  });