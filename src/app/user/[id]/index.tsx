import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet, ScrollView, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Skeleton } from '@/components/skeleton'

import { ThemedText } from '@/components/themed-text'
import { ReviewCard } from '@/components/review-card'
import { StarRating } from '@/components/star-rating'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'

export default function UserProfileScreen() {
  const { user } = useAuth()
  const { t } = useLocale()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])

  const loadProfile = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await supabase.from('users').select('*').eq('id', id).single()
      if (data) {
        const u = data as any
        setDisplayName(u.display_name || '')
        setBio(u.bio || '')
        setPhone(u.phone || '')
        setEmail(u.email || '')
        setCity(u.city || '')
        setRegion(u.region || '')
        setAvatarUrl(u.avatar_url || null)
        setVerified(u.verified || false)
      }

      const { data: ratingData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', id)
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc: number, r: any) => acc + r.rating, 0)
        setAvgRating(Number((sum / ratingData.length).toFixed(1)))
        setRatingCount(ratingData.length)
      } else {
        setAvgRating(0)
        setRatingCount(0)
      }

      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('*, reviewer:users!reviewer_id(display_name, avatar_url)')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false })
        .limit(3)
      if (reviewRows) {
        setReviews((reviewRows as any[]).map((r) => ({
          id: r.id,
          reviewer_id: r.reviewer_id,
          reviewer_name: (r as any).reviewer?.display_name || 'Anonymous',
          reviewer_avatar: (r as any).reviewer?.avatar_url || null,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        })))
      }

      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id, title, price, city, employment_type, created_at')
        .eq('uploader_id', id)
        .eq('deleted', false)
        .in('status', ['open', 'full'])
        .order('created_at', { ascending: false })
        .limit(5)
      setJobs((jobRows ?? []) as any[])
    } catch (error) {
      console.error('Failed to load profile', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => { loadProfile() }, [loadProfile]))

  const initial = (displayName || email || '?')[0].toUpperCase()
  const isMe = user?.id === id

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      {loading ? (
        <View style={{ flex: 1, backgroundColor: Brand.bg }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Brand.primary} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>{displayName || t('common.anonymous')}</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarCard}>
              <Skeleton width={88} height={88} borderRadius={44} />
              <Skeleton width="50%" height={18} style={{ marginTop: Spacing.three }} />
              <Skeleton width={100} height={14} style={{ marginTop: Spacing.half }} />
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Ionicons name="call-outline" size={16} color={Brand.borderLight} />
                  <Skeleton width="40%" height={14} />
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Ionicons name="location-outline" size={16} color={Brand.borderLight} />
                  <Skeleton width="30%" height={14} />
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Skeleton width="50%" height={14} />
              </View>
            </View>

            <View style={{ gap: Spacing.two }}>
              <Skeleton width={80} height={14} style={{ marginLeft: Spacing.four }} />
              <View style={styles.infoCard}>
                <View style={[styles.infoRow, { gap: Spacing.two }]}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <Skeleton width="30%" height={14} style={{ flex: 1 }} />
                  <Skeleton width={100} height={14} />
                </View>
                <View style={{ paddingHorizontal: Spacing.four, paddingBottom: 14 }}>
                  <Skeleton width="100%" height={14} />
                </View>
              </View>
            </View>

            <View style={{ gap: Spacing.two }}>
              <Skeleton width={60} height={14} style={{ marginLeft: Spacing.four }} />
              <View style={styles.infoCard}>
                <View style={[styles.infoRow, { gap: Spacing.two }]}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width={80} height={14} />
                </View>
                <View style={styles.divider} />
                <View style={[styles.infoRow, { gap: Spacing.two }]}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width={80} height={14} />
                </View>
                <View style={styles.divider} />
                <View style={[styles.infoRow, { gap: Spacing.two }]}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width={80} height={14} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Brand.primary} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>{displayName || t('common.anonymous')}</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarCard}>
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ThemedText style={styles.name}>{displayName || t('common.anonymous')}</ThemedText>
                {verified && (
                  <Ionicons name="checkmark-circle" size={18} color={Brand.primary} />
                )}
              </View>
              {email ? <ThemedText type="small" style={{ color: Brand.textSecondary, marginTop: 2 }}>{email}</ThemedText> : null}
              {bio ? (
                <ThemedText type="small" style={{ color: Brand.text, marginTop: Spacing.two, textAlign: 'center', paddingHorizontal: Spacing.four }}>
                  {bio}
                </ThemedText>
              ) : null}
              {ratingCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.half, gap: 6 }}>
                  <StarRating rating={Math.round(avgRating)} size={14} />
                  <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
                    {avgRating} ({ratingCount})
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <ThemedText type="caption" style={styles.infoLabel}>{t('userProfile.phone')}</ThemedText>
                <ThemedText style={styles.infoValue}>{phone || t('userProfile.emDash')}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <ThemedText type="caption" style={styles.infoLabel}>{t('userProfile.city')}</ThemedText>
                <ThemedText style={styles.infoValue}>{city || t('userProfile.emDash')}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <ThemedText type="caption" style={styles.infoLabel}>{t('userProfile.region')}</ThemedText>
                <ThemedText style={styles.infoValue}>{region || t('userProfile.emDash')}</ThemedText>
              </View>
            </View>

            {jobs.length > 0 && (
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>
                  {t('userSearch.jobs')} ({jobs.length})
                </ThemedText>
                <View style={{ paddingHorizontal: Spacing.four, gap: 0 }}>
                  {jobs.slice(0, 3).map((job, idx) => (
                    <Pressable
                      key={job.id}
                      style={[styles.jobRow, idx === Math.min(jobs.length, 3) - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => router.push(`/job/${job.id}` as any)}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.jobTitle} numberOfLines={1}>{job.title}</ThemedText>
                        <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
                          {job.city || ''}{job.city && job.price ? ' · ' : ''}{job.price ? `${job.price.toLocaleString()} MMK` : ''}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Brand.textSecondary} />
                    </Pressable>
                  ))}
                </View>
                {jobs.length > 3 && (
                  <Pressable
                    style={styles.seeAllRow}
                    onPress={() => router.push(`/user/${id}/jobs` as any)}
                  >
                    <ThemedText style={styles.seeAllText}>
                      {t('userSearch.seeAllJobs')}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={Brand.primary} />
                  </Pressable>
                )}
              </View>
            )}

            {reviews.length > 0 && (
              <View style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>{displayName || t('common.anonymous')}</ThemedText>
                <View style={{ gap: Spacing.two, paddingHorizontal: Spacing.four, paddingBottom: Spacing.four }}>
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} isOwn={r.reviewer_id === user?.id} onUpdated={loadProfile} />
                  ))}
                </View>
                <Pressable
                  style={styles.seeAllRow}
                  onPress={() => router.push(`/reviews/${id}` as any)}
                >
                  <ThemedText style={styles.seeAllText}>{t('userProfile.seeAllReviews')}</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={Brand.primary} />
                </Pressable>
              </View>
            )}

            {!isMe && (
              <Pressable style={styles.msgBtn} onPress={() => router.push('/(tabs)/chat')}>
                <ThemedText style={styles.msgBtnText}>{t('userProfile.sendMessage')}</ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </>
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
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Brand.primaryLight,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 700,
    color: Brand.white,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: 700,
    color: Brand.text,
    marginTop: Spacing.three,
  },
  infoCard: {
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
  },
  infoLabel: {
    fontWeight: 600,
    color: Brand.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: 600,
    color: Brand.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.borderLight,
    marginHorizontal: Spacing.four,
  },
  msgBtn: {
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadow.elevated,
  },
  msgBtnText: {
    color: Brand.white,
    fontSize: FontSize.base,
    fontWeight: 700,
  },
  sectionCard: {
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,
    color: Brand.text,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.borderLight,
  },
  seeAllText: {
    color: Brand.primary,
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.borderLight,
  },
  jobTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,
    color: Brand.text,
  },
})
