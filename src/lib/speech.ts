// Web Speech API helpers (client-only).

const LANG_BCP47: Record<string, string> = {
  "English": "en-US", "Spanish": "es-ES", "French": "fr-FR", "German": "de-DE",
  "Italian": "it-IT", "Portuguese": "pt-PT", "Dutch": "nl-NL", "Russian": "ru-RU",
  "Polish": "pl-PL", "Turkish": "tr-TR", "Arabic": "ar-SA", "Hindi": "hi-IN",
  "Bengali": "bn-IN", "Urdu": "ur-PK", "Tamil": "ta-IN", "Telugu": "te-IN",
  "Marathi": "mr-IN", "Punjabi": "pa-IN", "Japanese": "ja-JP", "Korean": "ko-KR",
  "Chinese (Mandarin)": "zh-CN", "Vietnamese": "vi-VN", "Thai": "th-TH",
  "Indonesian": "id-ID", "Swahili": "sw-KE", "Greek": "el-GR", "Hebrew": "he-IL",
  "Czech": "cs-CZ", "Swedish": "sv-SE", "Norwegian": "nb-NO", "Danish": "da-DK",
  "Finnish": "fi-FI", "Hungarian": "hu-HU", "Romanian": "ro-RO", "Ukrainian": "uk-UA",
};

export function bcp47(language: string): string {
  return LANG_BCP47[language] ?? "en-US";
}

export function stripForSpeech(text: string): string {
  // Drop the "↳ translation" hint line
  return text.split(/\n+/).filter((l) => !l.trim().startsWith("↳")).join(" ").replace(/[*_`#>]/g, "").trim();
}

export function speak(text: string, language: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripForSpeech(text));
  u.lang = bcp47(language);
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((v) => v.lang === u.lang) || voices.find((v) => v.lang.startsWith(u.lang.split("-")[0]));
  if (v) u.voice = v;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type SR = typeof window extends never ? never : any;
export function createRecognizer(language: string, opts: { continuous?: boolean; interim?: boolean } = {}): SR | null {
  if (typeof window === "undefined") return null;
  const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = bcp47(language);
  r.continuous = !!opts.continuous;
  r.interimResults = !!opts.interim;
  return r;
}

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const hasSR = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const hasTTS = "speechSynthesis" in window;
  return hasSR && hasTTS;
}