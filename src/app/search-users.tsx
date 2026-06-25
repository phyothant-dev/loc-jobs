import { useCallback, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, FontSize, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/contexts/LocaleContext'
import { useBrand } from "@/contexts/ThemeContext";

interface UserResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
  role: string
  jobCount: number
}

export default function SearchUsersScreen() {
  const Brand = useBrand();

  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [searched, setSearched] = useState(false)

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); setSearched(false); return }
    setSearched(true)
    const term = `%${q.trim()}%`
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, city, role')
      .or(`display_name.ilike.${term},city.ilike.${term}`)
      .is('deleted_at', null)
      .limit(20)
    if (!userRows) { setUsers([]); return }
    const userIds = (userRows as any[]).map((u) => u.id)

    const { data: countRows } = await supabase
      .from('jobs')
      .select('uploader_id')
      .in('uploader_id', userIds)
      .eq('deleted', false)
      .in('status', ['open', 'full'])
    const counts: Record<string, number> = {}
    for (const c of (countRows ?? []) as any[]) {
      counts[c.uploader_id] = (counts[c.uploader_id] || 0) + 1
    }

    setUsers((userRows as any[]).map((u) => ({
      id: u.id,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      city: u.city,
      role: u.role,
      jobCount: counts[u.id] || 0,
    })))
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('userSearch.title')}</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: Brand.white, borderColor: Brand.border }]}>
        <Ionicons name="search" size={18} color={Brand.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.input, { color: Brand.text }]}
          placeholder={t('userSearch.placeholder')}
          placeholderTextColor={Brand.placeholder}
          value={query}
          onChangeText={(v) => { setQuery(v); searchUsers(v) }}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => { setQuery(''); setUsers([]); setSearched(false) }}>
            <Ionicons name="close-circle" size={18} color={Brand.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three, paddingBottom: 100 }}
        ListEmptyComponent={
          searched ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.six }}>
              <Ionicons name="people-outline" size={48} color={Brand.textSecondary} />
              <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                {t('userSearch.noResults')}
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const initial = (item.display_name || '?')[0].toUpperCase()
          return (
            <Pressable
              style={[styles.userCard, { backgroundColor: Brand.white }]}
              onPress={() => router.push(`/user/${item.id}/jobs` as any)}
            >
              <View style={[styles.avatar, { backgroundColor: Brand.primaryLight }]}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.userName} numberOfLines={1}>
                  {item.display_name || t('common.anonymous')}
                </ThemedText>
                <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
                  {item.city || t('userSearch.noLocation')} · {t(`profile.role_${item.role}`)}
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 700 }}>
                  {item.jobCount} {t('userSearch.jobs')}
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Brand.textSecondary} />
              </View>
            </Pressable>
          )
        }}
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
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,

    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderWidth: 1,

  },
  input: {
    flex: 1,
    fontSize: FontSize.base,

  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
    gap: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontWeight: 700,
    fontSize: FontSize.md,
  },
  userName: {
    fontWeight: 700,
    fontSize: FontSize.base,

  },
})
