"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, languages, languageLocales, type Language, type TranslationKey } from "@/lib/i18n/translations"
import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "preferred-language"
const MANUAL_OVERRIDE_KEY = "language-manually-set"

// Corridor (country code) to language mapping
const corridorToLanguage: Record<string, Language> = {
  KR: "ko",
  NP: "ne",
  VN: "vi",
  PH: "en",
  ID: "id",
  TH: "th",
  LK: "si",
  BD: "bn",
  MM: "my",
  KH: "km",
  PK: "ur",
  MN: "mn",
  UZ: "uz",
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey | string) => string
  languages: typeof languages
  languageLocales: typeof languageLocales
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language and listen for auth changes
  useEffect(() => {
    const setLanguageFromCorridor = (corridor: string | undefined) => {
      if (corridor && corridorToLanguage[corridor]) {
        const userLang = corridorToLanguage[corridor]
        setLanguageState(userLang)
        localStorage.setItem(STORAGE_KEY, userLang)
        localStorage.removeItem(MANUAL_OVERRIDE_KEY)
      }
    }

    const initializeLanguage = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)

      // 1. Check logged-in user's corridor first
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const corridor = session.user.user_metadata?.corridor as string

        // If user manually changed language after login, respect that
        const manuallySet = localStorage.getItem(MANUAL_OVERRIDE_KEY) === "true"
        if (manuallySet && stored && stored in translations) {
          setLanguageState(stored as Language)
          setIsInitialized(true)
          return
        }

        // Otherwise use corridor-based language
        setLanguageFromCorridor(corridor)
        setIsInitialized(true)
        return
      }

      // 2. Not logged in - check URL parameter
      const urlParams = new URLSearchParams(window.location.search)
      const langParam = urlParams.get("lang")
      if (langParam && langParam in translations) {
        setLanguageState(langParam as Language)
        localStorage.setItem(STORAGE_KEY, langParam)
        setIsInitialized(true)
        return
      }

      // 3. Use stored language if exists (for non-logged in users)
      if (stored && stored in translations) {
        setLanguageState(stored as Language)
        setIsInitialized(true)
        return
      }

      // 4. Fallback to browser language
      const browserLang = navigator.language.split("-")[0]
      if (browserLang in translations) {
        setLanguageState(browserLang as Language)
      }
      setIsInitialized(true)
    }

    initializeLanguage()

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const corridor = session.user.user_metadata?.corridor as string
        setLanguageFromCorridor(corridor)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Persist language changes to localStorage (manual selection)
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    localStorage.setItem(MANUAL_OVERRIDE_KEY, "true") // Mark as manually selected
  }, [])

  // Translation function with English fallback
  const t = useCallback((key: TranslationKey | string): string => {
    const lang = translations[language] as Record<string, string>
    const en = translations.en as Record<string, string>
    return lang[key] || en[key] || key
  }, [language])

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages, languageLocales }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
