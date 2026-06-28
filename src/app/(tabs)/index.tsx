import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFilterCount } from "@/contexts/FilterCountContext";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from 'lottie-react-native';

import { ThemedText } from "@/components/themed-text";
import {
  BorderRadius,
  BottomTabInset,
  Brand,
  Shadow,
  Spacing,
  FontSize,
} from "@/constants/theme";
import { CATEGORIES, EMPLOYMENT_TYPE_LABELS, SALARY_PERIOD_LABELS } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useBrand } from "@/contexts/ThemeContext";

interface Job {
  id: string;
  title: string;
  description: string | null;
  work_type: string;
  location: unknown | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string | null;
  region: string | null;
  price: number | null;
  status: string;
  uploader_id: string;
  vacancies: number;
  category: string | null;
  created_at: string;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
}

function parseCoords(job: { location: unknown; lat?: number | null; lng?: number | null }): { latitude: number; longitude: number } | null {
  if (job.lat != null && job.lng != null) return { latitude: job.lat, longitude: job.lng };
  return null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function relativeTime(dateStr: string, t?: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t ? t('time.now') : "now";
  if (mins < 60) return `${mins}${t ? t('time.mins') : 'm'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t ? t('time.hours') : 'h'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t ? t('time.days') : 'd'}`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'open': return { color: Brand.success, bg: Brand.successLight };
    case 'full': return { color: Brand.warning, bg: Brand.warningLight };
    case 'completed': return { color: Brand.textSecondary, bg: Brand.borderLight };
    case 'cancelled': return { color: Brand.danger, bg: Brand.dangerLight };
    default: return { color: Brand.success, bg: Brand.successLight };
  }
}

function openDirections(lat: number, lng: number) {
  const scheme = Platform.select({ ios: "maps://0,0?q=", android: "geo:0,0?q=" }) || "https://www.google.com/maps?q=";
  const url = Platform.select({
    ios: `${scheme}${lat},${lng}`,
    android: `${scheme}${lat},${lng}`,
    default: `https://www.google.com/maps?q=${lat},${lng}`,
  });
  Linking.openURL(url!);
}

