import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Brand, DarkBrand } from '@/constants/theme'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    AsyncStorage.getItem('theme').then((v) => {
      if (v === 'dark' || v === 'light') setTheme(v)
    })
  }, [])

  // Apply theme colors to shared Brand object (supports static import users).
  // Runs during render so child components always see the correct values.
  const target = theme === 'dark' ? DarkBrand : {
    white: '#FFFFFF',
    bg: '#FFF8F4',
    card: '#FFFFFF',
    border: '#F0E4DA',
    borderLight: '#F8F0EA',
    placeholder: '#C4B5A6',
    text: '#2D2B2A',
    textSecondary: '#A09388',
    textTertiary: '#C4B5A6',
    overlay: 'rgba(0,0,0,0.35)',
    primaryLight: '#FFF4ED',
    successLight: '#E8F8F0',
    warningLight: '#FEF9E7',
    dangerLight: '#FDEDEC',
  }
  Object.assign(Brand, target)

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      AsyncStorage.setItem('theme', next)
      return next
    })
  }

  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return Brand
  return Brand
}

export function useIsDark() {
  const ctx = useContext(ThemeContext)
  return ctx?.isDark ?? false
}

export function useToggleTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return () => {}
  return ctx.toggleTheme
}