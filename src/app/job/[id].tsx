import { useEffect, useState } from 'react'
import { Dimensions, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function parseCoords(job: { location: unknown; lat?: number | null; lng?: number | null }): { latitude: number; longitude: number } | null {
  if (job.lat != null && job.lng != null) return { latitude: job.lat, longitude: job.lng }
  if (!job.location || typeof job.location !== 'string') return null
  const hex = job.location.startsWith('\\x') ? job.location.slice(2) : job.location
  if (hex.length < 34) return null
  const lngHex = hex.slice(18, 34)
  const latHex = hex.slice(34, 50)
  const hexToDouble = (h: string) => {
    const bytes = []
    for (let i = 0; i < 16; i += 2) bytes.push(parseInt(h.slice(i, i + 2), 16))
    const buf = new ArrayBuffer(8)
    const view = new DataView(buf)
    bytes.forEach((b, i) => view.setUint8(i, b))
    return view.getFloat64(0, true)
  }
  return { latitude: hexToDouble(latHex), longitude: hexToDouble(lngHex) }
}

interface JobDetail {
  id: string
  title: string
  description: string | null
  work_type: string
  location: unknown | null
  lat: number | null
  lng: number | null
  address: string | null
  city: string | null
  region: string | null
  price: number | null
  status: string
  uploader_id: string
  created_at: string
  image_urls: string[] | null
}

const SCREEN_WIDTH = Dimensions.get('window').width

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

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [uploaderName, setUploaderName] = useState<string | null>(null)
  const [searcherName, setSearcherName] = useState<string | null>(null)
  const [searcherPhone, setSearcherPhone] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(false)
  const [acceptedByMe, setAcceptedByMe] = useState(false)
  const [isMyJob, setIsMyJob] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJob = async () => {
    if (!id || !user) return
    const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (!jobData) { setError('Job not found'); setLoading(false); return }
    const j = jobData as JobDetail
    setJob(j)
    setIsMyJob(j.uploader_id === user.id)
    const { data: userData } = await supabase.from('users').select('display_name').eq('id', j.uploader_id).single()
    if (userData) setUploaderName((userData as any).display_name)
    const { data: acceptData } = await supabase.from('acceptances').select('searcher_id').eq('job_id', id).maybeSingle()
    if (acceptData) {
      setIsAccepted(true)
      const searcherId = (acceptData as any).searcher_id
      setAcceptedByMe(searcherId === user.id)
      if (j.uploader_id === user.id || searcherId === user.id) {
        const { data: sd } = await supabase.from('users').select('display_name, phone').eq('id', searcherId).single()
        if (sd) { setSearcherName((sd as any).display_name); setSearcherPhone((sd as any).phone) }
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadJob() }, [id, user])

  const handleAccept = async () => {
    if (!user || !job) return
    setAccepting(true)
    setError(null)
    const { error: ae } = await supabase.from('acceptances').insert({ job_id: job.id, searcher_id: user.id })
    if (ae) setError(ae.message)
    else { setJob((p) => p ? { ...p, status: 'accepted' } : p); setIsAccepted(true); setAcceptedByMe(true) }
    setAccepting(false)
  }

  const handleComplete = async () => {
    if (!job) return
    setCompleting(true)
    const { error: ue } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', job.id)
    if (ue) setError(ue.message)
    else setJob((p) => p ? { ...p, status: 'completed' } : p)
    setCompleting(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }}>
          <ThemedText style={{ color: Brand.danger, marginBottom: Spacing.three, fontSize: 15 }}>{error || 'Job not found'}</ThemedText>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ThemedText style={{ color: Brand.white, fontWeight: '800' }}>Go Back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const canAccept = !isMyJob && job.status === 'open' && !isAccepted
  const canComplete = (isMyJob || acceptedByMe) && job.status === 'accepted'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backArrow}>
            <ThemedText style={{ color: Brand.primary, fontWeight: '800', fontSize: 15 }}>← Back</ThemedText>
          </Pressable>
          {isMyJob && (
            <View style={styles.myJobPill}>
              <ThemedText style={{ color: Brand.primary, fontSize: 12, fontWeight: '700' }}>Your job</ThemedText>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleCard}>
            <ThemedText style={styles.title}>{job.title}</ThemedText>
            <View style={styles.badgeRow}>
              <View style={[styles.workTypePill, { backgroundColor: Brand.primaryLight }]}>
                <ThemedText style={{ color: Brand.primary, fontWeight: '700', fontSize: 13 }}>{job.work_type}</ThemedText>
              </View>
              <StatusBadge status={job.status} />
            </View>
            {job.price && (
              <ThemedText style={styles.price}>{job.price.toLocaleString()} MMK</ThemedText>
            )}
          </View>

          {job.image_urls && job.image_urls.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
              {job.image_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.galleryImage} contentFit="cover" />
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionLabel}>Description</ThemedText>
            <ThemedText style={{ lineHeight: 22, color: Brand.text }}>{job.description || 'No description'}</ThemedText>
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionLabel}>Location</ThemedText>
            <ThemedText style={{ color: Brand.text }}>{[job.address, job.city, job.region].filter(Boolean).join(', ') || 'Remote'}</ThemedText>
            {(() => {
              const coords = parseCoords(job)
              if (!coords) return null
              return (
                <Pressable style={styles.dirBtn} onPress={() => {
                  const url = Platform.select({
                    ios: `maps://app?daddr=${coords.latitude},${coords.longitude}`,
                    android: `geo:${coords.latitude},${coords.longitude}?q=${coords.latitude},${coords.longitude}`,
                    default: `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`,
                  })
                  Linking.openURL(url)
                }}>
                  <ThemedText style={styles.dirBtnText}>Get Directions</ThemedText>
                </Pressable>
              )
            })()}
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionLabel}>Posted by</ThemedText>
            <ThemedText style={{ color: Brand.text }}>{uploaderName || 'Unknown'}</ThemedText>
          </View>

          {isAccepted && (isMyJob || acceptedByMe) && (
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionLabel}>
                {isMyJob ? 'Accepted by' : 'You accepted this job'}
              </ThemedText>
              {searcherName && <ThemedText style={{ color: Brand.text }}>Name: {searcherName}</ThemedText>}
              {searcherPhone && (
                <ThemedText style={{ marginTop: Spacing.one, color: Brand.text }}>
                  Phone:{' '}
                  <Pressable onPress={() => Linking.openURL(`tel:${searcherPhone}`)}>
                    <ThemedText style={{ color: Brand.primary, fontWeight: '700' }}>{searcherPhone}</ThemedText>
                  </Pressable>
                </ThemedText>
              )}
            </View>
          )}
        </ScrollView>

        {(canAccept || canComplete) && (
          <View style={styles.footer}>
            {canAccept && (
              <Pressable style={[styles.actionBtn, { backgroundColor: Brand.primary }, accepting && { opacity: 0.6 }]} onPress={handleAccept} disabled={accepting}>
                <ThemedText style={styles.actionBtnText}>{accepting ? 'Accepting...' : 'Accept Job'}</ThemedText>
              </Pressable>
            )}
            {canComplete && (
              <Pressable style={[styles.actionBtn, { backgroundColor: Brand.success }, completing && { opacity: 0.6 }]} onPress={handleComplete} disabled={completing}>
                <ThemedText style={styles.actionBtnText}>{completing ? 'Completing...' : 'Complete'}</ThemedText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backArrow: {
    paddingVertical: Spacing.one,
  },
  myJobPill: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  titleCard: {
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    ...Shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.text,
    marginBottom: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  workTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.primary,
  },
  sectionCard: {
    backgroundColor: Brand.white,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dirBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.two,
    alignSelf: 'flex-start',
  },
  dirBtnText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    gap: Spacing.two,
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    ...Shadow.button,
  },
  actionBtnText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
  },
  imageGallery: {
    marginVertical: Spacing.one,
    marginHorizontal: -Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  galleryImage: {
    width: SCREEN_WIDTH * 0.75,
    height: 200,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.two,
  },
  backBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
})