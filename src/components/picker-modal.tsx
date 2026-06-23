import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native'
import { ThemedText } from './themed-text'
import { BorderRadius, Brand, Spacing, FontSize } from '@/constants/theme'

interface PickerModalProps {
  visible: boolean
  title: string
  options: string[]
  selected: string
  onSelect: (value: string) => void
  onClose: () => void
  disabledOptions?: string[]
}

export function PickerModal({ visible, title, options, selected, onSelect, onClose, disabledOptions }: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <ThemedText style={styles.title}>{title}</ThemedText>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item === selected
              const isDisabled = disabledOptions?.includes(item)
              return (
                <Pressable
                  style={[styles.option, isSelected && styles.optionSelected, isDisabled && styles.optionDisabled]}
                  onPress={() => { if (!isDisabled) { onSelect(item); onClose() } }}
                >
                  <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected, isDisabled && styles.optionTextDisabled]}>
                    {item}
                  </ThemedText>
                </Pressable>
              )
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Brand.overlay,
  },
  sheet: {
    maxHeight: '60%',
    backgroundColor: Brand.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Brand.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: 700,
    color: Brand.text,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  list: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
  },
  optionSelected: {
    backgroundColor: Brand.primaryLight,
  },
  optionTextSelected: {
    color: Brand.primary,
    fontWeight: 700,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionTextDisabled: {
    color: Brand.textSecondary,
  },
  optionText: {
    fontSize: FontSize.base,
    color: Brand.text,
  },
})
