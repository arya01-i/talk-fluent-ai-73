import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensureLesson } from "@/lib/lessons.functions";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/learn/lessons/$index")({
  head: () => ({ meta: [{ title: "Lesson — Lingvo" }] }),
  component: LessonDetail,
});

type Section = { heading: string; body: string };
type ExamQ = { question: string; options: string[]; correct_index: number; explanation?: string };
type Lesson = {
  id: string; title: string; summary: string | null;
  sections: Section[]; exam: ExamQ[]; order_index: number;
};

function LessonDetail() {
  const { index } = Route.useParams();
  const orderIndex = Math.max(1, Math.min(5, parseInt(index, 10) || 1));
  const { profile } = useProfile();
  const nav = useNavigate();
  const ensure = useServerFn(ensureLesson);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"learn" | "exam" | "done">("learn");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { lesson } = await ensure({
          data: {
            lang: profile.learning_lang,
            nativeLang: profile.native_lang,
            level: profile.level,
            orderIndex,
          },
        });
        if (!cancelled) setLesson(lesson as Lesson);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load lesson");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile, orderIndex, ensure]);

  const submit = async () => {
    if (!lesson || !profile) return;
    const total = lesson.exam.length;
    let score = 0;
    lesson.exam.forEach((q, i) => { if (answers[i] === q.correct_index) score++; });
    const passed = score / total >= 0.7;
    setResult({ score, total, passed });
    setPhase("done");
    await supabase.from("lesson_progress").upsert({
      user_id: profile.id, lesson_id: lesson.id,
      score, total, passed, completed_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  };

  if (!profile || loading) return (
    <div className="p-12 flex items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Preparing your lesson…
    </div>
  );
  if (!lesson) return <div className="p-8 text-muted-foreground">Lesson unavailable.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <Link to="/app/learn/lessons" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 mr-1" /> Back to lessons
      </Link>
      <div>
        <div className="text-xs text-muted-foreground">Lesson {lesson.order_index} · {profile.level} · {profile.learning_lang}</div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {lesson.summary && <p className="text-muted-foreground mt-1">{lesson.summary}</p>}
      </div>

      {phase === "learn" && (
        <>
          <div className="space-y-4">
            {lesson.sections.map((s, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold mb-2">{s.heading}</h2>
                  <Button size="icon" variant="ghost" onClick={() => speak(s.body, profile.learning_lang)} title="Read aloud">
                    <Volume2 className="size-4" />
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{s.body}</div>
              </Card>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setPhase("exam")}>
            Take the exam ({lesson.exam.length} questions)
          </Button>
        </>
      )}

      {phase === "exam" && (
        <Card className="p-5 space-y-5">
          <h2 className="font-semibold text-lg">Exam</h2>
          {lesson.exam.map((q, i) => (
            <div key={i}>
              <div className="font-medium mb-2">{i + 1}. {q.question}</div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: idx }))}
                    className={`w-full text-left border rounded-md px-3 py-2 transition ${answers[i] === idx ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  >{opt}</button>
                ))}
              </div>
            </div>
          ))}
          <Button
            className="w-full"
            disabled={Object.keys(answers).length < lesson.exam.length}
            onClick={submit}
          >Submit exam</Button>
        </Card>
      )}

      {phase === "done" && result && (
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">{result.passed ? "Passed! 🎉" : "Not quite yet"}</h2>
          <p className="text-muted-foreground">You scored {result.score} / {result.total}. {result.passed ? "Lesson unlocked the next one." : "You need 70% to pass — review and try again."}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={() => { setPhase("learn"); setAnswers({}); setResult(null); }}>Review lesson</Button>
            {result.passed && orderIndex < 5 ? (
              <Button onClick={() => nav({ to: "/app/learn/lessons/$index", params: { index: String(orderIndex + 1) } })}>Next lesson →</Button>
            ) : (
              <Button onClick={() => nav({ to: "/app/learn/lessons" })}>Back to course</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}