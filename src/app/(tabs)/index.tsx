import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

interface Job {
  id: string
  title: string
  description: string | null
  work_type: string
  location: unknown | null
  address: string | null
  city: string | null
  region: string | null
  price: number | null
  status: string
  uploader_id: string
  created_at: string
}

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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function openDirections(lat: number, lng: number) {
  const url = Platform.select({
    ios: `maps://app?daddr=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  })
  Linking.openURL(url)
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

export default function NearbyJobsScreen() {
  const insets = useSafeAreaInsets()
  const sheetRef = useRef<BottomSheet>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const snapPoints = useMemo(() => ['25%', '55%', '90%'], [])

  useEffect(() => {
    ;(async () => {
      let lat = 16.8661
      let lng = 96.1567
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({})
          lat = loc.coords.latitude
          lng = loc.coords.longitude
          setLocation({ lat, lng })
        } catch {}
      }
      const { data } = await supabase.rpc('nearby_jobs', { user_lat: lat, user_lng: lng, radius_meters: 50000 })
      setJobs((data as Job[]) ?? [])
      setLoading(false)
    })()
  }, [])

  const region = location
    ? {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : undefined

  const onsite = jobs.filter((j) => j.work_type !== 'remote')

  return (
    <View style={{ flex: 1, backgroundColor: Brand.bg }}>
      {region && (
        <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
          {onsite.map((job) => {
            const coords = parseCoords(job)
            if (!coords) return null
            return <Marker key={job.id} coordinate={coords} title={job.title} />
          })}
        </MapView>
      )}

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ThemedText>Finding nearby jobs...</ThemedText>
        </View>
      ) : (
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCountRow}>
              <View style={styles.sheetDot} />
              <ThemedText style={styles.sheetCount}>
                {onsite.length} nearby · {jobs.length - onsite.length} remote
              </ThemedText>
            </View>
          </View>
          <BottomSheetFlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: Spacing.four }}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
            ListEmptyComponent={
              <View style={{ padding: Spacing.four, alignItems: 'center' }}>
                <ThemedText>No jobs found nearby</ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const coords = parseCoords(item)
              const distance = location && coords ? haversineDistance(location.lat, location.lng, coords.latitude, coords.longitude) : null
              return (
                <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                  <View style={styles.jobCard}>
                    <View style={styles.jobCardTop}>
                      <ThemedText style={styles.jobTitle} numberOfLines={1}>{item.title}</ThemedText>
                      <StatusBadge status={item.status} />
                    </View>
                    {item.description && (
                      <ThemedText style={styles.jobDesc} numberOfLines={1}>{item.description}</ThemedText>
                    )}
                    <View style={styles.jobMetaRow}>
                      <ThemedText style={styles.jobMeta}>
                        {item.city}{item.region ? `, ${item.region}` : ''} · {item.work_type}
                        {distance !== null && ` · ${distance < 1 ? (distance * 1000).toFixed(0) + 'm' : distance.toFixed(1) + 'km'}`}
                      </ThemedText>
                      <ThemedText style={styles.jobTime}>{relativeTime(item.created_at)}</ThemedText>
                    </View>
                    <View style={styles.jobCardFooter}>
                      {item.price && (
                        <ThemedText style={styles.priceText}>
                          {item.price.toLocaleString()} MMK
                        </ThemedText>
                      )}
                      {coords && (
                        <Pressable style={styles.dirBtn} onPress={() => openDirections(coords.latitude, coords.longitude)}>
                          <ThemedText style={styles.dirBtnText}>Directions</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              )
            }}
          />
        </BottomSheet>
      )}

      <View style={[styles.topBar, { top: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.titleRow}>
          <View style={styles.logoPill}>
            <ThemedText style={styles.logo}>LocJobs</ThemedText>
          </View>
          <Pressable style={styles.postBtn} onPress={() => router.push('/post')}>
            <ThemedText style={styles.postBtnText}>+ Post</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoPill: {
    backgroundColor: Brand.white,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    ...Shadow.card,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.primary,
  },
  postBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    ...Shadow.button,
  },
  postBtnText: {
    color: Brand.white,
    fontWeight: '800',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Brand.bg,
  },
  sheetBg: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  sheetCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.primary,
  },
  sheetCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  jobCard: {
    marginHorizontal: Spacing.four,
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    ...Shadow.card,
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: Brand.text,
    flex: 1,
    marginRight: Spacing.two,
  },
  jobDesc: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  jobMeta: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  jobTime: {
    fontSize: 11,
    color: Brand.textSecondary,
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  priceText: {
    fontWeight: '800',
    color: Brand.primary,
    fontSize: 15,
  },
  dirBtn: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  dirBtnText: {
    color: Brand.primary,
    fontSize: 12,
    fontWeight: '700',
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
})