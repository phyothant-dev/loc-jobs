import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { Skeleton } from '@/components/skeleton'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: any
  read: boolean
  created_at: string
}

function relativeTime(dateStr: string, t?: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t ? t('time.now') : 'now'
  if (mins < 60) return `${mins}${t ? t('time.mins') : 'm'}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}${t ? t('time.hours') : 'h'}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}${t ? t('time.days') : 'd'}`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationsScreen() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setNotifications((data ?? []) as Notification[])
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useFocusEffect(useCallback(() => { load() }, [load]))

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel(`notifications-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as Notification
        setNotifications((prev) => [n, ...prev])
        supabase.from('notifications').update({ read: true }).eq('id', n.id).then(() => {
          setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item))
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  const handlePress = (n: Notification) => {
    if (n.type === 'new_message' && n.data?.job_id && n.data?.sender_id) {
      router.push(`/chat/${n.data.job_id}/${n.data.sender_id}`)
    } else if (n.data?.job_id) {
      router.push(`/job/${n.data.job_id}`)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('notifications.title')}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ padding: Spacing.four, paddingBottom: 100, gap: Spacing.two }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.cardTop, { gap: Spacing.two }]}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width="50%" height={14} style={{ flex: 1 }} />
                <Skeleton width="15%" height={14} />
              </View>
              <View style={{ paddingLeft: 34, marginTop: 2 }}>
                <Skeleton width="80%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
          <Ionicons name="notifications-outline" size={48} color={Brand.textSecondary} />
          <ThemedText type="small" style={{ color: Brand.textSecondary, textAlign: 'center' }}>
            {t('notifications.empty')}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)}>
              <View style={[styles.card, !item.read && styles.cardUnread]}>
                <View style={styles.cardTop}>
                  <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                  <ThemedText type="caption" style={{ color: Brand.textSecondary }}>{relativeTime(item.created_at, t)}</ThemedText>
                </View>
                <ThemedText type="small" style={{ color: Brand.textSecondary, marginTop: 2 }}>{item.body}</ThemedText>
              </View>
            </Pressable>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
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
  card: {
    backgroundColor: Brand.white,
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,
    color: Brand.text,
    flex: 1,
  },
})