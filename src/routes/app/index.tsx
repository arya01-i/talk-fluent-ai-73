import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mic, Phone, Video, BookOpen, ListChecks, Flame, Trophy, GraduationCap, Sparkles, Dice5, Music, Zap } from "lucide-react";
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
  const nav = useNavigate();
  const [stats, setStats] = useState({ vocab: 0, quizzes: 0 });

  useEffect(() => {
    if (!profile) return;
    if (!localStorage.getItem(`lingvo_onboarded_${profile.id}`)) {
      nav({ to: "/app/onboarding" });
    }
  }, [profile, nav]);

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
        {/* Floating cartoon mascots */}
        <div className="pointer-events-none absolute -top-4 -right-2 text-5xl md:text-6xl rotate-12 opacity-90 animate-bounce" style={{ animationDuration: "3s" }}>🦊</div>
        <div className="pointer-events-none absolute bottom-2 right-10 text-3xl md:text-4xl -rotate-6 animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" }}>🎈</div>
        <div className="pointer-events-none absolute top-6 right-24 text-2xl animate-pulse">✨</div>
        <div className="flex items-start gap-4 relative">
          <div className="text-6xl md:text-7xl leading-none drop-shadow-lg">{info.flag}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">{info.tagline}</p>
            <h1 className="text-2xl md:text-4xl font-bold mt-1">{info.greeting} {profile.display_name ?? ""}</h1>
            <p className="text-muted-foreground mt-1">Your <span className="font-medium text-foreground">{profile.learning_lang}</span> journey · Level {profile.level}</p>
            <p className="mt-3 text-sm bg-accent/30 inline-block px-3 py-1 rounded-full">💡 {info.tip}</p>
          </div>
        </div>
      </div>

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

      <FunActivities lang={profile.learning_lang} />

      <MascotBuddies />

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

const PHRASES: Record<string, { phrase: string; meaning: string }[]> = {
  English: [
    { phrase: "Break a leg!", meaning: "Good luck!" },
    { phrase: "Piece of cake", meaning: "Very easy" },
    { phrase: "Hit the books", meaning: "Study hard" },
  ],
  Spanish: [
    { phrase: "¡Buena suerte!", meaning: "Good luck!" },
    { phrase: "Estar en las nubes", meaning: "To daydream" },
    { phrase: "Tomar el pelo", meaning: "To tease someone" },
  ],
  French: [
    { phrase: "C'est la vie", meaning: "That's life" },
    { phrase: "Avoir le cafard", meaning: "To feel blue" },
    { phrase: "Coûter les yeux de la tête", meaning: "To cost a fortune" },
  ],
  German: [
    { phrase: "Ich verstehe nur Bahnhof", meaning: "I don't understand a word" },
    { phrase: "Tomaten auf den Augen haben", meaning: "To be oblivious" },
    { phrase: "Das ist mir Wurst", meaning: "I don't care" },
  ],
  Italian: [
    { phrase: "In bocca al lupo!", meaning: "Good luck!" },
    { phrase: "Avere le braccine corte", meaning: "To be stingy" },
  ],
  Hindi: [
    { phrase: "दिल से", meaning: "From the heart" },
    { phrase: "बहुत अच्छा", meaning: "Very good" },
  ],
  Japanese: [
    { phrase: "頑張って!", meaning: "Do your best!" },
    { phrase: "お疲れ様", meaning: "Thanks for your hard work" },
  ],
  Korean: [
    { phrase: "화이팅!", meaning: "You can do it!" },
    { phrase: "잘 부탁드립니다", meaning: "Please take care of me" },
  ],
};

const CHALLENGES = [
  { icon: "🎯", title: "60-second talk", desc: "Speak for 1 minute on today's topic.", to: "/app/learn/voice-call" },
  { icon: "🎭", title: "Roleplay café", desc: "Order coffee in your target language.", to: "/app/learn/text" },
  { icon: "🎬", title: "Describe a scene", desc: "Describe what you did today in 5 sentences.", to: "/app/learn/text" },
  { icon: "🎤", title: "Karaoke phrase", desc: "Repeat a phrase 3 times — match the rhythm.", to: "/app/learn/voice" },
  { icon: "🧠", title: "Memory match", desc: "Take a quick 5-question quiz.", to: "/app/quizzes" },
  { icon: "📸", title: "What's around me?", desc: "Name 5 things you see in your room.", to: "/app/learn/text" },
];

function FunActivities({ lang }: { lang: string }) {
  const phrases = PHRASES[lang] ?? [{ phrase: "Hello!", meaning: "A friendly greeting" }];
  const [pIdx, setPIdx] = useState(() => Math.floor(Math.random() * phrases.length));
  const [cIdx, setCIdx] = useState(() => Math.floor(Math.random() * CHALLENGES.length));
  const phrase = phrases[pIdx % phrases.length];
  const challenge = CHALLENGES[cIdx % CHALLENGES.length];

  return (
    <div>
      <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" /> Fun activities
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wide">
            <Music className="size-3.5" /> Phrase of the moment
          </div>
          <div className="mt-2 text-2xl font-bold">{phrase.phrase}</div>
          <div className="text-sm text-muted-foreground mt-1">{phrase.meaning}</div>
          <Button size="sm" variant="outline" className="mt-3"
            onClick={() => setPIdx((i) => (i + 1) % phrases.length)}>
            <Dice5 className="size-3.5 mr-1" /> Another one
          </Button>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wide">
            <Zap className="size-3.5" /> Today's challenge
          </div>
          <div className="mt-2 text-2xl font-bold">{challenge.icon} {challenge.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{challenge.desc}</div>
          <div className="mt-3 flex gap-2">
            <Link to={challenge.to as never}>
              <Button size="sm">Start now</Button>
            </Link>
            <Button size="sm" variant="outline"
              onClick={() => setCIdx((i) => (i + 1) % CHALLENGES.length)}>
              <Dice5 className="size-3.5 mr-1" /> Spin
            </Button>
          </div>
        </Card>
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

const BUDDIES = [
  { emoji: "🦊", name: "Foxy", line: "Let's practice 5 new words today!", color: "from-orange-500/20 to-amber-500/10", to: "/app/vocabulary" },
  { emoji: "🐼", name: "Pan", line: "Slow down — repeat after me.", color: "from-emerald-500/20 to-teal-500/10", to: "/app/learn/text" },
  { emoji: "🦉", name: "Hoot", line: "Grammar tip of the day awaits.", color: "from-indigo-500/20 to-purple-500/10", to: "/app/quizzes" },
  { emoji: "🐧", name: "Pip", line: "Quiz me! I love a challenge.", color: "from-sky-500/20 to-blue-500/10", to: "/app/learn/voice-call" },
];

function MascotBuddies() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Meet your study buddies
        </h2>
        <Link to="/app/activities" className="text-xs text-primary font-semibold hover:underline">See all →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BUDDIES.map((b) => (
          <Link key={b.name} to={b.to as never} className="block">
            <Card className={`p-4 bg-gradient-to-br ${b.color} border-primary/10 hover:scale-[1.03] hover:shadow-lg transition-all cursor-pointer h-full`}>
              <div className="text-5xl text-center animate-bounce" style={{ animationDuration: "2.5s" }}>{b.emoji}</div>
              <div className="mt-2 text-center font-bold">{b.name}</div>
              <div className="text-xs text-center text-muted-foreground mt-1">"{b.line}"</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
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