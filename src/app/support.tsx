import { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, FontSize, Shadow, Spacing } from '@/constants/theme'
import { useLocale } from '@/contexts/LocaleContext'
import { useBrand } from '@/contexts/ThemeContext'

export default function SupportScreen() {
  const Brand = useBrand()
  const { t } = useLocale()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    { q: t('support.faqApply'), a: t('support.faqApplyAns') },
    { q: t('support.faqPost'), a: t('support.faqPostAns') },
    { q: t('support.faqEdit'), a: t('support.faqEditAns') },
    { q: t('support.faqChat'), a: t('support.faqChatAns') },
    { q: t('support.faqVerified'), a: t('support.faqVerifiedAns') },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('support.title')}</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.four, paddingBottom: Spacing.six }}>
        <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
          <ThemedText style={styles.sectionTitle}>{t('support.faq')}</ThemedText>
          {faqs.map((faq, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />}
              <Pressable
                style={styles.faqRow}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <ThemedText style={styles.faqQ}>{faq.q}</ThemedText>
                <Ionicons
                  name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Brand.textSecondary}
                />
              </Pressable>
              {openFaq === i && (
                <ThemedText type="small" style={{ color: Brand.textSecondary, paddingBottom: Spacing.three, paddingHorizontal: Spacing.three }}>
                  {faq.a}
                </ThemedText>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: Brand.white, marginTop: Spacing.three }]}>
          <ThemedText style={styles.sectionTitle}>{t('support.contact')}</ThemedText>
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@locjobs.app')}
          >
            <Ionicons name="mail-outline" size={20} color={Brand.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.contactLabel}>{t('support.email')}</ThemedText>
              <ThemedText type="caption" style={{ color: Brand.primary }}>support@locjobs.app</ThemedText>
            </View>
            <Ionicons name="open-outline" size={16} color={Brand.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL('https://locjobs.app')}
          >
            <Ionicons name="globe-outline" size={20} color={Brand.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.contactLabel}>{t('support.website')}</ThemedText>
              <ThemedText type="caption" style={{ color: Brand.primary }}>locjobs.app</ThemedText>
            </View>
            <Ionicons name="open-outline" size={16} color={Brand.textSecondary} />
          </Pressable>
        </View>

        <ThemedText
          type="caption"
          style={{ color: Brand.textSecondary, textAlign: 'center', marginTop: Spacing.five }}
        >
          © 2026 LocJobs Inc.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,

    letterSpacing: -0.5,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,
    marginBottom: Spacing.three,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  faqQ: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: 600,
    paddingRight: Spacing.two,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.three,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  contactLabel: {
    fontSize: FontSize.base,
    fontWeight: 600,
  },
})
