import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, CEFR_LEVELS } from "@/lib/languages";
import { MessageSquare, Mic, Phone, Video, BookOpen, Sparkles } from "lucide-react";

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
  const [native, setNative] = useState("English");
  const [target, setTarget] = useState("Spanish");
  const [level, setLevel] = useState<string>("A1");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const start = () => {
    sessionStorage.setItem("pending_prefs", JSON.stringify({ native, target, level }));
    navigate({ to: "/signup" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Sparkles className="size-5 text-primary" /> Lingvo
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/signup">Sign up</Link></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Speak a new language — with <span className="text-primary">Lingvo</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md">
              Your AI tutor for text chat, voice calls, and a friendly video avatar. Vocabulary, quizzes, and lessons from A1 to C2.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <Feature icon={<MessageSquare className="size-4" />}>Text chat</Feature>
              <Feature icon={<Mic className="size-4" />}>Voice practice</Feature>
              <Feature icon={<Phone className="size-4" />}>Voice call</Feature>
              <Feature icon={<Video className="size-4" />}>Video avatar</Feature>
              <Feature icon={<BookOpen className="size-4" />}>Vocabulary & quizzes</Feature>
            </div>
          </div>

          <Card className="p-6 shadow-xl">
            <h2 className="font-semibold text-lg mb-4">Get started</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">My language</label>
                <Select value={native} onValueChange={setNative}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">I want to learn</label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.filter((l) => l !== native).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">My level</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full mt-2" size="lg" onClick={start}>Start learning</Button>
              <p className="text-xs text-muted-foreground text-center">Already have an account? <Link to="/login" className="text-primary underline">Log in</Link></p>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">{icon}{children}</span>
  );
}
