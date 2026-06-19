import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native'
import { ThemedView } from './themed-view'
import { ThemedText } from './themed-text'
import { BorderRadius, Brand, Spacing } from '@/constants/theme'

interface PickerModalProps {
  visible: boolean
  title: string
  options: string[]
  selected: string | null
  onSelect: (value: string) => void
  onClose: () => void
}

export function PickerModal({ visible, title, options, selected, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <ThemedView style={styles.sheet}>
          <Pressable onPress={() => {}}>
            <View style={styles.handle} />
            <ThemedText style={styles.title}>{title}</ThemedText>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, selected === item && styles.optionSelected]}
                  onPress={() => { onSelect(item); onClose() }}
                >
                  <ThemedText style={[styles.optionText, selected === item && styles.optionTextSelected]}>
                    {item}
                  </ThemedText>
                </Pressable>
              )}
            />
          </Pressable>
        </ThemedView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '60%',
    paddingBottom: Spacing.six,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
    alignSelf: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    color: Brand.text,
  },
  list: {
    paddingHorizontal: Spacing.four,
  },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.half,
  },
  optionSelected: {
    backgroundColor: Brand.primary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  optionTextSelected: {
    color: Brand.white,
    fontWeight: '700',
  },
})