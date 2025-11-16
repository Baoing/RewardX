// Shopify 支持的所有语言
export const SUPPORTED_LANGUAGES = {
  en: "English",
  "zh-CN": "中文（简体）",
  "zh-TW": "中文（繁體）",
  cs: "Čeština",
  da: "Dansk",
  nl: "Nederlands",
  fi: "Suomi",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  nb: "Norsk",
  pl: "Polski",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  es: "Español",
  sv: "Svenska",
  th: "ไทย",
  tr: "Türkçe"
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

