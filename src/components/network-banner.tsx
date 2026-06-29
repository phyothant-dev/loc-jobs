import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from './themed-text'
import { FontSize } from '@/constants/theme'
import { useBrand } from '@/contexts/ThemeContext'
import { useLocale } from '@/contexts/LocaleContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function NetworkBanner() {
  const Brand = useBrand()
  const { t } = useLocale()
  const insets = useSafeAreaInsets()
  const [connected, setConnected] = useState(true)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected ?? true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    Animated.timing(anim, {
      toValue: connected ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [connected])

  if (connected) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: Brand.danger,
          opacity: anim,
          paddingTop: insets.top + 10,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <ThemedText style={styles.text}>{t('common.offline')}</ThemedText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  text: {
    color: '#fff',
    fontWeight: 600,
    fontSize: FontSize.sm,
  },
})
