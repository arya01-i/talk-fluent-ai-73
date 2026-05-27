import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { ensureQuizzes } from "@/lib/quiz.functions";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/quizzes")({
  head: () => ({ meta: [{ title: "Quizzes — Lingvo" }] }),
  component: QuizPage,
});

type Q = { id: string; question: string; options: string[]; correct_index: number; explanation: string | null };

function QuizPage() {
  const { profile } = useProfile();
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);
  const ensure = useServerFn(ensureQuizzes);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from("quiz_questions")
      .select("id,question,options,correct_index,explanation")
      .eq("lang", profile.learning_lang).eq("level", profile.level);
    const shuffled = ((data as Q[]) ?? []).slice().sort(() => Math.random() - 0.5);
    setQs(shuffled); setI(0); setPicked(null); setScore(0); setDone(false);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!profile) return;
    setGen(true);
    try {
      const r = await ensure({ data: { lang: profile.learning_lang, nativeLang: profile.native_lang, level: profile.level } });
      toast.success(r.added > 0 ? `Added ${r.added} new questions` : "Quiz set ready");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate quiz");
    } finally {
      setGen(false);
    }
  };

  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (loading) return <div className="p-8 text-muted-foreground">Loading quizzes…</div>;
  if (qs.length === 0) return (
    <div className="max-w-xl mx-auto p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold">No quizzes yet</h1>
      <p className="text-muted-foreground">Generate a quiz set for {profile.learning_lang} · {profile.level}.</p>
      <Button size="lg" onClick={generate} disabled={gen}>
        {gen ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
        {gen ? "Generating…" : "Generate quiz"}
      </Button>
    </div>
  );

  const q = qs[i];

  const next = async () => {
    if (picked === null) return;
    const newScore = score + (picked === q.correct_index ? 1 : 0);
    setScore(newScore);
    if (i + 1 >= qs.length) {
      setDone(true);
      await supabase.from("quiz_attempts").insert({
        user_id: profile.id, lang: profile.learning_lang, level: profile.level,
        score: newScore, total: qs.length,
      });
    } else {
      setI(i + 1); setPicked(null);
    }
  };

  if (done) return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-3">Done! 🎉</h1>
      <p className="text-muted-foreground mb-6">You scored {score} / {qs.length}</p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="text-xs text-muted-foreground mb-2">{profile.learning_lang} · {profile.level} · {i + 1}/{qs.length}</div>
      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct_index;
            const reveal = picked !== null;
            const cls = reveal ? (isCorrect ? "bg-primary text-primary-foreground" : idx === picked ? "bg-destructive text-destructive-foreground" : "") : "";
            return (
              <button key={idx} onClick={() => picked === null && setPicked(idx)}
                className={`w-full text-left border rounded-md px-3 py-2 transition ${cls} ${picked === null ? "hover:bg-secondary" : ""}`}>
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && q.explanation && <p className="text-xs text-muted-foreground mt-3">{q.explanation}</p>}
        <Button className="mt-4 w-full" onClick={next} disabled={picked === null}>{i + 1 >= qs.length ? "Finish" : "Next"}</Button>
      </Card>
    </div>
  );
}