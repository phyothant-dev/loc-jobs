import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, router, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import * as SplashScreen from 'expo-splash-screen'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { Brand } from '@/constants/theme'
import OnboardingScreen from './onboarding'

SplashScreen.preventAutoHideAsync()

function RootGuard() {
  const { session, isLoading } = useAuth()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Brand.bg }}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    )
  }

  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      const val = await AsyncStorage.getItem('onboarding_complete')
      setShowOnboarding(val !== 'true')
    })()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded || showOnboarding === null) return null

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <LocaleProvider>
        <AuthProvider>
          <RootGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post" options={{ presentation: 'modal' }} />
            <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
            <Stack.Screen name="job/[id]" />
            <Stack.Screen name="chat/[jobId]/[otherUserId]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="user/[id]" />
          </Stack>
        </AuthProvider>
      </LocaleProvider>
    </GestureHandlerRootView>
  )
}
