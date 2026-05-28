import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateActivity } from "@/lib/activities.functions";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw, Volume2 } from "lucide-react";
import { speak, hasSpeakableContent } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/games/word-match")({
  head: () => ({ meta: [{ title: "Word match — Lingvo" }] }),
  component: WordMatchPage,
});

type Pair = { target: string; native: string };
type Tile = { id: string; pairId: number; text: string; side: "target" | "native"; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function WordMatchPage() {
  const { profile } = useProfile();
  const generate = useServerFn(generateActivity);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [moves, setMoves] = useState(0);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setSelected(null);
    setWrong([]);
    setMoves(0);
    try {
      const r = (await generate({
        data: { learningLang: profile.learning_lang, nativeLang: profile.native_lang, level: profile.level, kind: "pairs" },
      })) as { pairs: Pair[] };
      setPairs(r.pairs);
      const t: Tile[] = shuffle(
        r.pairs.flatMap((p: Pair, i: number) => [
          { id: `t-${i}`, pairId: i, text: p.target, side: "target" as const, matched: false },
          { id: `n-${i}`, pairId: i, text: p.native, side: "native" as const, matched: false },
        ]),
      );
      setTiles(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pairs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (profile) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);

  const allDone = tiles.length > 0 && tiles.every((t) => t.matched);

  const onTap = (tile: Tile) => {
    if (tile.matched) return;
    if (tile.side === "target" && profile && hasSpeakableContent(tile.text)) {
      speak(tile.text, profile.learning_lang);
    }
    if (!selected) { setSelected(tile); return; }
    if (selected.id === tile.id) { setSelected(null); return; }
    setMoves((m) => m + 1);
    if (selected.pairId === tile.pairId && selected.side !== tile.side) {
      setTiles((cur) => cur.map((t) => (t.pairId === tile.pairId ? { ...t, matched: true } : t)));
      setSelected(null);
    } else {
      const ids = [selected.id, tile.id];
      setWrong(ids);
      setSelected(null);
      setTimeout(() => setWrong([]), 600);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/app" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} /> New round
        </Button>
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Word match</h1>
        <p className="text-sm text-muted-foreground">Tap a {profile?.learning_lang ?? "target"} word, then its meaning. Tap the target word to hear it.</p>
      </div>

      {loading && tiles.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">Moves: <span className="font-semibold text-foreground">{moves}</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            {tiles.map((t) => {
              const isSelected = selected?.id === t.id;
              const isWrong = wrong.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onTap(t)}
                  disabled={t.matched}
                  className={`relative p-3 md:p-4 rounded-xl border text-sm md:text-base text-left transition-all min-h-[72px] flex items-center
                    ${t.matched ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 line-through opacity-70" : ""}
                    ${!t.matched && isSelected ? "bg-primary text-primary-foreground border-primary scale-[1.02]" : ""}
                    ${!t.matched && isWrong ? "bg-destructive/15 border-destructive animate-pulse" : ""}
                    ${!t.matched && !isSelected && !isWrong ? "bg-card hover:border-primary/40 hover:scale-[1.02]" : ""}`}
                >
                  <span className="flex-1">{t.text}</span>
                  {t.side === "target" && !t.matched && <Volume2 className="size-3.5 opacity-50 ml-2 shrink-0" />}
                </button>
              );
            })}
          </div>
          {allDone && (
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/10 text-center">
              <div className="text-3xl">🎉</div>
              <div className="font-bold mt-1">All matched in {moves} moves!</div>
              <Button className="mt-3" onClick={load}>Play again</Button>
            </Card>
          )}
          {pairs.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Show all answers</summary>
              <ul className="mt-2 space-y-1">
                {pairs.map((p, i) => <li key={i}><span className="font-medium text-foreground">{p.target}</span> — {p.native}</li>)}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}