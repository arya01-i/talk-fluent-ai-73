import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithTutor } from "@/lib/tutor.functions";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Volume2, Square } from "lucide-react";
import { toast } from "sonner";
import { speak, stopSpeaking, hasSpeakableContent } from "@/lib/speech";

export type Mode = "text" | "voice" | "voice_call" | "video_call";
export type Msg = { role: "user" | "assistant"; content: string };

export function useTutor(mode: Mode) {
  const { profile } = useProfile();
  const call = useServerFn(chatWithTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const msgsRef = useRef<Msg[]>([]);
  useEffect(() => { msgsRef.current = messages; }, [messages]);

  const send = async (text: string): Promise<string | null> => {
    if (!profile || !text.trim()) return null;
    const next: Msg[] = [...msgsRef.current, { role: "user", content: text }];
    msgsRef.current = next;
    setMessages(next);
    setBusy(true);
    try {
      const { reply } = await call({
        data: {
          learningLang: profile.learning_lang,
          nativeLang: profile.native_lang,
          level: profile.level,
          mode,
          messages: next,
        },
      });
      const after: Msg[] = [...next, { role: "assistant" as const, content: reply }];
      msgsRef.current = after;
      setMessages(after);
      return reply;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tutor error");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { msgsRef.current = []; setMessages([]); };
  return { messages, send, busy, reset, profile };
}

export function MessageList({ messages, busy }: { messages: Msg[]; busy: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => () => stopSpeaking(), []);
  const toggleSpeak = (i: number, text: string) => {
    if (speakingIdx === i) { stopSpeaking(); setSpeakingIdx(null); return; }
    if (!profile || !hasSpeakableContent(text)) return;
    stopSpeaking();
    setSpeakingIdx(i);
    speak(text, profile.learning_lang, () => setSpeakingIdx((cur) => (cur === i ? null : cur)));
  };
  return (
    <div ref={ref} className="flex-1 overflow-y-auto space-y-3 p-4">
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground py-12 text-sm">Say hi to Lingvo to start practicing.</div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <Card className={`max-w-[80%] p-3 whitespace-pre-wrap text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
            <div>{m.content}</div>
            {m.role === "assistant" && hasSpeakableContent(m.content) && (
              <button
                type="button"
                onClick={() => toggleSpeak(i, m.content)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label={speakingIdx === i ? "Stop" : "Listen"}
              >
                {speakingIdx === i ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />}
                <span>{speakingIdx === i ? "Stop" : "Listen"}</span>
              </button>
            )}
          </Card>
        </div>
      ))}
      {busy && <div className="flex justify-start"><Card className="p-3"><Loader2 className="size-4 animate-spin" /></Card></div>}
    </div>
  );
}

export function TextComposer({ onSend, busy }: { onSend: (t: string) => void; busy: boolean }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!busy && text.trim()) { onSend(text); setText(""); } }}
      className="border-t p-3 flex gap-2 bg-card"
    >
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" disabled={busy} />
      <Button type="submit" disabled={busy || !text.trim()}><Send className="size-4" /></Button>
    </form>
  );
}