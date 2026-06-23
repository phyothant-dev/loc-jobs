import en, { TranslationKeys } from './en'
import my from './my'

export type Locale = 'en' | 'my'

const translations: Record<Locale, TranslationKeys> = { en, my }

function getNested(obj: any, path: string): string {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path
    current = current[key]
  }
  return typeof current === 'string' ? current : path
}

export function createT(locale: Locale) {
  const dict = translations[locale] || translations.en
  return (path: string, params?: Record<string, string | number>, fallback?: string): string => {
    let val = getNested(dict, path)
    if (val === path) return fallback ?? path
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        val = val.replace(`{${key}}`, String(value))
      }
    }
    return val
  }
}

export type TFunction = ReturnType<typeof createT>