export default function NearbyJobsScreen() {
  const Brand = useBrand();

  const { user } = useAuth();
  const { t } = useLocale();
  const { setCount } = useFilterCount();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterWorkType, setFilterWorkType] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);

  const loadSavedJobs = async () => {
    if (!user) return
    const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id)
    setSavedJobIds(new Set((data ?? []).map((r: any) => r.job_id)))
  }

  const toggleSave = async (jobId: string) => {
    if (!user) return
    const isSaved = savedJobIds.has(jobId)
    if (isSaved) {
      setSavedJobIds((prev) => { const next = new Set(prev); next.delete(jobId); return next })
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId)
    } else {
      setSavedJobIds((prev) => { const next = new Set(prev); next.add(jobId); return next })
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId })
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }

  const [uploaderInfo, setUploaderInfo] = useState<Map<string, { name: string; verified: boolean }>>(new Map())

  useEffect(() => {
    const ids = [...new Set(jobs.map(j => j.uploader_id))]
    if (ids.length === 0) return
    supabase.from('users').select('id, display_name, verified').in('id', ids).then(({ data }) => {
      const map = new Map<string, { name: string; verified: boolean }>()
      for (const u of (data ?? []) as any) {
        map.set(u.id, { name: u.display_name || 'Anonymous', verified: u.verified || false })
      }
      setUploaderInfo(map)
    })
  }, [jobs])

  const snapPoints = useMemo(() => ["35%", "55%", "90%"], []);

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let lat = 16.8661;
      let lng = 96.1567;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.High }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
          ]);
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            lat = last.coords.latitude;
            lng = last.coords.longitude;
          }
        } catch {}
      }
      if (!cancelled) setLocation({ lat, lng });
      if (cancelled) return
      const { data } = await supabase.rpc("nearby_jobs", {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusKm * 1000,
      });
      if (!cancelled) {
        setJobs((data as Job[]) ?? []);
        setLoading(false);
      }
    })();
    if (user) {
      supabase.from('users').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data) setAvatarUrl((data as any).avatar_url || null)
      })
      loadUnread()
      loadSavedJobs()
    }
    return () => { cancelled = true }
  }, [user, radiusKm]);

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel(`nearby-jobs-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, () => {
        supabase.rpc('nearby_jobs', {
          user_lat: location?.lat ?? 16.8661,
          user_lng: location?.lng ?? 96.1567,
          radius_meters: radiusKm * 1000,
        }).then(({ data }) => {
          if (data) setJobs(data as Job[])
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user, location?.lat, location?.lng, radiusKm])

  useEffect(() => {
    let count = 0;
    if (filterCategory) count++;
    if (filterWorkType) count++;
    setCount('nearby', count);
  }, [filterCategory, filterWorkType]);

  useFocusEffect(useCallback(() => {
    if (!user) return
    ;(async () => {
      try {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
        setUnreadCount(count ?? 0)
      } catch (error) {
        console.error('Failed to fetch unread count', error)
      }
    })()
  }, [user]))

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel(`notifications-bell-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setUnreadCount((c) => c + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.old && (payload.old as any).read === false && payload.new && (payload.new as any).read === true) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  const loadUnread = async () => {
    if (!user) return
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    setUnreadCount(count ?? 0)
  }

  const region = location
    ? {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : undefined;

  const onsite = jobs.filter((j) => j.work_type !== "remote");

  const filteredJobs = jobs.filter((j) => {
    const matchCategory = !filterCategory || j.category === filterCategory;
    const matchWorkType = !filterWorkType || j.work_type === filterWorkType;
    if (!matchCategory || !matchWorkType) return false
    const coords = parseCoords(j)
    if (!coords || !location) return true
    const d = haversineDistance(location.lat, location.lng, coords.latitude, coords.longitude)
    return d <= radiusKm
  });

  return (
    <View style={{ flex: 1, backgroundColor: Brand.bg }}>
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation
        >
          {onsite.map((job) => {
            const coords = parseCoords(job);
            if (!coords) return null;
            return (
              <Marker key={job.id} coordinate={coords} title={job.title} onCalloutPress={() => router.push(`/job/${job.id}`)} />
            );
          })}
        </MapView>
      )}

      {loading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: Brand.bg }]}>
          <LottieView
            source={require('@/assets/images/crew-loader.json')}
            style={{ width: '100%', height: '100%' }}
            autoPlay
            loop
          />
        </View>
      ) : (
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
                  backgroundStyle={[styles.sheetBg, { backgroundColor: Brand.white }]}
          handleIndicatorStyle={[styles.sheetHandle, { backgroundColor: Brand.border }]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCountRow}>
              <View style={[styles.sheetDot, { backgroundColor: Brand.primary }]} />
              <ThemedText type="caption">
                {onsite.length} {t('nearby.jobs')} · {jobs.length - onsite.length} {t('workTypes.remote').toLowerCase()}
              </ThemedText>
            </View>
          </View>
          <BottomSheetFlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: Spacing.four }}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.three }} />
            )}
            ListHeaderComponent={
              <View>
                <View style={[styles.radiusRow, { borderBottomColor: Brand.border }]}>
                  <ThemedText type="caption" style={{ fontWeight: 600 }}>
                    {t('nearby.withinRadius', { radius: radiusKm })}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    <Pressable
                      onPress={() => setRadiusKm((r) => Math.max(1, r - 5))}
                      style={[styles.radiusBtn, { backgroundColor: Brand.primaryLight }]}
                    >
                      <Ionicons name="remove" size={16} color={Brand.primary} />
                    </Pressable>
                    <ThemedText style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                      {radiusKm}
                    </ThemedText>
                    <Pressable
                      onPress={() => setRadiusKm((r) => Math.min(200, r + 5))}
                      style={[styles.radiusBtn, { backgroundColor: Brand.primaryLight }]}
                    >
                      <Ionicons name="add" size={16} color={Brand.primary} />
                    </Pressable>
                  </View>
                </View>
                <View style={[styles.filterRow, { borderBottomColor: Brand.border }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.chip,
                          filterCategory === cat
                            ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                            : { backgroundColor: Brand.bg, borderColor: Brand.border },
                        ]}
                        onPress={() =>
                          setFilterCategory(filterCategory === cat ? null : cat)
                        }
                      >
                        <ThemedText
                          type="small"
                          style={filterCategory === cat ? { color: '#FFFFFF', fontWeight: '700' } : {}}
                        >
                          {cat}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            }
            ListEmptyComponent={
              <View style={{ padding: Spacing.five, alignItems: "center" }}>
                <View style={{ alignItems: "center", paddingVertical: Spacing.five }}>
                  <Ionicons name="location-outline" size={48} color={Brand.textSecondary} />
                  <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                    {t('nearby.noJobs')}
                  </ThemedText>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const coords = parseCoords(item);
              const distance =
                location && coords
                  ? haversineDistance(
                      location.lat,
                      location.lng,
                      coords.latitude,
                      coords.longitude,
                    )
                  : null;
              const s = getStatusStyle(item.status);
              return (
                <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                  <View style={[styles.jobCard, { backgroundColor: Brand.white }]}>
                    <Pressable
                      style={styles.saveBtn}
                      onPress={() => toggleSave(item.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={savedJobIds.has(item.id) ? "heart" : "heart-outline"}
                        size={18}
                        color={savedJobIds.has(item.id) ? Brand.danger : Brand.textSecondary}
                      />
                    </Pressable>
                    <View style={styles.jobCardTop}>
                      <ThemedText style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                      </ThemedText>
                      <View
                        style={[styles.statusBadge, { backgroundColor: s.bg }]}
                      >
                        <ThemedText
                          style={[styles.statusBadgeText, { color: s.color }]}
                        >
                          {item.status === "full" ? "Full" : item.status}
                        </ThemedText>
                      </View>
                      {item.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: Brand.primaryLight }]}>
                          <ThemedText type="caption" style={styles.categoryBadgeText}>
                            {item.category}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    {item.description && (
                      <ThemedText
                        type="small"
                        style={styles.jobDesc}
                        numberOfLines={1}
                      >
                        {item.description}
                      </ThemedText>
                    )}
                    <View style={styles.jobMetaRow}>
                      <ThemedText type="caption" numberOfLines={1}>
                        {item.city}
                        {item.region ? `, ${item.region}` : ""} ·{" "}
                        {item.work_type}
                        {item.employment_type ? ` · ${EMPLOYMENT_TYPE_LABELS[item.employment_type]}` : ''}
                        {distance !== null &&
                          ` · ${distance < 1 ? (distance * 1000).toFixed(0) + t('nearby.m') : distance.toFixed(1) + t('nearby.km')}`}
                      </ThemedText>
                      <ThemedText type="caption">
                        {relativeTime(item.created_at, t)}
                      </ThemedText>
                    </View>
                    {uploaderInfo.has(item.uploader_id) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                        <ThemedText type="caption" style={{ color: Brand.textSecondary }} numberOfLines={1}>
                          {uploaderInfo.get(item.uploader_id)!.name}
                        </ThemedText>
                        {uploaderInfo.get(item.uploader_id)!.verified && (
                          <Ionicons name="checkmark-circle" size={12} color={Brand.primary} />
                        )}
                      </View>
                    )}
                    <View style={[styles.jobCardFooter, { borderTopColor: Brand.border }]}>
                      {item.price && !item.employment_type && (
                        <ThemedText type="price">
                          {item.price.toLocaleString()} MMK
                        </ThemedText>
                      )}
                      {item.salary_min != null && item.employment_type && (
                        <ThemedText type="price">
                          {item.salary_min.toLocaleString()} - {item.salary_max != null ? item.salary_max.toLocaleString() : ''} MMK{item.salary_period ? `/${SALARY_PERIOD_LABELS[item.salary_period] || ''}` : ''}
                        </ThemedText>
                      )}
                      {item.vacancies && (
                        <ThemedText
                          type="caption"
                          style={{ color: Brand.textSecondary }}
                        >
                          {item.vacancies} vacanc{item.vacancies > 1 ? "ies" : "y"}
                        </ThemedText>
                      )}
                      {coords && (
                        <Pressable
                          style={[styles.dirBtn, { backgroundColor: Brand.bg }]}
                          onPress={() =>
                            openDirections(coords.latitude, coords.longitude)
                          }
                        >
                          <ThemedText style={styles.dirBtnText}>
                            {t('nearby.directions')}
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </BottomSheet>
      )}

      <View
        style={[styles.topBar, { top: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <View style={[styles.logoPill, { backgroundColor: Brand.white }]}>
          <ThemedText style={[styles.logo, { color: Brand.primary }]}>LocJobs</ThemedText>
        </View>
        <View style={styles.topRight}>
          <Pressable onPress={() => router.push('/notifications')} style={[styles.bellBtn, { backgroundColor: Brand.white }]}>
            <Ionicons name="notifications-outline" size={22} color={Brand.primary} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: Brand.danger }]}>
                <ThemedText style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
              </View>
            )}
          </Pressable>
          {region && (
            <Pressable style={[styles.locateHeaderBtn, { backgroundColor: Brand.white }]} onPress={() => mapRef.current?.animateToRegion({
              latitude: location?.lat ?? 0,
              longitude: location?.lng ?? 0,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }, 500)}>
              <Ionicons name="locate" size={22} color={Brand.primary} />
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/profile')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: Brand.white }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Brand.primaryLight, borderColor: Brand.white }]}>
                <ThemedText style={styles.avatarInitial}>
                  {(user?.email?.charAt(0) || '?').toUpperCase()}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },
  logoPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,

    ...Shadow.elevated,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",

  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: "center",
    alignItems: "center",
    ...Shadow.elevated,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  locateHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: "center",
    alignItems: "center",
    ...Shadow.elevated,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,

  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,

  },
  avatarInitial: {
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Brand.bg,
    zIndex: 50,
  },
  sheetBg: {
    borderRadius: 20,
  },
  sheetHandle: {
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sheetCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  sheetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,

  },
  jobCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
  },
  saveBtn: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    zIndex: 1,
  },
  jobCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  jobTitle: {
    fontSize: FontSize.base,
    lineHeight: 24,
    fontWeight: "700",

    flex: 1,
  },
  jobDesc: {
    marginTop: 6,
  },
  jobMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  jobCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,

  },
  dirBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  dirBtnText: {
    fontSize: FontSize.xs,
    fontWeight: 700,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginRight: 28,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  categoryBadge: {
    alignSelf: 'flex-start',

    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: 600,
  },
  filterRow: {
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,

    marginBottom: Spacing.three,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,

    borderWidth: 1,

  },
  chipActive: {
  },
  chipTextActive: {
    fontWeight: 700,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,

    marginBottom: Spacing.three,
    marginHorizontal: Spacing.four,
  },
  radiusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',
  },
});
