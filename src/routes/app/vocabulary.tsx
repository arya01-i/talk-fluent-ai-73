import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Check, Sparkles, Loader2 } from "lucide-react";
import { speak } from "@/lib/speech";
import { useServerFn } from "@tanstack/react-start";
import { ensureVocab } from "@/lib/vocab.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/vocabulary")({
  head: () => ({ meta: [{ title: "Vocabulary — Lingvo" }] }),
  component: VocabPage,
});

type Item = { id: string; word: string; translation_en: string; example: string | null };

function VocabPage() {
  const { profile } = useProfile();
  const [items, setItems] = useState<Item[]>([]);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [gen, setGen] = useState(false);
  const generate = useServerFn(ensureVocab);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase.from("vocab_items")
      .select("id,word,translation_en,example")
      .eq("lang", profile.learning_lang).eq("level", profile.level).order("word");
    setItems((data as Item[]) ?? []);
    const { data: prog } = await supabase.from("vocab_progress")
      .select("item_id,status").eq("user_id", profile.id).eq("status", "known");
    setKnown(new Set((prog ?? []).map((r: any) => r.item_id)));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [profile?.learning_lang, profile?.level]);

  const handleGenerate = async () => {
    if (!profile) return;
    setGen(true);
    try {
      await generate({ data: { lang: profile.learning_lang, nativeLang: profile.native_lang, level: profile.level } });
      await load();
      toast.success("Vocabulary ready!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGen(false);
    }
  };

  const toggle = async (id: string) => {
    if (!profile) return;
    const isKnown = known.has(id);
    const next = new Set(known); isKnown ? next.delete(id) : next.add(id);
    setKnown(next);
    await supabase.from("vocab_progress").upsert({
      user_id: profile.id, item_id: id, status: isKnown ? "learning" : "known",
    });
  };

  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Vocabulary</h1>
          <p className="text-sm text-muted-foreground">{profile.learning_lang} · Level {profile.level} · {known.size}/{items.length} known</p>
        </div>
        <Button onClick={handleGenerate} disabled={gen} variant="outline" size="sm">
          {gen ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Sparkles className="size-4 mr-1" />}
          {items.length === 0 ? "Generate vocabulary" : "Add more"}
        </Button>
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No vocabulary yet for {profile.learning_lang} {profile.level}. Tap "Generate vocabulary" to create some with AI.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <Card key={it.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-lg">{it.word}</div>
                  <div className="text-sm text-muted-foreground">{it.translation_en}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => speak(it.word, profile.learning_lang)}><Volume2 className="size-4" /></Button>
              </div>
              {it.example && <div className="text-xs italic text-muted-foreground">{it.example}</div>}
              <Button size="sm" variant={known.has(it.id) ? "default" : "outline"} onClick={() => toggle(it.id)}>
                <Check className="size-3 mr-1" /> {known.has(it.id) ? "Known" : "Mark as known"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}