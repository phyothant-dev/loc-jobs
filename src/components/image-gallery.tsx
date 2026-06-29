import { useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BorderRadius, Brand, Spacing } from '@/constants/theme'
import { useBrand } from '@/contexts/ThemeContext'

const SCREEN_W = Dimensions.get('window').width
const SCREEN_H = Dimensions.get('window').height

interface ImageGalleryProps {
  images: string[]
  initialIndex?: number
  visible: boolean
  onClose: () => void
}

export default function ImageGallery({ images, initialIndex = 0, visible, onClose }: ImageGalleryProps) {
  const Brand = useBrand()
  const insets = useSafeAreaInsets()
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const listRef = useRef<FlatList>(null)

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        {images.length > 1 && (
          <View style={[styles.counter, { top: insets.top + 12 }]}>
            <View style={styles.counterBadge}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.4)' },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
            setActiveIndex(idx)
          }}
          renderItem={({ item }) => (
            <Pressable onPress={onClose} style={styles.slide}>
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="contain"
              />
            </Pressable>
          )}
          keyExtractor={(_, i) => String(i)}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
})
