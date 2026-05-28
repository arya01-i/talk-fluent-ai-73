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
        speak(
          reply,
          profile.learning_lang,
          () => { setSpeaking(false); if (activeRef.current) loop(); },
          gender,
        );
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
  const skinLight = "#fbd9b8";
  const skin = "#f0c19a";
  const skinShade = "#c98e6a";
  const skinDeep = "#8b5a3c";
  const hair = gender === "female" ? "#2a1610" : "#15100c";
  const hairHi = gender === "female" ? "#5a3022" : "#2a1c14";
  const lip = gender === "female" ? "#b85265" : "#9b5145";
  const lipShade = gender === "female" ? "#7a2838" : "#5a2a22";
  const eyeColor = "#3d2817";
  const id = gender; // suffix to avoid SVG id collisions on re-render
  return (
    <svg viewBox="0 0 240 260" className="w-72 h-72 drop-shadow-2xl">
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffe9d2" />
          <stop offset="60%" stopColor="#f4c8a0" />
          <stop offset="100%" stopColor="#a86b4a" />
        </radialGradient>
        <radialGradient id={`face-${id}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="70%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </radialGradient>
        <linearGradient id={`neck-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={skinShade} />
          <stop offset="100%" stopColor={skinDeep} />
        </linearGradient>
        <radialGradient id={`iris-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b4226" />
          <stop offset="70%" stopColor={eyeColor} />
          <stop offset="100%" stopColor="#1a0e07" />
        </radialGradient>
        <linearGradient id={`hair-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={hairHi} />
          <stop offset="100%" stopColor={hair} />
        </linearGradient>
        <linearGradient id={`shirt-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={gender === "female" ? "#c2546a" : "#2f4a7a"} />
          <stop offset="100%" stopColor={gender === "female" ? "#7d2a3c" : "#16243f"} />
        </linearGradient>
      </defs>

      <rect width="240" height="260" fill={`url(#bg-${id})`} rx="24" />

      {/* shoulders */}
      <path d="M20 260 Q120 175 220 260 Z" fill={`url(#shirt-${id})`} />
      <path d="M90 200 Q120 210 150 200 L155 230 Q120 240 85 230 Z" fill="rgba(255,255,255,0.08)" />

      {/* neck with shadow */}
      <path d="M100 170 L100 200 Q120 212 140 200 L140 170 Z" fill={`url(#neck-${id})`} />
      <ellipse cx="120" cy="178" rx="22" ry="5" fill={skinDeep} opacity="0.35" />

      {/* hair back */}
      {gender === "female" ? (
        <path d="M48 130 Q40 50 120 38 Q200 50 192 140 Q195 200 168 210 L162 140 Q120 118 78 140 L72 210 Q45 200 48 130 Z" fill={`url(#hair-${id})`} />
      ) : (
        <path d="M58 120 Q60 55 120 48 Q180 55 182 122 L176 140 Q160 108 120 102 Q78 108 64 140 Z" fill={`url(#hair-${id})`} />
      )}

      {/* face */}
      <ellipse cx="120" cy="128" rx="52" ry="64" fill={`url(#face-${id})`} />
      {/* jaw shading */}
      <path d="M72 138 Q78 188 120 198 Q162 188 168 138 Q160 178 120 188 Q80 178 72 138 Z" fill={skinShade} opacity="0.35" />
      {/* forehead highlight */}
      <ellipse cx="120" cy="92" rx="32" ry="14" fill="#fff2e0" opacity="0.35" />

      {/* cheekbone blush */}
      <ellipse cx="86" cy="148" rx="11" ry="6" fill="#e88a82" opacity="0.45" />
      <ellipse cx="154" cy="148" rx="11" ry="6" fill="#e88a82" opacity="0.45" />

      {/* eyebrows */}
      {gender === "female" ? (
        <>
          <path d="M78 108 Q94 100 108 106" stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M132 106 Q146 100 162 108" stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M76 108 Q94 100 110 108" stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M130 108 Q146 100 164 108" stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* eyes */}
      <g>
        {/* left */}
        <ellipse cx="94" cy="124" rx="9" ry="5.5" fill="#fff" />
        <ellipse cx="94" cy="124" rx="9" ry="5.5" fill="none" stroke={skinDeep} strokeWidth="0.8" />
        <circle cx="94" cy="124" r="4.5" fill={`url(#iris-${id})`}>
          <animate attributeName="r" values="4.5;0.4;4.5" keyTimes="0;0.5;1" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="95.5" cy="122.5" r="1.4" fill="#fff" />
        {/* upper lash */}
        <path d="M85 122 Q94 117 103 122" stroke={hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* right */}
        <ellipse cx="146" cy="124" rx="9" ry="5.5" fill="#fff" />
        <ellipse cx="146" cy="124" rx="9" ry="5.5" fill="none" stroke={skinDeep} strokeWidth="0.8" />
        <circle cx="146" cy="124" r="4.5" fill={`url(#iris-${id})`}>
          <animate attributeName="r" values="4.5;0.4;4.5" keyTimes="0;0.5;1" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="147.5" cy="122.5" r="1.4" fill="#fff" />
        <path d="M137 122 Q146 117 155 122" stroke={hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>

      {/* nose with subtle shading */}
      <path d="M120 130 Q114 152 118 160 Q120 162 122 160 Q126 152 120 130" fill={skinShade} opacity="0.25" />
      <path d="M115 158 Q120 162 125 158" stroke={skinShade} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="117" cy="159" rx="1.6" ry="1" fill={skinDeep} opacity="0.5" />
      <ellipse cx="123" cy="159" rx="1.6" ry="1" fill={skinDeep} opacity="0.5" />

      {/* mouth */}
      <g transform="translate(120 174)">
        {/* upper lip */}
        <path
          d={`M-14 0 Q-7 -4 0 -2 Q7 -4 14 0 Q7 ${speaking ? 6 : 2} 0 ${speaking ? 6 : 2} Q-7 ${speaking ? 6 : 2} -14 0 Z`}
          fill={lip}
        >
          {speaking && (
            <animate
              attributeName="d"
              values={`M-14 0 Q-7 -4 0 -2 Q7 -4 14 0 Q7 2 0 2 Q-7 2 -14 0 Z;M-14 0 Q-7 -6 0 -3 Q7 -6 14 0 Q7 9 0 9 Q-7 9 -14 0 Z;M-14 0 Q-7 -4 0 -2 Q7 -4 14 0 Q7 4 0 4 Q-7 4 -14 0 Z;M-14 0 Q-7 -7 0 -3 Q7 -7 14 0 Q7 10 0 10 Q-7 10 -14 0 Z;M-14 0 Q-7 -4 0 -2 Q7 -4 14 0 Q7 2 0 2 Q-7 2 -14 0 Z`}
              dur="0.6s"
              repeatCount="indefinite"
            />
          )}
        </path>
        {speaking && <ellipse cx="0" cy="2" rx="7" ry="3" fill={lipShade} />}
        {/* cupid's bow highlight */}
        <path d="M-3 -2 Q0 -1 3 -2" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.5" />
      </g>

      {/* female: front fringe */}
      {gender === "female" && (
        <path d="M62 102 Q92 70 120 86 Q150 70 178 108 Q156 98 132 106 Q120 100 108 106 Q84 98 62 102 Z" fill={`url(#hair-${id})`} />
      )}
      {/* male: subtle stubble */}
      {gender === "male" && (
        <path d="M78 168 Q120 192 162 168 Q160 186 120 198 Q80 186 78 168" fill={hair} opacity="0.18" />
      )}

      {/* earrings */}
      {gender === "female" && (
        <>
          <circle cx="68" cy="150" r="3.2" fill="#f4d36a" />
          <circle cx="68" cy="150" r="1" fill="#fff7d0" />
          <circle cx="172" cy="150" r="3.2" fill="#f4d36a" />
          <circle cx="172" cy="150" r="1" fill="#fff7d0" />
        </>
      )}

      {active && !speaking && (
        <circle cx="120" cy="128" r="100" fill="none" stroke="oklch(0.72 0.22 340)" strokeWidth="2" opacity="0.4">
          <animate attributeName="r" values="96;110;96" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}