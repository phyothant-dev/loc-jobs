import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, router, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Brand } from '@/constants/theme'

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post" options={{ presentation: 'modal' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
          <Stack.Screen name="job/[id]" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
