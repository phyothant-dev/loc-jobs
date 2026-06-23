import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet, ScrollView, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Skeleton } from '@/components/skeleton'

import { ThemedText } from '@/components/themed-text'
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
            <ThemedText style={styles.headerTitle}>{t('userProfile.reviews')}</ThemedText>
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
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Brand.primary} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>{t('userProfile.reviews')}</ThemedText>
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
})
