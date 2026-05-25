import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  learningLang: z.string().min(1).max(60),
  nativeLang: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  mode: z.enum(["text", "voice", "voice_call", "video_call"]).default("text"),
  messages: z.array(MessageSchema).min(1).max(40),
});

export const chatWithTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const spoken =
      data.mode === "voice" || data.mode === "voice_call" || data.mode === "video_call";

    const system = `You are Anya, a warm, encouraging language tutor.
The student's native language is ${data.nativeLang}.
They are learning ${data.learningLang} at CEFR level ${data.level}.

Rules:
- Reply primarily in ${data.learningLang}, adapted to level ${data.level} (simple at A1/A2, rich at C1/C2).
- After your ${data.learningLang} reply, on a new line write "↳" then a short ${data.nativeLang} translation/hint (1 line max).
- Gently correct mistakes: quote the error and give the corrected form.
- Ask ONE engaging follow-up question to keep the conversation going.
- ${spoken ? "Keep replies SHORT (1–3 sentences) since they will be spoken aloud. Avoid markdown, lists, emojis, and special symbols." : "Keep replies focused (2–5 sentences). Light markdown ok."}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable settings.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content ?? "…";
    return { reply };
  });