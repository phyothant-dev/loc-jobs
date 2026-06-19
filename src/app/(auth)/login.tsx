import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, KeyboardAvoidingView, Platform, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <ThemedText style={styles.logoText}>LJ</ThemedText>
            </View>
            <ThemedText style={styles.brandName}>LocJobs</ThemedText>
            <ThemedText style={styles.tagline}>Find work near you</ThemedText>
          </View>

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Brand.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Brand.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
              <ThemedText style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</ThemedText>
            </Pressable>
          </View>

          <Pressable onPress={() => router.replace('/(auth)/register')}>
            <ThemedText style={styles.link}>
              Don't have an account? <ThemedText style={styles.linkBold}>Sign Up</ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four + 8,
    gap: Spacing.four,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    ...Shadow.button,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.white,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: Brand.white,
    color: Brand.text,
  },
  button: {
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadow.button,
  },
  buttonText: {
    color: Brand.white,
    fontSize: 17,
    fontWeight: '800',
  },
  link: {
    textAlign: 'center',
    color: Brand.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    color: Brand.primary,
    fontWeight: '700',
  },
  error: {
    color: Brand.danger,
    textAlign: 'center',
    fontSize: 13,
  },
})