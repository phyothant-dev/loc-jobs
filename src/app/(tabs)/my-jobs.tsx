import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, BottomTabInset, Brand, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface JobWithMeta {
  id: string
  title: string
  city: string | null
  region: string | null
  price: number | null
  status: string
  work_type: string
  created_at: string
  _type: 'posted' | 'accepted'
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: Brand.success,
    accepted: Brand.warning,
    completed: Brand.primary,
    cancelled: Brand.danger,
  }
  const bgColors: Record<string, string> = {
    open: Brand.successLight,
    accepted: Brand.warningLight,
    completed: Brand.primaryLight,
    cancelled: Brand.dangerLight,
  }
  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColors[status] || Brand.primaryLight }]}>
      <ThemedText style={[styles.statusBadgeText, { color: colors[status] || Brand.primary }]}>
        {status}
      </ThemedText>
    </View>
  )
}

export default function MyJobsScreen() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [postedRes, acceptedRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('uploader_id', user.id).order('created_at', { ascending: false }),
        supabase.from('acceptances').select('job_id').eq('searcher_id', user.id),
      ])
      const posted = ((postedRes.data ?? []) as any[]).map((j) => ({ ...j, _type: 'posted' as const }))
      let accepted: JobWithMeta[] = []
      if (acceptedRes.data && acceptedRes.data.length > 0) {
        const jobIds = acceptedRes.data.map((a: any) => a.job_id)
        const { data: acceptedJobs } = await supabase.from('jobs').select('*').in('id', jobIds)
        accepted = ((acceptedJobs ?? []) as any[]).map((j) => ({ ...j, _type: 'accepted' as const }))
      }
      const combined = [...posted, ...accepted].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setJobs(combined)
      setLoading(false)
    })()
  }, [user])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <ThemedView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <ThemedText style={styles.headerTitle}>My Jobs</ThemedText>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Loading...</ThemedText>
          </View>
        ) : jobs.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }}>
            <ThemedText style={{ color: Brand.textSecondary }}>No jobs yet</ThemedText>
            <Pressable style={styles.postBtn} onPress={() => router.push('/post')}>
              <ThemedText style={styles.postBtnText}>Post a Job</ThemedText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.four }}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                <View style={styles.jobCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.jobTitle} numberOfLines={1}>{item.title}</ThemedText>
                      <View style={[styles.typeBadge, item._type === 'posted' ? styles.typeBadgePosted : styles.typeBadgeAccepted]}>
                        <ThemedText style={styles.typeBadgeText}>{item._type}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.badgeRow}>
                      <StatusBadge status={item.status} />
                    </View>
                    <ThemedText style={styles.jobMeta}>
                      {item.city}{item.region ? `, ${item.region}` : ''} · {item.work_type}
                    </ThemedText>
                    {item.price && (
                      <ThemedText style={styles.priceText}>
                        {item.price.toLocaleString()} MMK
                      </ThemedText>
                    )}
                  </View>
                  {item._type === 'posted' && (
                    <Pressable style={styles.editBtn} onPress={() => router.push(`/post?id=${item.id}`)}>
                      <ThemedText style={styles.editBtnText}>Edit</ThemedText>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.text,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  jobTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: Brand.text,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeBadgePosted: {
    backgroundColor: Brand.primaryLight,
  },
  typeBadgeAccepted: {
    backgroundColor: Brand.successLight,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobMeta: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  priceText: {
    fontWeight: '800',
    color: Brand.primary,
    fontSize: 14,
    marginTop: 6,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    marginLeft: Spacing.two,
  },
  editBtnText: {
    color: Brand.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  postBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.three,
    ...Shadow.button,
  },
  postBtnText: {
    color: Brand.white,
    fontWeight: '800',
    fontSize: 15,
  },
})