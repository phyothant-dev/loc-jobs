import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getLocales } from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { createT, Locale, TFunction } from '@/lib/i18n'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TFunction
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    AsyncStorage.getItem('locale').then((stored) => {
      if (stored === 'en' || stored === 'my') {
        setLocaleState(stored)
      } else {
        const deviceLang = getLocales()?.[0]?.languageCode
        if (deviceLang === 'my') {
          setLocaleState('my')
        }
      }
    })
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    AsyncStorage.setItem('locale', next)
  }, [])

  const t = createT(locale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
