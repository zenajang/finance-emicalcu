import { en } from './locales/en'
import { ko } from './locales/ko'
import { my } from './locales/my'
import { si } from './locales/si'
import { id } from './locales/id'
import { km } from './locales/km'
import { ne } from './locales/ne'
import { bn } from './locales/bn'
import { th } from './locales/th'
import { uz } from './locales/uz'
import { vi } from './locales/vi'
import { zh } from './locales/zh'
import { hi } from './locales/hi'
import { mn } from './locales/mn'
import { ru } from './locales/ru'
import { ur } from './locales/ur'

export const translations = {
  en,
  ko,
  my,
  si,
  id,
  km,
  ne,
  bn,
  th,
  uz,
  vi,
  zh,
  hi,
  mn,
  ru,
  ur,
  us: en, // US uses English translations
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof en

export const languageLocales: Record<Language, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  my: 'my-MM',
  si: 'si-LK',
  id: 'id-ID',
  km: 'km-KH',
  ne: 'ne-NP',
  bn: 'bn-BD',
  th: 'th-TH',
  uz: 'uz-UZ',
  vi: 'vi-VN',
  zh: 'zh-CN',
  hi: 'hi-IN',
  mn: 'mn-MN',
  ru: 'ru-RU',
  ur: 'ur-PK',
  us: 'en-US'
}

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'id', name: 'Indonesian', nativeName: 'Indonesia' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
]
