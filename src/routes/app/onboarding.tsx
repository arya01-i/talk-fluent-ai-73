import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LANGUAGES, CEFR_LEVELS, LEVEL_DESCRIPTIONS, flagFor, type CefrLevel } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { Brain, Check, ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Lingvo" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { profile, update, loading } = useProfile();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [native, setNative] = useState("");
  const [target, setTarget] = useState("");
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && !native) {
      setNative(profile.native_lang);
      setTarget(profile.learning_lang === profile.native_lang ? "" : profile.learning_lang);
      setLevel(profile.level);
    }
  }, [profile, native]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = step === 1 ? LANGUAGES.filter((l) => l !== native) : LANGUAGES;
    return q ? base.filter((l) => l.toLowerCase().includes(q)) : base;
  }, [query, step, native]);

  if (loading || !profile) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const finish = async () => {
    setSaving(true);
    await update({ native_lang: native, learning_lang: target, level });
    localStorage.setItem(`lingvo_onboarded_${profile.id}`, "1");
    setSaving(false);
    nav({ to: "/app" });
  };

  const canNext = step === 0 ? !!native : step === 1 ? !!target && target !== native : true;

  return (
    <div className="min-h-full bg-hero-radial">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="size-10 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Brain className="size-5 text-white" />
          </span>
          <div className="font-bold text-xl">Lingvo</div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(
              "h-1.5 flex-1 rounded-full transition",
              i <= step ? "bg-brand-gradient" : "bg-secondary",
            )} />
          ))}
        </div>

        {step < 2 && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {step === 0 ? "What's your language?" : "Which language do you want to learn?"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === 0 ? "We'll translate and explain in this language." : "Pick a language to master with your AI tutor."}
            </p>
            <Input
              placeholder="Search languages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-6"
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[55vh] overflow-y-auto pr-1">
              {filtered.map((l) => {
                const selected = step === 0 ? native === l : target === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => step === 0 ? setNative(l) : setTarget(l)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-left transition text-sm",
                      selected
                        ? "border-transparent bg-brand-gradient text-white shadow-lg"
                        : "border-border bg-card/60 hover:border-primary/50",
                    )}
                  >
                    <span className="text-2xl leading-none">{flagFor(l)}</span>
                    <span className="font-medium truncate">{l}</span>
                    {selected && <Check className="size-4 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">What's your level?</h1>
            <p className="text-muted-foreground mt-2">
              Learning <span className="text-foreground font-medium">{flagFor(target)} {target}</span>. Pick your CEFR starting point.
            </p>
            <div className="mt-6 space-y-2">
              {CEFR_LEVELS.map((l) => {
                const selected = level === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition",
                      selected
                        ? "border-transparent bg-brand-gradient text-white shadow-lg"
                        : "border-border bg-card/60 hover:border-primary/50",
                    )}
                  >
                    <div className={cn(
                      "size-12 rounded-lg flex items-center justify-center font-bold text-lg shrink-0",
                      selected ? "bg-white/20" : "bg-secondary",
                    )}>{l}</div>
                    <div className="min-w-0">
                      <div className="font-semibold">{LEVEL_DESCRIPTIONS[l].split(" — ")[0]}</div>
                      <div className={cn("text-sm truncate", selected ? "text-white/85" : "text-muted-foreground")}>
                        {LEVEL_DESCRIPTIONS[l].split(" — ")[1]}
                      </div>
                    </div>
                    {selected && <Check className="size-5 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          {step < 2 ? (
            <Button
              onClick={() => { setQuery(""); setStep((s) => s + 1); }}
              disabled={!canNext}
              className="bg-brand-gradient text-white border-0 hover:opacity-90"
            >
              Continue <ArrowRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={saving}
              className="bg-brand-gradient text-white border-0 hover:opacity-90"
            >
              {saving ? "Saving…" : "Start learning"} <ArrowRight className="size-4 ml-1" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          You can change these anytime in Settings.
        </p>
      </div>
    </div>
  );
}