import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock, BookOpen, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/app/learn/lessons")({
  head: () => ({ meta: [{ title: "Lessons — Lingvo" }] }),
  component: LessonsPage,
});

const TOTAL = 5;

type LessonRow = { id: string; order_index: number; title: string; summary: string | null };
type ProgressRow = { lesson_id: string; passed: boolean; score: number; total: number };

function LessonsPage() {
  const { profile } = useProfile();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [prog, setProg] = useState<Record<string, ProgressRow>>({});

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: ls } = await supabase
        .from("lessons")
        .select("id,order_index,title,summary")
        .eq("lang", profile.learning_lang).eq("level", profile.level)
        .order("order_index");
      setLessons((ls as LessonRow[]) ?? []);
      const { data: p } = await supabase
        .from("lesson_progress")
        .select("lesson_id,passed,score,total")
        .eq("user_id", profile.id);
      const map: Record<string, ProgressRow> = {};
      (p ?? []).forEach((r: any) => { map[r.lesson_id] = r; });
      setProg(map);
    })();
  }, [profile]);

  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const byIndex = new Map(lessons.map((l) => [l.order_index, l]));
  const completedCount = lessons.filter((l) => prog[l.id]?.passed).length;
  const items = Array.from({ length: TOTAL }, (_, i) => i + 1);

  // Unlock rule: lesson N unlocked if lesson N-1 is passed (or N=1)
  const isUnlocked = (n: number) => {
    if (n === 1) return true;
    const prev = byIndex.get(n - 1);
    return !!(prev && prog[prev.id]?.passed);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">{profile.level} Course · {profile.learning_lang}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Complete each lesson and pass its exam to unlock the next one.</p>
      <div className="mb-6">
        <Progress value={(completedCount / TOTAL) * 100} />
        <div className="text-xs text-muted-foreground mt-1">{completedCount} / {TOTAL} lessons complete</div>
      </div>

      <div className="space-y-3">
        {items.map((n) => {
          const l = byIndex.get(n);
          const p = l ? prog[l.id] : undefined;
          const unlocked = isUnlocked(n);
          const passed = p?.passed;
          return (
            <Link
              key={n}
              to="/app/learn/lessons/$index"
              params={{ index: String(n) }}
              className={`block ${!unlocked ? "pointer-events-none" : ""}`}
              aria-disabled={!unlocked}
            >
              <Card className={`p-4 flex items-center gap-4 transition ${unlocked ? "hover:shadow-md" : "opacity-60"}`}>
                <div className={`size-10 rounded-full flex items-center justify-center font-bold ${passed ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {passed ? <CheckCircle2 className="size-5" /> : !unlocked ? <Lock className="size-4" /> : n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">Lesson {n}{l ? ` · ${l.title}` : ""}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {!unlocked ? "Locked — finish the previous lesson first."
                      : l ? (l.summary ?? "Tap to begin.")
                      : "Tap to generate this lesson."}
                  </div>
                  {p && p.total > 0 && (
                    <div className="text-xs mt-1 text-muted-foreground">Best: {p.score}/{p.total}</div>
                  )}
                </div>
                <BookOpen className="size-4 text-muted-foreground shrink-0" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}