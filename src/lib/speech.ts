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

const FEMALE_HINTS = /female|woman|girl|samantha|victoria|zira|tessa|karen|moira|fiona|susan|allison|ava|serena|google.*(female)|amelie|amelia|paulina|monica|luciana|joana|alice|anna|elena|katja|petra|yuna|mei|xiaoxiao|nadia|ines|sara|maria/i;
const MALE_HINTS = /male|man|boy|daniel|alex|fred|tom|david|mark|guy|diego|jorge|carlos|paulo|hiroshi|kyoko|wei|yifan|ahmed|raj|ravi|google.*(male)|thomas|jorge|enrique/i;

function pickVoice(lang: string, gender?: "female" | "male"): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0];
  const matchLang = voices.filter((v) => v.lang === lang || v.lang.startsWith(base));
  if (matchLang.length === 0) return undefined;
  if (gender === "female") {
    return (
      matchLang.find((v) => FEMALE_HINTS.test(v.name)) ||
      matchLang.find((v) => !MALE_HINTS.test(v.name)) ||
      matchLang[0]
    );
  }
  if (gender === "male") {
    return (
      matchLang.find((v) => MALE_HINTS.test(v.name)) ||
      matchLang.find((v) => !FEMALE_HINTS.test(v.name)) ||
      matchLang[0]
    );
  }
  return matchLang[0];
}

function ensureVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    if (window.speechSynthesis.getVoices().length > 0) return resolve();
    const t = setTimeout(() => resolve(), 800);
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => { clearTimeout(t); resolve(); },
      { once: true } as any
    );
  });
}

export function speak(text: string, language: string, onEnd?: () => void, gender?: "female" | "male") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const lang = bcp47(language);
  const run = () => {
    const u = new SpeechSynthesisUtterance(stripForSpeech(text));
    u.lang = lang;
    const v = pickVoice(lang, gender);
    if (v) u.voice = v;
    u.pitch = gender === "male" ? 0.85 : gender === "female" ? 1.15 : 1;
    u.rate = 1;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  };
  ensureVoices().then(run);
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