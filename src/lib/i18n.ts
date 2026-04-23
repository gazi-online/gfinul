import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export type Language = 'en' | 'bn'

export const LANGUAGE_STORAGE_KEY = 'gazi-language'
export const DEFAULT_LANGUAGE: Language = 'en'
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'bn']

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  bn: 'BN',
}

export const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-IN',
  bn: 'bn-IN',
}

const loadedLanguages = new Set<Language>()

const isSupportedLanguage = (value: string | null | undefined): value is Language =>
  value === 'en' || value === 'bn'

export const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isSupportedLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE
}

const fetchLocale = async (language: Language) => {
  const response = await fetch(`/locales/${language}.json`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load locale: ${language}`)
  }

  return response.json()
}

export const ensureLanguageResources = async (language: Language) => {
  if (loadedLanguages.has(language)) {
    return
  }

  const messages = await fetchLocale(language)
  i18n.addResourceBundle(language, 'translation', messages, true, true)
  loadedLanguages.add(language)
}

export const initializeI18n = async () => {
  const language = getStoredLanguage()
  const messages = await fetchLocale(language)

  loadedLanguages.add(language)

  await i18n.use(initReactI18next).init({
    lng: language,
    fallbackLng: false,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      [language]: {
        translation: messages,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: () => '',
  })

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

export const changeAppLanguage = async (language: Language) => {
  await ensureLanguageResources(language)
  await i18n.changeLanguage(language)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

export const getCurrentLanguage = (): Language => {
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language
  return isSupportedLanguage(activeLanguage) ? activeLanguage : DEFAULT_LANGUAGE
}

export const formatLocalizedDate = (value: string | Date) => {
  const parsedDate = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleDateString(LANGUAGE_LOCALES[getCurrentLanguage()], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatLocalizedCurrency = (value: number) =>
  new Intl.NumberFormat(LANGUAGE_LOCALES[getCurrentLanguage()], {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export default i18n
