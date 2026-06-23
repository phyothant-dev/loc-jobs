import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { ThemedText } from './themed-text'
import { BorderRadius, Brand, FontSize, Spacing } from '@/constants/theme'

interface ToastProps {
  visible: boolean
  message: string
  type?: 'error' | 'success'
  duration?: number
  onHide: () => void
}

export function Toast({ visible, message, type = 'error', duration = 3000, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide())
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: type === 'error' ? Brand.danger : Brand.success }]}>
      <ThemedText style={styles.text}>{message}</ThemedText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.four,
    right: Spacing.four,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.md,
    zIndex: 999,
    alignItems: 'center',
    shadowColor: Brand.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#fff',
    fontWeight: 600,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
})
