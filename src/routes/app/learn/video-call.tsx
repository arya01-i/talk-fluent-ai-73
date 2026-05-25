import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTutor } from "@/components/chat-engine";
import { Button } from "@/components/ui/button";
import { Video, PhoneOff } from "lucide-react";
import { createRecognizer, speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/app/learn/video-call")({
  head: () => ({ meta: [{ title: "Video avatar — Lingvo" }] }),
  component: VideoCallPage,
});

function VideoCallPage() {
  const { send, profile, messages } = useTutor("video_call");
  const [active, setActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
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
        setStatus("Lingvo is speaking…"); setSpeaking(true);
        speak(reply, profile.learning_lang, () => { setSpeaking(false); if (activeRef.current) loop(); });
      } else { loop(); }
    };
    r.onerror = () => { if (activeRef.current) loop(); };
    try { r.start(); } catch {}
  };

  const start = () => {
    if (!speechSupported()) { toast.error("Speech not supported. Try Chrome."); return; }
    activeRef.current = true; setActive(true); loop();
  };
  const end = () => {
    activeRef.current = false; setActive(false); setSpeaking(false); setStatus("Ended");
    try { recRef.current?.stop?.(); } catch {} stopSpeaking();
  };
  useEffect(() => () => end(), []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="font-semibold text-2xl mb-1 text-center">Video call with Lingvo</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center">An animated tutor that lip-syncs while she speaks.</p>
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6">
        <Avatar speaking={speaking} active={active} />
      </div>
      <div className="text-center text-sm text-muted-foreground mb-4">{active ? status : "Tap to start"}</div>
      <div className="flex justify-center">
        {!active ? (
          <Button size="lg" onClick={start}><Video className="mr-2 size-4" />Start video call</Button>
        ) : (
          <Button size="lg" variant="destructive" onClick={end}><PhoneOff className="mr-2 size-4" />End call</Button>
        )}
      </div>
      <div className="mt-6 text-center text-xs text-muted-foreground">Turns: {messages.length}</div>
    </div>
  );
}

function Avatar({ speaking, active }: { speaking: boolean; active: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-56 h-56">
      <circle cx="100" cy="100" r="90" fill="oklch(0.94 0.04 80)" />
      <circle cx="100" cy="95" r="70" fill="oklch(0.85 0.08 50)" />
      <circle cx="80" cy="85" r="6" fill="#222">
        <animate attributeName="r" values="6;1;6" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="120" cy="85" r="6" fill="#222">
        <animate attributeName="r" values="6;1;6" dur="4s" repeatCount="indefinite" />
      </circle>
      <ellipse cx="100" cy="125" rx={speaking ? 18 : 14} ry={speaking ? 10 : 3} fill="#7a2a2a">
        {speaking && <animate attributeName="ry" values="3;10;5;9;3" dur="0.6s" repeatCount="indefinite" />}
      </ellipse>
      {active && !speaking && <circle cx="100" cy="100" r="95" fill="none" stroke="oklch(0.65 0.18 35)" strokeWidth="3" opacity="0.4"><animate attributeName="r" values="92;100;92" dur="2s" repeatCount="indefinite" /></circle>}
    </svg>
  );
}