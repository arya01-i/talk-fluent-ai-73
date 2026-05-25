import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTutor } from "@/components/chat-engine";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { createRecognizer, speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/learn/voice-call")({
  head: () => ({ meta: [{ title: "Voice call — Lingvo" }] }),
  component: VoiceCallPage,
});

function VoiceCallPage() {
  const { send, busy, profile, messages } = useTutor("voice_call");
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Idle");
  const recRef = useRef<any>(null);
  const activeRef = useRef(false);

  const loop = () => {
    if (!activeRef.current || !profile) return;
    const r = createRecognizer(profile.learning_lang);
    if (!r) return;
    recRef.current = r;
    setStatus("Listening…");
    r.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setStatus("Thinking…");
      const reply = await send(text);
      if (!activeRef.current) return;
      if (reply) {
        setStatus("Lingvo is speaking…");
        speak(reply, profile.learning_lang, () => { if (activeRef.current) loop(); });
      } else { loop(); }
    };
    r.onerror = () => { if (activeRef.current) loop(); };
    r.onend = () => {};
    try { r.start(); } catch {}
  };

  const start = () => {
    if (!speechSupported()) { toast.error("Speech not supported. Try Chrome."); return; }
    activeRef.current = true; setActive(true); loop();
  };
  const end = () => {
    activeRef.current = false; setActive(false); setStatus("Ended");
    try { recRef.current?.stop?.(); } catch {} stopSpeaking();
  };
  useEffect(() => () => end(), []);

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center text-center">
      <h1 className="font-semibold text-2xl mb-1">Voice call with Lingvo</h1>
      <p className="text-sm text-muted-foreground mb-8">Hands-free. Lingvo listens, replies, then listens again.</p>
      <div className={`size-40 rounded-full mb-6 flex items-center justify-center text-4xl font-bold transition ${active ? "bg-primary text-primary-foreground animate-pulse" : "bg-secondary"}`}>A</div>
      <div className="text-sm text-muted-foreground mb-6">{active ? status : "Tap to call"}</div>
      {!active ? (
        <Button size="lg" onClick={start} disabled={busy}><Phone className="mr-2 size-4" />Start call</Button>
      ) : (
        <Button size="lg" variant="destructive" onClick={end}><PhoneOff className="mr-2 size-4" />End call</Button>
      )}
      <div className="mt-8 text-xs text-muted-foreground">Turns: {messages.length}</div>
    </div>
  );
}