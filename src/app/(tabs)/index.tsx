import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton } from '@/components/skeleton'
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

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: Brand.success, bg: Brand.successLight },
  full: { color: Brand.warning, bg: Brand.warningLight },
  completed: { color: Brand.textSecondary, bg: Brand.borderLight },
  cancelled: { color: Brand.danger, bg: Brand.dangerLight },
};

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
  const { user } = useAuth();
  const { t } = useLocale();
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
  }

  const snapPoints = useMemo(() => ["35%", "55%", "90%"], []);

  useEffect(() => {
    (async () => {
      let lat = 16.8661;
      let lng = 96.1567;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setLocation({ lat, lng });
        } catch (e) { console.error('Location fetch failed', e) }
      }
      const { data } = await supabase.rpc("nearby_jobs", {
        user_lat: lat,
        user_lng: lng,
        radius_meters: 50000,
      });
      setJobs((data as Job[]) ?? []);
      setLoading(false);
    })();
    if (user) {
      supabase.from('users').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data) setAvatarUrl((data as any).avatar_url || null)
      })
      loadUnread()
      loadSavedJobs()
    }
  }, [user]);

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel(`nearby-jobs-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, () => {
        supabase.rpc('nearby_jobs', {
          user_lat: location?.lat ?? 16.8661,
          user_lng: location?.lng ?? 96.1567,
          radius_meters: 50000,
        }).then(({ data }) => {
          if (data) setJobs(data as Job[])
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user, location?.lat, location?.lng])

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
              <Marker key={job.id} coordinate={coords} title={job.title} />
            );
          })}
        </MapView>
      )}

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ScrollView contentContainerStyle={{ paddingTop: 120, paddingHorizontal: Spacing.four, gap: Spacing.three }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Skeleton height={40} borderRadius={20} style={{ flex: 1 }} />
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
            <View style={{ alignItems: 'center', gap: Spacing.two }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width={100} height={28} borderRadius={14} />
            </View>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.jobCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width={60} height={24} borderRadius={12} />
                </View>
                <Skeleton width="100%" height={14} style={{ marginTop: 8 }} />
                <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: 8 }}>
                  <Skeleton width="30%" height={12} />
                  <Skeleton width="20%" height={12} />
                  <Skeleton width="20%" height={12} />
                </View>
                <Skeleton width="20%" height={12} style={{ marginTop: 6 }} />
                <View style={[styles.jobCardFooter, { borderTopWidth: 0, marginTop: 12, paddingTop: 0 }]}>
                  <Skeleton width={60} height={24} borderRadius={12} />
                  <Skeleton width="40%" height={14} />
                </View>
              </View>
            ))}
          </ScrollView>
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
                <View style={styles.radiusRow}>
                  <ThemedText type="caption" style={{ fontWeight: 600 }}>
                    {t('nearby.withinRadius', { radius: radiusKm })}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    <Pressable
                      onPress={() => setRadiusKm((r) => Math.max(1, r - 5))}
                      style={styles.radiusBtn}
                    >
                      <Ionicons name="remove" size={16} color={Brand.primary} />
                    </Pressable>
                    <ThemedText style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                      {radiusKm}
                    </ThemedText>
                    <Pressable
                      onPress={() => setRadiusKm((r) => Math.min(200, r + 5))}
                      style={styles.radiusBtn}
                    >
                      <Ionicons name="add" size={16} color={Brand.primary} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.filterRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.chip,
                          filterCategory === cat && styles.chipActive,
                        ]}
                        onPress={() =>
                          setFilterCategory(filterCategory === cat ? null : cat)
                        }
                      >
                        <ThemedText
                          type="small"
                          style={[
                            filterCategory === cat ? styles.chipTextActive : {},
                          ]}
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
              const s = STATUS_STYLE[item.status] || STATUS_STYLE.open;
              return (
                <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                  <View style={styles.jobCard}>
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
                        <View style={styles.categoryBadge}>
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
                    <View style={styles.jobCardFooter}>
                      {item.price && !item.employment_type && (
                        <ThemedText type="price">
                          {item.price.toLocaleString()} MMK
                        </ThemedText>
                      )}
                      {item.salary_min && item.employment_type && (
                        <ThemedText type="price">
                          {item.salary_min.toLocaleString()} - {item.salary_max?.toLocaleString() ?? ''} MMK{item.salary_period ? `/${SALARY_PERIOD_LABELS[item.salary_period] || ''}` : ''}
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
                          style={styles.dirBtn}
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
        <View style={styles.logoPill}>
          <ThemedText style={styles.logo}>LocJobs</ThemedText>
        </View>
        <View style={styles.topRight}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Brand.primary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <ThemedText style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
              </View>
            )}
          </Pressable>
          {region && (
            <Pressable style={styles.locateHeaderBtn} onPress={() => mapRef.current?.animateToRegion({
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
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
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
    backgroundColor: Brand.white,
    ...Shadow.elevated,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: Brand.primary,
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
    backgroundColor: Brand.white,
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
    backgroundColor: Brand.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: Brand.white,
    fontSize: 10,
    fontWeight: '700',
  },
  locateHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.elevated,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Brand.white,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Brand.white,
  },
  avatarInitial: {
    color: Brand.primary,
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
    backgroundColor: Brand.bg,
    borderRadius: 20,
  },
  sheetHandle: {
    backgroundColor: Brand.border,
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
    backgroundColor: Brand.primary,
  },
  jobCard: {
    backgroundColor: Brand.white,
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
    fontWeight: "700",
    color: Brand.text,
    flex: 1,
  },
  jobDesc: {
    color: Brand.textSecondary,
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
    borderTopColor: Brand.border,
  },
  dirBtn: {
    backgroundColor: Brand.bg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  dirBtnText: {
    color: Brand.primary,
    fontSize: FontSize.xs,
    fontWeight: 700,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  categoryBadgeText: {
    color: Brand.primary,
    fontSize: FontSize.xs,
    fontWeight: 600,
  },
  filterRow: {
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
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
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipTextActive: {
    color: Brand.white,
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
    borderBottomColor: Brand.border,
    marginBottom: Spacing.three,
    marginHorizontal: Spacing.four,
  },
  radiusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
