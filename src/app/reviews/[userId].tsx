import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { ThemedText } from '@/components/themed-text'
import { ReviewCard } from '@/components/review-card'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'

type SortMode = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function ReviewsScreen() {
  const { user } = useAuth()
  const { t } = useLocale()
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortMode>('newest')
  const [showSortPicker, setShowSortPicker] = useState(false)

  const fetchReviews = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:users!reviewer_id(display_name, avatar_url)')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
      if (data) {
        let mapped = (data as any[]).map((r) => ({
          id: r.id,
          reviewer_id: r.reviewer_id,
          reviewer_name: r.reviewer?.display_name || 'Anonymous',
          reviewer_avatar: r.reviewer?.avatar_url || null,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        }))
        if (sort === 'newest') mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        else if (sort === 'oldest') mapped.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        else if (sort === 'highest') mapped.sort((a, b) => b.rating - a.rating)
        else if (sort === 'lowest') mapped.sort((a, b) => a.rating - b.rating)
        setReviews(mapped)
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error)
    } finally {
      setLoading(false)
    }
  }, [userId, sort])

  useFocusEffect(useCallback(() => { fetchReviews() }, [fetchReviews]))

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: 'newest', label: t('jobDetail.sortNewest') },
    { key: 'oldest', label: t('jobDetail.sortOldest') },
    { key: 'highest', label: t('jobDetail.sortHighest') },
    { key: 'lowest', label: t('jobDetail.sortLowest') },
  ]

  const currentSortLabel = sortOptions.find((o) => o.key === sort)?.label || ''

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('jobDetail.allReviews')}</ThemedText>
        <Pressable style={styles.sortBtn} onPress={() => setShowSortPicker(!showSortPicker)}>
          <Ionicons name="funnel-outline" size={18} color={Brand.primary} />
        </Pressable>
      </View>

      {showSortPicker && (
        <View style={styles.sortPicker}>
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.sortOption, sort === opt.key && styles.sortOptionActive]}
              onPress={() => { setSort(opt.key); setShowSortPicker(false) }}
            >
              <ThemedText style={[styles.sortOptionText, sort === opt.key && styles.sortOptionTextActive]}>
                {opt.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, padding: Spacing.four }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.skeletonAvatar} />
                <View style={{ marginLeft: Spacing.three, gap: 4 }}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: 80 }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : reviews.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
          <Ionicons name="chatbubbles-outline" size={48} color={Brand.textSecondary} />
          <ThemedText type="small" style={{ color: Brand.textSecondary, marginTop: Spacing.two }}>
            {t('jobDetail.noReviews')}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ReviewCard review={item} isOwn={item.reviewer_id === user?.id} onUpdated={fetchReviews} />
          )}
        />
      )}
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
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,
    color: Brand.text,
    letterSpacing: -0.5,
  },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortPicker: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.borderLight,
  },
  sortOptionActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  sortOptionText: {
    fontSize: FontSize.sm,
    fontWeight: 600,
    color: Brand.textSecondary,
  },
  sortOptionTextActive: {
    color: Brand.white,
  },
  skeletonCard: {
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
    marginBottom: Spacing.three,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.borderLight,
  },
  skeletonLine: {
    height: 12,
    width: 120,
    backgroundColor: Brand.borderLight,
    borderRadius: 6,
  },
})
