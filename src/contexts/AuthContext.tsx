import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password' as any)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL('auth/callback')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      if (error) return { error: error.message }
      if (!data?.url) return { error: 'No OAuth URL returned' }

      // openAuthSessionAsync on iOS uses ASWebAuthenticationSession
      // which intercepts custom scheme callbacks natively.
      // On Android it uses Chrome Custom Tabs — the redirect URL
      // may need to be captured via Linking events.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

      let url = result.type === 'success' ? result.url : null

      // On Android, openAuthSessionAsync may not return the redirect URL.
      // Listen for it via Linking events as a fallback.
      if (!url && Platform.OS === 'android') {
        url = await new Promise<string | null>((resolve) => {
          const baseRedirect = redirectUrl.split('?')[0].split('#')[0]
          const subscription = Linking.addEventListener('url', (event) => {
            if (event.url.startsWith(baseRedirect)) {
              subscription.remove()
              resolve(event.url)
            }
          })
          setTimeout(() => {
            subscription.remove()
            resolve(null)
          }, 120000)
        })
      }

      if (url) {
        const fragment = url.split('#')[1]
        if (fragment) {
          const params = new URLSearchParams(fragment)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
            return { error: null }
          }
        }
      }

      // Fallback
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return { error: null }

      return { error: result.type === 'cancel' ? 'Sign in was cancelled.' : 'Sign in failed. Please try again.' }
    } catch (e: any) {
      return { error: e?.message ?? 'Google sign in failed' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)