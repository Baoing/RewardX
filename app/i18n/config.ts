import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

// 导入翻译文件 - 使用 Shopify 标准语言代码
import en from "./locales/en.json"
import zhCN from "./locales/zh-CN.json"
import zhTW from "./locales/zh-TW.json"
import es from "./locales/es.json"
import fr from "./locales/fr.json"
import de from "./locales/de.json"
import ja from "./locales/ja.json"
import ko from "./locales/ko.json"

// 使用 Shopify 标准语言代码，为未创建的语言使用英文后备
const resources = {
  en: { translation: en },
  "zh-CN": { translation: zhCN },
  "zh-TW": { translation: zhTW },
  cs: { translation: en }, // 捷克语 - 使用英文后备
  da: { translation: en }, // 丹麦语 - 使用英文后备
  nl: { translation: en }, // 荷兰语 - 使用英文后备
  fi: { translation: en }, // 芬兰语 - 使用英文后备
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: en }, // 意大利语 - 使用英文后备
  ja: { translation: ja },
  ko: { translation: ko },
  nb: { translation: en }, // 挪威语 - 使用英文后备
  pl: { translation: en }, // 波兰语 - 使用英文后备
  "pt-BR": { translation: en }, // 葡萄牙语(巴西) - 使用英文后备
  "pt-PT": { translation: en }, // 葡萄牙语(葡萄牙) - 使用英文后备
  es: { translation: es },
  sv: { translation: en }, // 瑞典语 - 使用英文后备
  th: { translation: en }, // 泰语 - 使用英文后备
  tr: { translation: en }  // 土耳其语 - 使用英文后备
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    lng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  })

export default i18n

