import { useCallback, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, FontSize, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/contexts/LocaleContext'
import { useBrand } from "@/contexts/ThemeContext";

interface JobItem {
  id: string
  title: string
  price: number | null
  city: string | null
  employment_type: string
  created_at: string
}

export default function UserJobsScreen() {
  const Brand = useBrand();

  const { t } = useLocale()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!id) return
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', id)
          .single()
        if (userRow) {
          setUserName((userRow as any).display_name || '')
          setAvatarUrl((userRow as any).avatar_url || null)
        }

        const { data: jobRows } = await supabase
          .from('jobs')
          .select('id, title, price, city, employment_type, created_at')
          .eq('uploader_id', id)
          .eq('deleted', false)
          .in('status', ['open', 'full'])
          .order('created_at', { ascending: false })
        setJobs((jobRows ?? []) as any[])
      } catch (error) {
        console.error('Failed to load user jobs', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [id]))

  const initial = (userName || '?')[0].toUpperCase()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>{userName || t('common.anonymous')}</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three, paddingBottom: 100 }}
        ListHeaderComponent={
          !loading ? (
            <View style={[styles.profileCard, { backgroundColor: Brand.white }]}>
              <View style={[styles.avatar, { backgroundColor: Brand.primaryLight }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                )}
              </View>
              <ThemedText style={styles.name}>{userName || t('common.anonymous')}</ThemedText>
              <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                {t('userSearch.jobs')} ({jobs.length})
              </ThemedText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.six }}>
              <Ionicons name="briefcase-outline" size={48} color={Brand.textSecondary} />
              <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                {t('explore.noJobs')}
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.jobCard, { backgroundColor: Brand.white }]}
            onPress={() => router.push(`/job/${item.id}` as any)}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.jobTitle} numberOfLines={1}>{item.title}</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: 4 }}>
                {item.city ? (
                  <View style={styles.chip}>
                    <Ionicons name="location-outline" size={12} color={Brand.textSecondary} />
                    <ThemedText type="caption" style={{ color: Brand.textSecondary }}>{item.city}</ThemedText>
                  </View>
                ) : null}
                <View style={styles.chip}>
                  <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
                    {t(`categories.${item.employment_type}`)}
                  </ThemedText>
                </View>
              </View>
            </View>
            {item.price ? (
              <ThemedText style={styles.price}>{item.price.toLocaleString()} MMK</ThemedText>
            ) : null}
          </Pressable>
        )}
      />
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
    flex: 1,
    textAlign: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,

    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    marginBottom: Spacing.three,
    gap: Spacing.half,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,

    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontWeight: 700,
    fontSize: FontSize.lg,
  },
  name: {
    fontWeight: 700,
    fontSize: FontSize.md,

  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
    gap: Spacing.three,
  },
  jobTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,

  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  price: {
    fontWeight: 700,
    fontSize: FontSize.sm,

  },
})
