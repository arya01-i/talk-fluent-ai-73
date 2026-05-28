import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateActivity } from "@/lib/activities.functions";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw, Volume2, Eye, EyeOff } from "lucide-react";
import { speak, stopSpeaking, hasSpeakableContent } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/games/story")({
  head: () => ({ meta: [{ title: "Mini story — Lingvo" }] }),
  component: StoryPage,
});

type Line = { target: string; native: string };

function StoryPage() {
  const { profile } = useProfile();
  const generate = useServerFn(generateActivity);
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const load = async (t?: string) => {
    if (!profile) return;
    setLoading(true);
    setReveal({});
    stopSpeaking();
    try {
      const r = (await generate({
        data: { learningLang: profile.learning_lang, nativeLang: profile.native_lang, level: profile.level, kind: "story", topic: t || undefined },
      })) as { title: string; lines: Line[] };
      setTitle(r.title);
      setLines(r.lines);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (profile) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);
  useEffect(() => () => stopSpeaking(), []);

  const playAll = async () => {
    if (!profile) return;
    stopSpeaking();
    for (const line of lines) {
      if (!hasSpeakableContent(line.target)) continue;
      await new Promise<void>((resolve) => speak(line.target, profile.learning_lang, () => resolve()));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/app" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <Button size="sm" variant="outline" onClick={() => load(topic)} disabled={loading}>
          <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} /> New story
        </Button>
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mini story</h1>
        <p className="text-sm text-muted-foreground">A bite-sized story in {profile?.learning_lang ?? "your target language"}. Tap a line to hear it.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(topic); }}
        className="flex gap-2"
      >
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Optional topic (e.g. coffee shop, space, friendship)"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          maxLength={60}
        />
        <Button type="submit" variant="outline" disabled={loading}>Go</Button>
      </form>

      {loading && lines.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
      ) : lines.length > 0 ? (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button size="sm" variant="ghost" onClick={playAll}><Volume2 className="size-4 mr-1" /> Play all</Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="border rounded-lg p-3 hover:bg-accent/30 transition">
                <button
                  type="button"
                  onClick={() => profile && hasSpeakableContent(l.target) && speak(l.target, profile.learning_lang)}
                  className="text-left w-full font-medium inline-flex items-start gap-2 group"
                >
                  <Volume2 className="size-4 mt-1 shrink-0 text-muted-foreground group-hover:text-primary" />
                  <span>{l.target}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReveal((r) => ({ ...r, [i]: !r[i] }))}
                  className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
                >
                  {reveal[i] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {reveal[i] ? "Hide translation" : "Show translation"}
                </button>
                {reveal[i] && <div className="text-sm text-muted-foreground mt-1">↳ {l.native}</div>}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}