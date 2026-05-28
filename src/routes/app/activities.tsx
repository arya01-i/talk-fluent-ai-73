import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/activities")({
  head: () => ({ meta: [{ title: "Fun activities — Lingvo" }] }),
  component: ActivitiesPage,
});

const ACTIVITIES = [
  { emoji: "🦊", name: "Foxy's Word Hunt", desc: "Learn 5 new words with vocabulary flashcards.", to: "/app/vocabulary", color: "from-orange-500/20 to-amber-500/10" },
  { emoji: "🐼", name: "Pan's Slow Chat", desc: "Type calmly with your AI tutor — get gentle corrections.", to: "/app/learn/text", color: "from-emerald-500/20 to-teal-500/10" },
  { emoji: "🦉", name: "Hoot's Grammar Quiz", desc: "Test what you know with a quick quiz.", to: "/app/quizzes", color: "from-indigo-500/20 to-purple-500/10" },
  { emoji: "🐧", name: "Pip's Voice Call", desc: "Hands-free conversation with auto turns.", to: "/app/learn/voice-call", color: "from-sky-500/20 to-blue-500/10" },
  { emoji: "🦁", name: "Leo's Roleplay", desc: "Order coffee, book a hotel, or chit-chat in character.", to: "/app/learn/text", color: "from-yellow-500/20 to-orange-500/10" },
  { emoji: "🐨", name: "Coco's Karaoke", desc: "Repeat a phrase 3 times — match the rhythm.", to: "/app/learn/voice", color: "from-stone-500/20 to-amber-500/10" },
  { emoji: "🦄", name: "Luna's Video Avatar", desc: "Talk face-to-face with your animated tutor.", to: "/app/learn/video-call", color: "from-pink-500/20 to-purple-500/10" },
  { emoji: "🐯", name: "Tigger's Lesson", desc: "Jump into a structured lesson at your level.", to: "/app/learn/lessons", color: "from-orange-500/20 to-red-500/10" },
];

function ActivitiesPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-primary" /> Fun activities
        </h1>
        <p className="text-muted-foreground mt-2">Pick a buddy and start practicing — every activity is a real working feature.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIVITIES.map((a) => (
          <Link key={a.name} to={a.to as never} className="block">
            <Card className={`p-5 h-full bg-gradient-to-br ${a.color} border-primary/10 hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer`}>
              <div className="text-6xl animate-bounce" style={{ animationDuration: "2.5s" }}>{a.emoji}</div>
              <div className="mt-3 text-lg font-bold">{a.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
              <div className="mt-3 text-xs text-primary font-semibold">Start →</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}