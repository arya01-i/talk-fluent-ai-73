import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, Mic, Sparkles, TrendingUp, Trophy, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingvo — Learn any language with an AI tutor" },
      { name: "description", content: "Practice speaking, listening, vocabulary and quizzes with Lingvo, your CEFR A1–C2 AI language tutor." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-hero-radial text-foreground overflow-hidden">
      <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto relative z-10">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Brain className="size-5 text-white" />
          </span>
          Lingvo
        </Link>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" asChild><Link to="/login">Sign In</Link></Button>
          <Button asChild className="bg-brand-gradient text-white border-0 hover:opacity-90">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Floating language flags — subtle ambient delight */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        {["🇪🇸","🇫🇷","🇯🇵","🇩🇪","🇮🇹","🇨🇳","🇰🇷","🇮🇳"].map((f, i) => (
          <span
            key={i}
            className="absolute text-4xl animate-float-slow"
            style={{
              top: `${10 + (i * 11) % 80}%`,
              left: `${5 + (i * 23) % 90}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >{f}</span>
        ))}
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/40 backdrop-blur text-xs text-muted-foreground mb-8">
          <Sparkles className="size-3.5 text-accent" /> Powered by adaptive AI tutoring
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Learn Languages with <br />
          <span className="text-brand-gradient">AI-Powered Tutoring</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Master any language through real conversations, speaking practice, and adaptive learning paths. Experience the future of language education.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild className="bg-brand-gradient text-white border-0 hover:opacity-90 text-base h-12 px-6">
            <Link to="/signup">Start Learning Free <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base h-12 px-6 bg-card/40 backdrop-blur">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>

        {/* Hero showcase card */}
        <div className="mt-16 rounded-2xl border border-border bg-card/60 backdrop-blur p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gradient opacity-[0.06]" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="size-20 rounded-2xl bg-brand-gradient flex items-center justify-center animate-pulse-glow">
              <Brain className="size-10 text-white" />
            </div>
            <p className="text-muted-foreground">Your AI tutor is ready when you are.</p>
          </div>
        </div>

        {/* Features */}
        <section className="mt-24">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features for Effective Learning</h2>
          <p className="text-muted-foreground mt-3">Everything you need to become fluent in your target language</p>
          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            <FeatureCard icon={<Brain />} title="AI-Powered Tutor" desc="Learn from an intelligent AI tutor that adapts to your pace" />
            <FeatureCard icon={<Mic />} title="Speaking Practice" desc="Perfect your pronunciation with real-time voice feedback" />
            <FeatureCard icon={<Zap />} title="Adaptive Learning" desc="Personalized lessons that adjust to your level automatically" />
            <FeatureCard icon={<Trophy />} title="Gamification" desc="Earn XP, unlock achievements, and maintain your streak" />
            <FeatureCard icon={<TrendingUp />} title="Progress Tracking" desc="Detailed analytics showing your improvement over time" />
            <FeatureCard icon={<MessageSquare />} title="Conversation Mode" desc="Practice real-world scenarios like travel and business" />
          </div>
        </section>

        {/* Stats */}
        <section className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { v: "35+", l: "Languages" },
            { v: "A1–C2", l: "All levels" },
            { v: "24/7", l: "AI Tutor" },
            { v: "∞", l: "Practice" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/40 backdrop-blur p-6">
              <div className="text-3xl md:text-4xl font-bold text-brand-gradient">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-20 rounded-2xl bg-brand-gradient p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Learning?</h2>
          <p className="text-white/85 mt-3">Join learners using Lingvo to master new languages.</p>
          <Button size="lg" asChild className="mt-6 bg-white text-primary hover:bg-white/90 h-12 px-6">
            <Link to="/signup">Get Started Free <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/50 transition">
      <div className="size-11 rounded-lg bg-brand-gradient flex items-center justify-center text-white mb-4">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}
