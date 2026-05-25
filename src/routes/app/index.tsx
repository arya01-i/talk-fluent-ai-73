import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, CEFR_LEVELS, LEVEL_DESCRIPTIONS, type CefrLevel } from "@/lib/languages";
import { MessageSquare, Mic, Phone, Video, BookOpen, ListChecks, Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Anya" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, update, loading } = useProfile();
  const [stats, setStats] = useState({ vocab: 0, quizzes: 0 });

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [v, q] = await Promise.all([
        supabase.from("vocab_progress").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "known"),
        supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);
      setStats({ vocab: v.count ?? 0, quizzes: q.count ?? 0 });
    })();
  }, [profile]);

  if (loading || !profile) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Hi {profile.display_name ?? "there"} 👋</h1>
        <p className="text-muted-foreground mt-1">Learning <span className="font-medium text-foreground">{profile.learning_lang}</span> · Level {profile.level}</p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Your settings</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">My language</label>
            <Select value={profile.native_lang} onValueChange={(v) => update({ native_lang: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Learning</label>
            <Select value={profile.learning_lang} onValueChange={(v) => update({ learning_lang: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.filter((l) => l !== profile.native_lang).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Level</label>
            <Select value={profile.level} onValueChange={(v) => update({ level: v as CefrLevel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>{l} — {LEVEL_DESCRIPTIONS[l]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat icon={<Trophy className="size-4 text-primary" />} label="XP" value={profile.xp} />
        <Stat icon={<Flame className="size-4 text-primary" />} label="Streak" value={`${profile.streak} days`} />
        <Stat icon={<BookOpen className="size-4 text-primary" />} label="Words learned" value={stats.vocab} />
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-3">Practice with Anya</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Tile to="/app/learn/text" title="Text chat" desc="Type with your tutor. Get corrections and translations." icon={<MessageSquare />} accent />
          <Tile to="/app/learn/voice" title="Voice practice" desc="Speak a phrase and hear Anya's reply." icon={<Mic />} />
          <Tile to="/app/learn/voice-call" title="Voice call" desc="Hands-free conversation with auto turns." icon={<Phone />} />
          <Tile to="/app/learn/video-call" title="Video avatar" desc="Talk to an animated Anya that lip-syncs." icon={<Video />} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-3">Lessons</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Tile to="/app/vocabulary" title="Vocabulary" desc="Curated words for your level. Mark as known." icon={<BookOpen />} />
          <Tile to="/app/quizzes" title="Quizzes" desc={`Test yourself at ${profile.level}. ${stats.quizzes} taken.`} icon={<ListChecks />} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="size-10 rounded-md bg-secondary flex items-center justify-center">{icon}</div>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>
    </Card>
  );
}

function Tile({ to, title, desc, icon, accent }: { to: string; title: string; desc: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Link to={to as never} className={`group block rounded-xl border p-5 transition hover:shadow-md ${accent ? "bg-primary text-primary-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-md flex items-center justify-center ${accent ? "bg-primary-foreground/15" : "bg-secondary"}`}>{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      <p className={`mt-2 text-sm ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{desc}</p>
    </Link>
  );
}