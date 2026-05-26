import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const InputSchema = z.object({
  lang: z.string().min(1).max(60),
  nativeLang: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  orderIndex: z.number().int().min(1).max(10),
});

const LessonSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })).min(2).max(8),
  exam: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).min(3).max(4),
    correct_index: z.number().int().min(0).max(3),
    explanation: z.string().optional().default(""),
  })).min(3).max(8),
});

export const ensureLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // Try cache first
    const { data: existing } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("lang", data.lang)
      .eq("level", data.level)
      .eq("order_index", data.orderIndex)
      .maybeSingle();
    if (existing) return { lesson: existing };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You are a curriculum designer for a language-learning app called Lingvo.
Generate ONE lesson for a student learning ${data.lang} at CEFR level ${data.level}.
The student's native language is ${data.nativeLang}.
This is lesson #${data.orderIndex} of 5 in the ${data.level} course — progress from basics to harder topics across the 5 lessons.

Return STRICT JSON only (no markdown fences), matching:
{
  "title": "short lesson title (in ${data.nativeLang})",
  "summary": "one sentence in ${data.nativeLang}",
  "sections": [
    { "heading": "section title in ${data.nativeLang}", "body": "explanation in ${data.nativeLang} with example ${data.lang} phrases. Use newlines. Keep clear." }
  ],
  "exam": [
    { "question": "question in ${data.nativeLang} testing ${data.lang}", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "1-line why" }
  ]
}
Provide 3-5 sections and 5 exam questions. Adapt difficulty to ${data.level}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Generate lesson ${data.orderIndex} for ${data.lang} ${data.level}. JSON only.` },
        ],
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
    let parsed: z.infer<typeof LessonSchema>;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      parsed = LessonSchema.parse(JSON.parse(cleaned));
    } catch (e) {
      throw new Error("Lesson generation failed to parse. Please retry.");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("lessons")
      .insert({
        lang: data.lang,
        level: data.level,
        order_index: data.orderIndex,
        title: parsed.title,
        summary: parsed.summary,
        sections: parsed.sections,
        exam: parsed.exam,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { lesson: inserted };
  });