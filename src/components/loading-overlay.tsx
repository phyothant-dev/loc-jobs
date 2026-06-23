import { StyleSheet, View, Dimensions } from 'react-native'
import LottieView from 'lottie-react-native'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'

interface LoadingOverlayProps {
  visible: boolean
}

const { width, height } = Dimensions.get('window')

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <View style={[styles.overlay, { width, height }]}>
      <View style={styles.card}>
        <LottieView
          source={require('@/assets/images/crew-loader.json')}
          style={{ width: 200, height: 200 }}
          autoPlay
          loop
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Brand.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.six,
    ...Shadow.elevated,
  },
})
