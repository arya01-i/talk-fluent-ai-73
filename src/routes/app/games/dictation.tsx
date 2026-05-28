import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateActivity } from "@/lib/activities.functions";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, RefreshCw, Volume2, Check } from "lucide-react";
import { speak, hasSpeakableContent } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/games/dictation")({
  head: () => ({ meta: [{ title: "Listen & Type — Lingvo" }] }),
  component: DictationPage,
});

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}
function score(a: string, b: string) {
  const A = normalize(a).split(" ").filter(Boolean);
  const B = normalize(b).split(" ").filter(Boolean);
  if (!A.length || !B.length) return 0;
  const set = new Set(B);
  let hits = 0;
  for (const w of A) if (set.has(w)) hits++;
  return Math.round((hits / Math.max(A.length, B.length)) * 100);
}

function DictationPage() {
  const { profile } = useProfile();
  const generate = useServerFn(generateActivity);
  const [sentence, setSentence] = useState("");
  const [translation, setTranslation] = useState("");
  const [guess, setGuess] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setGuess("");
    setReveal(false);
    try {
      const r = (await generate({
        data: { learningLang: profile.learning_lang, nativeLang: profile.native_lang, level: profile.level, kind: "dictation" },
      })) as { sentence: string; translation: string };
      setSentence(r.sentence);
      setTranslation(r.translation);
      setTimeout(() => { if (hasSpeakableContent(r.sentence)) speak(r.sentence, profile.learning_lang); }, 200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (profile) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);

  const pct = reveal ? score(guess, sentence) : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/app" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} /> New sentence
        </Button>
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Listen & Type</h1>
        <p className="text-sm text-muted-foreground">Press play, then type what you hear in {profile?.learning_lang ?? "your target language"}.</p>
      </div>

      {loading && !sentence ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
      ) : (
        <Card className="p-5 space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => profile && hasSpeakableContent(sentence) && speak(sentence, profile.learning_lang)}
          >
            <Volume2 className="size-4 mr-2" /> Play again
          </Button>

          <form
            onSubmit={(e) => { e.preventDefault(); setReveal(true); }}
            className="space-y-3"
          >
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type what you heard…"
              autoFocus
              disabled={reveal}
            />
            {!reveal ? (
              <Button type="submit" className="w-full" disabled={!guess.trim()}>
                <Check className="size-4 mr-1" /> Check
              </Button>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-lg p-3 text-sm ${pct >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : pct >= 50 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-destructive/10 text-destructive"}`}>
                  Score: <span className="font-bold">{pct}%</span>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Correct:</div>
                  <div className="font-semibold">{sentence}</div>
                  {translation && <div className="text-muted-foreground mt-1">↳ {translation}</div>}
                </div>
                <Button type="button" className="w-full" onClick={load}>Next sentence</Button>
              </div>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}