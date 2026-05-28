export const LANGUAGES = [
  "English","Spanish","French","German","Italian","Portuguese","Dutch",
  "Russian","Polish","Turkish","Arabic","Hindi","Bengali","Urdu","Tamil",
  "Telugu","Marathi","Punjabi","Japanese","Korean","Chinese (Mandarin)",
  "Vietnamese","Thai","Indonesian","Swahili","Greek","Hebrew","Czech",
  "Swedish","Norwegian","Danish","Finnish","Hungarian","Romanian","Ukrainian",
] as const;

export const CEFR_LEVELS = ["A1","A2","B1","B2","C1","C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner — basic phrases, introductions",
  A2: "Elementary — simple everyday topics",
  B1: "Intermediate — opinions, travel, plans",
  B2: "Upper-intermediate — abstract topics, debate",
  C1: "Advanced — fluent, nuanced expression",
  C2: "Mastery — near-native, idiomatic",
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  English: "🇬🇧", Spanish: "🇪🇸", French: "🇫🇷", German: "🇩🇪", Italian: "🇮🇹",
  Portuguese: "🇵🇹", Dutch: "🇳🇱", Russian: "🇷🇺", Polish: "🇵🇱", Turkish: "🇹🇷",
  Arabic: "🇸🇦", Hindi: "🇮🇳", Bengali: "🇧🇩", Urdu: "🇵🇰", Tamil: "🇮🇳",
  Telugu: "🇮🇳", Marathi: "🇮🇳", Punjabi: "🇮🇳", Japanese: "🇯🇵", Korean: "🇰🇷",
  "Chinese (Mandarin)": "🇨🇳", Vietnamese: "🇻🇳", Thai: "🇹🇭", Indonesian: "🇮🇩",
  Swahili: "🇰🇪", Greek: "🇬🇷", Hebrew: "🇮🇱", Czech: "🇨🇿", Swedish: "🇸🇪",
  Norwegian: "🇳🇴", Danish: "🇩🇰", Finnish: "🇫🇮", Hungarian: "🇭🇺",
  Romanian: "🇷🇴", Ukrainian: "🇺🇦",
};

export const flagFor = (lang: string) => LANGUAGE_FLAGS[lang] ?? "🌍";