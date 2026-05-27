import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, CEFR_LEVELS, LEVEL_DESCRIPTIONS, type CefrLevel } from "@/lib/languages";
import { MessageSquare, Mic, Phone, Video, BookOpen, ListChecks, Flame, Trophy, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LANG_INFO: Record<string, { flag: string; greeting: string; tip: string; tagline: string }> = {
  English: { flag: "🇬🇧", greeting: "Hello!", tip: "Practice 'th' sounds today.", tagline: "Unlock global careers" },
  Spanish: { flag: "🇪🇸", greeting: "¡Hola!", tip: "Roll the 'rr' in 'perro'.", tagline: "Talk to 500M+ people" },
  French: { flag: "🇫🇷", greeting: "Bonjour !", tip: "Nasal vowels are key.", tagline: "Open doors in Europe & Africa" },
  German: { flag: "🇩🇪", greeting: "Hallo!", tip: "Master der/die/das.", tagline: "Top engineering economy" },
  Italian: { flag: "🇮🇹", greeting: "Ciao!", tip: "Double consonants matter.", tagline: "Art, food, opera" },
  Portuguese: { flag: "🇵🇹", greeting: "Olá!", tip: "Watch nasal 'ão' sounds.", tagline: "260M speakers worldwide" },
  Dutch: { flag: "🇳🇱", greeting: "Hallo!", tip: "The 'g' is throaty.", tagline: "Gateway to NL & BE" },
  Russian: { flag: "🇷🇺", greeting: "Привет!", tip: "Learn Cyrillic basics.", tagline: "258M speakers" },
  Polish: { flag: "🇵🇱", greeting: "Cześć!", tip: "Practice 'sz' vs 'cz'.", tagline: "Central Europe hub" },
  Turkish: { flag: "🇹🇷", greeting: "Merhaba!", tip: "Vowel harmony rules.", tagline: "Bridge of two continents" },
  Arabic: { flag: "🇸🇦", greeting: "مرحبا!", tip: "Learn right-to-left script.", tagline: "Speak in 25+ countries" },
  Hindi: { flag: "🇮🇳", greeting: "नमस्ते!", tip: "Devanagari is phonetic.", tagline: "600M+ speakers" },
  Bengali: { flag: "🇧🇩", greeting: "নমস্কার!", tip: "Soft consonant sounds.", tagline: "7th most-spoken language" },
  Urdu: { flag: "🇵🇰", greeting: "السلام علیکم!", tip: "Nastaliq script flows.", tagline: "Poetry & literature" },
  Tamil: { flag: "🇮🇳", greeting: "வணக்கம்!", tip: "Long vowels change meaning.", tagline: "Ancient classical language" },
  Telugu: { flag: "🇮🇳", greeting: "నమస్కారం!", tip: "Italian of the East.", tagline: "80M+ speakers" },
  Marathi: { flag: "🇮🇳", greeting: "नमस्कार!", tip: "Shares script with Hindi.", tagline: "Cultural capital language" },
  Punjabi: { flag: "🇮🇳", greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ!", tip: "Tones matter in Gurmukhi.", tagline: "Vibrant diaspora" },
  Japanese: { flag: "🇯🇵", greeting: "こんにちは!", tip: "Start with hiragana.", tagline: "Tech, anime, business" },
  Korean: { flag: "🇰🇷", greeting: "안녕하세요!", tip: "Hangul learns in a day.", tagline: "K-pop, K-drama, K-tech" },
  "Chinese (Mandarin)": { flag: "🇨🇳", greeting: "你好!", tip: "Four tones, big difference.", tagline: "1.1B+ speakers" },
  Vietnamese: { flag: "🇻🇳", greeting: "Xin chào!", tip: "Six tones to master.", tagline: "Fast-growing economy" },
  Thai: { flag: "🇹🇭", greeting: "สวัสดี!", tip: "Five tones, beautiful script.", tagline: "Land of smiles" },
  Indonesian: { flag: "🇮🇩", greeting: "Halo!", tip: "No tenses — relax!", tagline: "Easiest Asian language" },
  Swahili: { flag: "🇰🇪", greeting: "Habari!", tip: "Logical noun classes.", tagline: "Lingua franca of E. Africa" },
  Greek: { flag: "🇬🇷", greeting: "Γεια σας!", tip: "Stress changes meaning.", tagline: "Root of Western thought" },
  Hebrew: { flag: "🇮🇱", greeting: "שלום!", tip: "Right-to-left, no vowels.", tagline: "3,000 years of history" },
  Czech: { flag: "🇨🇿", greeting: "Ahoj!", tip: "Watch the 'ř' sound.", tagline: "Heart of Europe" },
  Swedish: { flag: "🇸🇪", greeting: "Hej!", tip: "Pitch accent is musical.", tagline: "Gateway to Scandinavia" },
  Norwegian: { flag: "🇳🇴", greeting: "Hei!", tip: "Two written forms exist.", tagline: "Easiest Nordic language" },
  Danish: { flag: "🇩🇰", greeting: "Hej!", tip: "Soft 'd' sounds tricky.", tagline: "Hygge lifestyle" },
  Finnish: { flag: "🇫🇮", greeting: "Hei!", tip: "15 grammatical cases!", tagline: "Unique & beautiful" },
  Hungarian: { flag: "🇭🇺", greeting: "Szia!", tip: "Vowel harmony rules.", tagline: "Distinct from neighbors" },
  Romanian: { flag: "🇷🇴", greeting: "Bună!", tip: "Closest to Latin today.", tagline: "Romance in the East" },
  Ukrainian: { flag: "🇺🇦", greeting: "Привіт!", tip: "Melodic Slavic tongue.", tagline: "40M+ speakers" },
};

function langInfo(lang: string) {
  return LANG_INFO[lang] ?? { flag: "🌍", greeting: "Hello!", tip: "Start with everyday phrases.", tagline: "A new world awaits" };
}

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Lingvo" }] }),
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

  const info = langInfo(profile.learning_lang);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="text-6xl md:text-7xl leading-none">{info.flag}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">{info.tagline}</p>
            <h1 className="text-2xl md:text-4xl font-bold mt-1">{info.greeting} {profile.display_name ?? ""}</h1>
            <p className="text-muted-foreground mt-1">Your <span className="font-medium text-foreground">{profile.learning_lang}</span> journey · Level {profile.level}</p>
            <p className="mt-3 text-sm bg-accent/30 inline-block px-3 py-1 rounded-full">💡 {info.tip}</p>
          </div>
        </div>
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
        <h2 className="font-semibold text-lg mb-3">Main course</h2>
        <Tile
          to="/app/learn/lessons"
          title={`${profile.level} structured lessons`}
          desc="Start here. Learn the level step-by-step, then take an exam to unlock the next lesson."
          icon={<GraduationCap />}
          accent
        />
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-3">Practice with Lingvo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Tile to="/app/learn/text" title="Text chat" desc="Type with your tutor. Get corrections and translations." icon={<MessageSquare />} />
          <Tile to="/app/learn/voice" title="Voice practice" desc="Speak a phrase and hear Lingvo's reply." icon={<Mic />} />
          <Tile to="/app/learn/voice-call" title="Voice call" desc="Hands-free conversation with auto turns." icon={<Phone />} />
          <Tile to="/app/learn/video-call" title="Video avatar" desc="Talk to an animated Lingvo that lip-syncs." icon={<Video />} />
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