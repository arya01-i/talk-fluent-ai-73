import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageList, useTutor } from "@/components/chat-engine";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { createRecognizer, hasSpeakableContent, speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/learn/voice")({
  head: () => ({ meta: [{ title: "Voice practice — Lingvo" }] }),
  component: VoicePage,
});

function VoicePage() {
  const { messages, send, busy, profile } = useTutor("voice");
  const [listening, setListening] = useState(false);

  const start = () => {
    if (!profile) return;
    if (!speechSupported()) { toast.error("Speech not supported in this browser. Try Chrome."); return; }
    const r = createRecognizer(profile.learning_lang);
    if (!r) return;
    setListening(true);
    r.onresult = async (e: any) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? "";
      setListening(false);
      if (!text) return;
      const reply = await send(text);
      if (reply && hasSpeakableContent(reply)) speak(reply, profile.learning_lang);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="px-4 pt-4 pb-2 border-b">
        <h1 className="font-semibold text-lg">Voice practice</h1>
        <p className="text-xs text-muted-foreground">Tap the mic, speak a phrase, Lingvo replies aloud.</p>
      </div>
      <MessageList messages={messages} busy={busy} />
      <div className="border-t p-4 flex items-center justify-center gap-3 bg-card">
        <Button size="lg" onClick={start} disabled={busy || listening}>
          {listening ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
          {listening ? "Listening…" : "Speak"}
        </Button>
        <Button variant="outline" size="lg" onClick={stopSpeaking}><Volume2 className="mr-2 size-4" /> Stop audio</Button>
      </div>
    </div>
  );
}