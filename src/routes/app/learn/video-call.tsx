import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTutor } from "@/components/chat-engine";
import { Button } from "@/components/ui/button";
import { Video, PhoneOff, VideoOff, User, UserRound } from "lucide-react";
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
  const [camOn, setCamOn] = useState(true);
  const [gender, setGender] = useState<"female" | "male">(() => {
    if (typeof window === "undefined") return "female";
    return (localStorage.getItem("lingvo-avatar") as "female" | "male") || "female";
  });
  const recRef = useRef<any>(null);
  const activeRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      setCamOn(true);
    } catch {
      setCamOn(false);
      toast.error("Could not access camera. You can still continue without video.");
    }
  };
  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };

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
    activeRef.current = true; setActive(true); startCam(); loop();
  };
  const end = () => {
    activeRef.current = false; setActive(false); setSpeaking(false); setStatus("Ended");
    try { recRef.current?.stop?.(); } catch {} stopSpeaking(); stopCam();
  };
  useEffect(() => () => { end(); }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="font-semibold text-2xl mb-1 text-center">Video call with Lingvo</h1>
      <p className="text-sm text-muted-foreground mb-4 text-center">An animated tutor that lip-syncs while talking.</p>
      <div className="flex justify-center gap-2 mb-4">
        <Button size="sm" variant={gender === "female" ? "default" : "outline"}
          onClick={() => { setGender("female"); localStorage.setItem("lingvo-avatar", "female"); }}>
          <UserRound className="mr-1 size-4" /> Female tutor
        </Button>
        <Button size="sm" variant={gender === "male" ? "default" : "outline"}
          onClick={() => { setGender("male"); localStorage.setItem("lingvo-avatar", "male"); }}>
          <User className="mr-1 size-4" /> Male tutor
        </Button>
      </div>
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
        <Avatar speaking={speaking} active={active} gender={gender} />
        <div className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-background shadow-lg bg-black flex items-center justify-center">
          <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${camOn ? "" : "hidden"}`} />
          {!camOn && <VideoOff className="size-6 text-white/60" />}
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground mb-4">{active ? status : "Tap to start"}</div>
      <div className="flex justify-center gap-2">
        {!active ? (
          <Button size="lg" onClick={start}><Video className="mr-2 size-4" />Start video call</Button>
        ) : (
          <>
            <Button size="lg" variant="outline" onClick={() => camOn ? stopCam() : startCam()}>
              {camOn ? <VideoOff className="mr-2 size-4" /> : <Video className="mr-2 size-4" />}
              {camOn ? "Camera off" : "Camera on"}
            </Button>
            <Button size="lg" variant="destructive" onClick={end}><PhoneOff className="mr-2 size-4" />End call</Button>
          </>
        )}
      </div>
      <div className="mt-6 text-center text-xs text-muted-foreground">Turns: {messages.length}</div>
    </div>
  );
}

function Avatar({ speaking, active, gender }: { speaking: boolean; active: boolean; gender: "female" | "male" }) {
  const skin = "#f1c9a5";
  const skinShade = "#d9a37f";
  const hair = gender === "female" ? "#3a2418" : "#1f1410";
  const lip = "#a14a4a";
  return (
    <svg viewBox="0 0 220 240" className="w-64 h-64 drop-shadow-xl">
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="oklch(0.96 0.04 80)" />
          <stop offset="100%" stopColor="oklch(0.85 0.06 60)" />
        </radialGradient>
        <linearGradient id="neck" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </linearGradient>
      </defs>
      <rect width="220" height="240" fill="url(#bg)" rx="20" />
      {/* shoulders / shirt */}
      <path d="M30 240 Q110 170 190 240 Z" fill={gender === "female" ? "#b35a4a" : "#2c3e60"} />
      {/* neck */}
      <rect x="92" y="160" width="36" height="34" rx="10" fill="url(#neck)" />
      {/* hair back */}
      {gender === "female" ? (
        <path d="M50 120 Q55 50 110 40 Q170 50 175 130 Q175 175 155 185 L150 130 Q110 110 70 130 L65 185 Q45 170 50 120 Z" fill={hair} />
      ) : (
        <path d="M60 110 Q65 55 110 50 Q160 55 165 115 L160 130 Q150 100 110 96 Q72 100 65 130 Z" fill={hair} />
      )}
      {/* face */}
      <ellipse cx="110" cy="120" rx="48" ry="58" fill={skin} />
      {/* cheeks */}
      <ellipse cx="82" cy="138" rx="8" ry="5" fill="#e8a890" opacity="0.6" />
      <ellipse cx="138" cy="138" rx="8" ry="5" fill="#e8a890" opacity="0.6" />
      {/* eyebrows */}
      <path d="M76 104 Q90 98 100 104" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M120 104 Q130 98 144 104" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <g>
        <ellipse cx="88" cy="118" rx="7" ry="4.5" fill="white" />
        <circle cx="88" cy="118" r="3.2" fill="#2a3a5a">
          <animate attributeName="ry" values="3.2;0.2;3.2" dur="5s" repeatCount="indefinite" />
        </circle>
        <ellipse cx="132" cy="118" rx="7" ry="4.5" fill="white" />
        <circle cx="132" cy="118" r="3.2" fill="#2a3a5a">
          <animate attributeName="ry" values="3.2;0.2;3.2" dur="5s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* nose */}
      <path d="M110 122 Q106 142 110 148 Q114 148 114 144" stroke={skinShade} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* mouth */}
      <g transform="translate(110 160)">
        <ellipse cx="0" cy="0" rx={speaking ? 14 : 11} ry={speaking ? 7 : 2.2} fill={lip}>
          {speaking && <animate attributeName="ry" values="2;7;3;6;2" dur="0.55s" repeatCount="indefinite" />}
          {speaking && <animate attributeName="rx" values="11;14;12;14;11" dur="0.55s" repeatCount="indefinite" />}
        </ellipse>
        {speaking && <ellipse cx="0" cy="1" rx="6" ry="2" fill="#5a1f1f" opacity="0.6" />}
      </g>
      {/* female: front hair fringe */}
      {gender === "female" && (
        <path d="M65 95 Q90 70 110 80 Q135 70 158 100 Q140 92 120 100 Q100 92 80 102 Z" fill={hair} />
      )}
      {/* earrings for female */}
      {gender === "female" && (
        <>
          <circle cx="62" cy="138" r="3" fill="oklch(0.85 0.15 85)" />
          <circle cx="158" cy="138" r="3" fill="oklch(0.85 0.15 85)" />
        </>
      )}
      {active && !speaking && (
        <circle cx="110" cy="120" r="95" fill="none" stroke="oklch(0.65 0.18 35)" strokeWidth="2" opacity="0.35">
          <animate attributeName="r" values="92;104;92" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}