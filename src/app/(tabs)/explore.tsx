import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFilterCount } from "@/contexts/FilterCountContext";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PickerModal } from "@/components/picker-modal";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import {
    BorderRadius,
    BottomTabInset,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
    CATEGORIES,
    EMPLOYMENT_TYPES,
    EMPLOYMENT_TYPE_LABELS,
    SALARY_PERIOD_LABELS,
} from "@/lib/categories";
import { REGIONS } from "@/lib/regions";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/contexts/ThemeContext";

interface Job {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  price: number | null;
  work_type: string;
  status: string;
  vacancies: number;
  category: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  created_at: string;
}

const WORK_TYPES = ["onsite", "remote", "hybrid"] as const;

const WORK_TYPE_COLORS: Record<string, string> = {
  onsite: "#F97316",
  remote: "#6366F1",
  hybrid: "#06B6D4",
};

const WORK_TYPE_BG: Record<string, string> = {
  onsite: "#FFF7ED",
  remote: "#EEF2FF",
  hybrid: "#ECFEFF",
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'open': return { color: Brand.success, bg: Brand.successLight };
    case 'full': return { color: Brand.warning, bg: Brand.warningLight };
    case 'accepted': return { color: Brand.warning, bg: Brand.warningLight };
    case 'completed': return { color: Brand.primary, bg: Brand.primaryLight };
    case 'cancelled': return { color: Brand.danger, bg: Brand.dangerLight };
    default: return { color: Brand.success, bg: Brand.successLight };
  }
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

const NUM_COLUMNS = 2;
const CARD_GAP = Spacing.three;
const SCREEN_PADDING = Spacing.four;
const CARD_WIDTH =
  (Dimensions.get("window").width - SCREEN_PADDING * 2 - CARD_GAP) /
  NUM_COLUMNS;

export default function AllJobsScreen() {
  const Brand = useBrand();

  const { user } = useAuth();
  const { t } = useLocale();
  const { setCount } = useFilterCount();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<
    string | null
  >(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showWorkTypePicker, setShowWorkTypePicker] = useState(false);
  const [showEmployTypePicker, setShowEmployTypePicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; filters: Record<string, any> }[]>([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

  const loadSavedSearches = useCallback(async () => {
    try {
      const val = await AsyncStorage.getItem('saved_searches')
      if (val) setSavedSearches(JSON.parse(val))
    } catch {}
  }, [])

  const saveCurrentSearch = async () => {
    const name = saveSearchName.trim()
    if (!name) return
    const filters: Record<string, any> = {
      selectedCity,
      selectedRegion,
      selectedWorkType,
      selectedCategory,
      selectedEmploymentType,
      minPrice,
      maxPrice,
      search,
    }
    const entry = { id: Date.now().toString(), name, filters }
    const updated = [...savedSearches, entry]
    setSavedSearches(updated)
    await AsyncStorage.setItem('saved_searches', JSON.stringify(updated))
    setShowSaveSearchModal(false)
    setSaveSearchName("")
  }

  const applySavedSearch = (entry: typeof savedSearches[0]) => {
    setSelectedCity(entry.filters.selectedCity ?? null)
    setSelectedRegion(entry.filters.selectedRegion ?? null)
    setSelectedWorkType(entry.filters.selectedWorkType ?? null)
    setSelectedCategory(entry.filters.selectedCategory ?? null)
    setSelectedEmploymentType(entry.filters.selectedEmploymentType ?? null)
    setMinPrice(entry.filters.minPrice ?? "")
    setMaxPrice(entry.filters.maxPrice ?? "")
    setSearch(entry.filters.search ?? "")
  }

  const deleteSavedSearch = async (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    await AsyncStorage.setItem('saved_searches', JSON.stringify(updated))
  }

  const loadSavedJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", user.id);
    setSavedJobIds(new Set((data ?? []).map((r: any) => r.job_id)));
  };

  const toggleSave = async (jobId: string) => {
    if (!user) return;
    const isSaved = savedJobIds.has(jobId);
    if (isSaved) {
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", jobId);
    } else {
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
      await supabase
        .from("saved_jobs")
        .insert({ user_id: user.id, job_id: jobId });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  };

  const fetchJobs = async () => {
    try {
      setFetchError(false);
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .eq("deleted", false)
        .order("created_at", { ascending: false });
      setJobs((data ?? []) as Job[]);
    } catch {
      setFetchError(true);
    }
  };

  const allRegions = Object.keys(REGIONS).sort();
  const allCities = selectedRegion
    ? (REGIONS[selectedRegion] || []).sort()
    : Object.values(REGIONS).flat().sort();

  useEffect(() => {
    (async () => {
      await fetchJobs();
      await loadSavedJobs();
      await loadSavedSearches();
      setLoading(false);
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    await loadSavedJobs();
    await loadSavedSearches();
    setRefreshing(false);
  };

  useEffect(() => {
    const sub = supabase
      .channel(`explore-jobs-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jobs", filter: "status=eq.open" },
        (payload) => {
          const newJob = payload.new as Job;
          setJobs((prev) => [newJob, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs" },
        () => { fetchJobs(); },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "jobs" },
        () => { fetchJobs(); },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  useEffect(() => {
    let count = 0;
    if (selectedCity) count++;
    if (selectedRegion) count++;
    if (selectedWorkType) count++;
    if (selectedCategory) count++;
    if (selectedEmploymentType) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (search) count++;
    setCount('explore', count);
  }, [selectedCity, selectedRegion, selectedWorkType, selectedCategory, selectedEmploymentType, minPrice, maxPrice, search]);

  const filtered = jobs.filter((j) => {
    const matchCity = !selectedCity || j.city === selectedCity;
    const matchRegion = !selectedRegion || j.region === selectedRegion;
    const matchWorkType = !selectedWorkType || j.work_type === selectedWorkType;
    const matchCategory = !selectedCategory || j.category === selectedCategory;
    const matchMinPrice =
      !minPrice || (j.price != null && j.price >= parseInt(minPrice, 10));
    const matchMaxPrice =
      !maxPrice || (j.price != null && j.price <= parseInt(maxPrice, 10));
    const matchSearch =
      !search || j.title.toLowerCase().includes(search.toLowerCase());
    const matchEmployType =
      !selectedEmploymentType || j.employment_type === selectedEmploymentType;
    return (
      matchCity &&
      matchRegion &&
      matchWorkType &&
      matchCategory &&
      matchMinPrice &&
      matchMaxPrice &&
      matchSearch &&
      matchEmployType
    );
  });

  const hasAnyFilter =
    selectedCity ||
    selectedRegion ||
    selectedWorkType ||
    selectedCategory ||
    selectedEmploymentType ||
    minPrice ||
    maxPrice ||
    search;

  const groupedByType = useMemo(() => {
    const groups: Record<string, Job[]> = {};
    for (const wt of WORK_TYPES) groups[wt] = [];
    for (const job of filtered) {
      if (groups[job.work_type]) groups[job.work_type].push(job);
    }
    return Object.entries(groups).filter(([, jobs]) => jobs.length > 0);
  }, [filtered]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <PickerModal
        visible={showWorkTypePicker}
        title={t("explore.selectType")}
        options={[
          t("explore.allTypes"),
          ...WORK_TYPES.map((w) => w.charAt(0).toUpperCase() + w.slice(1)),
        ]}
        selected={
          selectedWorkType
            ? selectedWorkType.charAt(0).toUpperCase() +
              selectedWorkType.slice(1)
            : t("explore.allTypes")
        }
        onSelect={(val) =>
          setSelectedWorkType(
            val === t("explore.allTypes") ? null : val.toLowerCase(),
          )
        }
        onClose={() => setShowWorkTypePicker(false)}
      />

      <PickerModal
        visible={showEmployTypePicker}
        title={t("explore.employmentType")}
        options={[
          t("common.all"),
          ...EMPLOYMENT_TYPES.map((et) => EMPLOYMENT_TYPE_LABELS[et]),
        ]}
        selected={
          selectedEmploymentType
            ? EMPLOYMENT_TYPE_LABELS[selectedEmploymentType]
            : t("common.all")
        }
        onSelect={(val) => {
          if (val === t("common.all")) {
            setSelectedEmploymentType(null);
            return;
          }
          const key =
            Object.entries(EMPLOYMENT_TYPE_LABELS).find(
              ([, v]) => v === val,
            )?.[0] || null;
          setSelectedEmploymentType(key);
        }}
        onClose={() => setShowEmployTypePicker(false)}
      />

      <PickerModal
        visible={showRegionPicker}
        title={t("explore.selectRegion")}
        options={[t("explore.allRegions"), ...allRegions]}
        selected={selectedRegion || t("explore.allRegions")}
        onSelect={(val) =>
          setSelectedRegion(val === t("explore.allRegions") ? null : val)
        }
        onClose={() => setShowRegionPicker(false)}
      />

      <Modal visible={showSaveSearchModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSaveSearchModal(false)}>
          <Pressable style={[styles.saveModalContent, { backgroundColor: Brand.white }]} onPress={() => {}}>
            <ThemedText style={styles.saveModalTitle}>{t('explore.saveSearch')}</ThemedText>
            <TextInput
              style={[styles.saveModalInput, { backgroundColor: Brand.bg, color: Brand.text }]}
              placeholder={t('explore.saveSearchName')}
              placeholderTextColor={Brand.placeholder}
              value={saveSearchName}
              onChangeText={setSaveSearchName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four }}>
              <Pressable style={[styles.cancelBtn, { backgroundColor: Brand.bg }]} onPress={() => setShowSaveSearchModal(false)}>
                <ThemedText style={styles.cancelBtnText}>{t('common.cancel')}</ThemedText>
              </Pressable>
              <Pressable style={[styles.saveBtnStyle, { backgroundColor: Brand.primary }]} onPress={saveCurrentSearch}>
                <ThemedText style={styles.saveBtnStyleText}>{t('common.save')}</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {loading ? (
        <View
          style={{
            flex: 1,
            backgroundColor: Brand.bg,
            paddingHorizontal: SCREEN_PADDING,
          }}
        >
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[styles.card, { backgroundColor: Brand.white }]}>
                <Skeleton
                  width="100%"
                  height={140}
                  borderRadius={BorderRadius.md}
                />
                <View style={{ marginTop: Spacing.three }}>
                  <Skeleton width="70%" height={16} />
                </View>
                <View style={{ marginTop: 4 }}>
                  <Skeleton width="50%" height={14} />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <Skeleton
                    width={60}
                    height={18}
                    borderRadius={BorderRadius.sm}
                  />
                  <Skeleton width={100} height={14} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={groupedByType}
          keyExtractor={([type]) => type}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_PADDING,
            paddingBottom: BottomTabInset + Spacing.four,
          }}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={7}
          keyboardShouldPersistTaps="handled"
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <ThemedText style={styles.headerTitle}>
                  {t("explore.title")}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Pressable
                    onPress={() => {
                      setSelectedCity(null);
                      setSelectedRegion(null);
                      setSelectedWorkType(null);
                      setSelectedCategory(null);
                      setSelectedEmploymentType(null);
                      setMinPrice("");
                      setMaxPrice("");
                      setSearch("");
                    }}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: hasAnyFilter ? Brand.primary : Brand.textSecondary,
                      }}
                    >
                      {t("explore.reset")}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.userSearchBtn, { backgroundColor: Brand.primaryLight }]}
                    onPress={() => router.push('/search-users' as any)}
                  >
                    <Ionicons name="people-outline" size={20} color={Brand.primary} />
                  </Pressable>
                  <Pressable
                    style={[styles.userSearchBtn, { backgroundColor: Brand.primaryLight }]}
                    onPress={() => setShowSaveSearchModal(true)}
                  >
                    <Ionicons name="bookmark-outline" size={20} color={Brand.primary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <View style={[styles.searchInner, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={Brand.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: Brand.text }]}
                    placeholder={t("explore.search")}
                    placeholderTextColor={Brand.placeholder}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
              </View>

              {savedSearches.length > 0 && (
                <View style={{ marginBottom: Spacing.three }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={{ flexDirection: 'row', gap: Spacing.two, paddingHorizontal: SCREEN_PADDING }}>
                      {savedSearches.map((s) => (
                        <Pressable
                          key={s.id}
                          style={[styles.savedSearchChip, { backgroundColor: Brand.primaryLight }]}
                          onPress={() => applySavedSearch(s)}
                          onLongPress={() => {
                            Alert.alert(t('common.delete'), t('explore.deleteSavedSearch'), [
                              { text: t('common.cancel'), style: 'cancel' },
                              { text: t('common.delete'), style: 'destructive', onPress: () => deleteSavedSearch(s.id) },
                            ])
                          }}
                        >
                          <Ionicons name="bookmark" size={12} color={Brand.primary} />
                          <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 700 }}>{s.name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.filtersSection}>
                <View style={styles.filterRow}>
                  <View style={styles.filterGroup}>
                    <ThemedText
                      type="caption"
                      style={{ marginBottom: 6, fontWeight: 600 }}
                    >
                      {t("explore.type")}
                    </ThemedText>
                    <Pressable
                      style={[styles.dropdown, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
                      onPress={() => setShowWorkTypePicker(true)}
                    >
                      <ThemedText
                        type="small"
                        style={
                          !selectedWorkType
                            ? { color: Brand.placeholder }
                            : { color: Brand.text, fontWeight: 700 }
                        }
                      >
                        {selectedWorkType
                          ? selectedWorkType.charAt(0).toUpperCase() +
                            selectedWorkType.slice(1)
                          : t("explore.allTypes")}
                      </ThemedText>
                    </Pressable>
                  </View>
                  <View style={styles.filterGroup}>
                    <ThemedText
                      type="caption"
                      style={{ marginBottom: 6, fontWeight: 600 }}
                    >
                      {t("explore.employmentType")}
                    </ThemedText>
                    <Pressable
                      style={[styles.dropdown, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
                      onPress={() => setShowEmployTypePicker(true)}
                    >
                      <ThemedText
                        type="small"
                        style={
                          !selectedEmploymentType
                            ? { color: Brand.placeholder }
                            : { color: Brand.text, fontWeight: 700 }
                        }
                      >
                        {selectedEmploymentType
                          ? EMPLOYMENT_TYPE_LABELS[selectedEmploymentType]
                          : t("explore.allEmployment")}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.filterRow}>
                  <View style={styles.filterGroup}>
                    <ThemedText
                      type="caption"
                      style={{ marginBottom: 6, fontWeight: 600 }}
                    >
                      {t("explore.region")}
                    </ThemedText>
                    <Pressable
                      style={[styles.dropdown, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
                      onPress={() => setShowRegionPicker(true)}
                    >
                      <ThemedText
                        type="small"
                        style={
                          !selectedRegion
                            ? { color: Brand.placeholder }
                            : { color: Brand.text, fontWeight: 700 }
                        }
                      >
                        {selectedRegion || t("explore.allRegions")}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.citySection}>
                  <ThemedText
                    type="caption"
                    style={{ marginBottom: 6, fontWeight: 600 }}
                  >
                    {t("explore.city")}
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.cityRow}>
                      <Pressable
                        style={[
                          styles.cityChip,
                          !selectedCity
                            ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                            : { backgroundColor: Brand.bg, borderColor: Brand.border },
                        ]}
                        onPress={() => setSelectedCity(null)}
                      >
                        <ThemedText
                          type="small"
                          style={!selectedCity ? { color: '#FFFFFF', fontWeight: '700' } : {}}
                        >
                          All
                        </ThemedText>
                      </Pressable>
                      {allCities.map((city) => (
                        <Pressable
                          key={city}
                          style={[
                            styles.cityChip,
                            selectedCity === city
                              ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                              : { backgroundColor: Brand.bg, borderColor: Brand.border },
                          ]}
                          onPress={() =>
                            setSelectedCity(selectedCity === city ? null : city)
                          }
                        >
                          <ThemedText
                            type="small"
                            style={selectedCity === city ? { color: '#FFFFFF', fontWeight: '700' } : {}}
                          >
                            {city}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.citySection}>
                  <ThemedText
                    type="caption"
                    style={{ marginBottom: 6, fontWeight: 600 }}
                  >
                    {t("explore.category")}
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.cityRow}>
                      <Pressable
                        style={[
                          styles.cityChip,
                          !selectedCategory
                            ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                            : { backgroundColor: Brand.bg, borderColor: Brand.border },
                        ]}
                        onPress={() => setSelectedCategory(null)}
                      >
                        <ThemedText
                          type="small"
                          style={!selectedCategory ? { color: '#FFFFFF', fontWeight: '700' } : {}}
                        >
                          {t("common.all")}
                        </ThemedText>
                      </Pressable>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          style={[
                            styles.cityChip,
                            selectedCategory === cat
                              ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                              : { backgroundColor: Brand.bg, borderColor: Brand.border },
                          ]}
                          onPress={() =>
                            setSelectedCategory(
                              selectedCategory === cat ? null : cat,
                            )
                          }
                        >
                          <ThemedText
                            type="small"
                            style={selectedCategory === cat ? { color: '#FFFFFF', fontWeight: '700' } : {}}
                          >
                            {cat}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.priceRow}>
                  <TextInput
                    style={[styles.priceInput, { borderColor: Brand.border, backgroundColor: Brand.white, color: Brand.text }]}
                    placeholder={t("explore.min")}
                    placeholderTextColor={Brand.placeholder}
                    value={minPrice}
                    onChangeText={(v) => setMinPrice(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                  />
                  <ThemedText
                    type="small"
                    style={{ color: Brand.textSecondary, paddingHorizontal: 4 }}
                  >
                    —
                  </ThemedText>
                  <TextInput
                    style={[styles.priceInput, { borderColor: Brand.border, backgroundColor: Brand.white, color: Brand.text }]}
                    placeholder={t("explore.max")}
                    placeholderTextColor={Brand.placeholder}
                    value={maxPrice}
                    onChangeText={(v) => setMaxPrice(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                  />
                  <ThemedText
                    type="small"
                    style={{ color: Brand.textSecondary, marginLeft: 4 }}
                  >
                    MMK
                  </ThemedText>
                </View>
              </View>
            </View>
          }
          renderItem={({ item: [type, typeJobs] }) => {
            const color = WORK_TYPE_COLORS[type];
            const bg = WORK_TYPE_BG[type];
            return (
              <View style={{ marginBottom: Spacing.five }}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: color }]}
                  />
                  <ThemedText style={styles.sectionTitle}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: Brand.textSecondary }}
                  >
                    {typeJobs.length}
                  </ThemedText>
                </View>
                <View style={styles.grid}>
                  {typeJobs.map((job) => {
                    const s = getStatusStyle(job.status);
                    return (
                      <Pressable
                        key={job.id}
                        style={[styles.card, { backgroundColor: Brand.white }]}
                        onPress={() => router.push(`/job/${job.id}`)}
                      >
                        <Pressable
                          style={styles.saveBtn}
                          onPress={() => toggleSave(job.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={
                              savedJobIds.has(job.id)
                                ? "heart"
                                : "heart-outline"
                            }
                            size={18}
                            color={
                              savedJobIds.has(job.id)
                                ? Brand.danger
                                : Brand.textSecondary
                            }
                          />
                        </Pressable>
                        <View
                          style={[styles.workTypeTag, { backgroundColor: bg }]}
                        />
                        {job.category && (
                          <View style={[styles.categoryBadge, { backgroundColor: Brand.primaryLight }]}>
                            <ThemedText
                              type="caption"
                              style={styles.categoryBadgeText}
                            >
                              {job.category}
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText style={styles.cardTitle} numberOfLines={2}>
                          {job.title}
                        </ThemedText>
                        <View style={styles.cardLocation}>
                          <ThemedText type="caption" numberOfLines={1}>
                            {job.city}
                            {job.region ? `, ${job.region}` : ""}
                          </ThemedText>
                        </View>
                        <ThemedText type="caption" style={{ color: Brand.textSecondary, marginTop: 2 }}>
                          {relativeTime(job.created_at, t)}
                        </ThemedText>
                        <View style={styles.cardMetaRow}>
                          <View style={styles.cardPrice}>
                            {job.employment_type && !job.salary_min && !job.salary_max && !job.price ? (
                              <View style={[styles.employBadge, { backgroundColor: Brand.primaryLight }]}>
                                <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 600 }}>
                                  {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                                </ThemedText>
                              </View>
                            ) : (
                              <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 600 }}>
                                {job.employment_type
                                  ? job.salary_min != null && job.salary_max != null
                                    ? `${job.salary_min.toLocaleString()} — ${job.salary_max.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                    : job.salary_min != null
                                      ? `From ${job.salary_min.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                      : job.salary_max != null
                                        ? `Up to ${job.salary_max.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                        : ''
                                  : job.price != null
                                    ? `${job.price.toLocaleString()} MMK`
                                    : ''}
                              </ThemedText>
                            )}
                          </View>
                          <View style={styles.cardStatus}>
                            <ThemedText type="caption" style={{ color: s.color }}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            fetchError ? (
              <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
                <Ionicons name="cloud-offline-outline" size={48} color={Brand.danger} />
                <ThemedText type="small" style={{ color: Brand.textSecondary, marginTop: 8 }}>
                  {t('common.networkError')}
                </ThemedText>
                <Pressable
                  style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Brand.primary, borderRadius: BorderRadius.md }}
                  onPress={async () => { await fetchJobs(); await loadSavedJobs(); await loadSavedSearches(); }}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: 700 }}>Retry</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={48} color={Brand.textSecondary} />
                <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                  {t("explore.noJobs")}
                </ThemedText>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,

    padding: Spacing.one,
    letterSpacing: -0.5,
  },
  userSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: Spacing.three,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,

    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Brand.text,
  },
  filtersSection: {
    marginBottom: Spacing.three,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  filterGroup: {
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,

    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,

  },
  citySection: {
    marginBottom: Spacing.two,
  },
  cityRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,


  },
  cityChipActive: {
  },
  cityChipTextActive: {
    fontWeight: 700,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: FontSize.md,

    textTransform: "capitalize",
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,

    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
  },
  saveBtn: {
    position: "absolute",
    top: Spacing.two,
    right: Spacing.two,
    zIndex: 1,
  },
  workTypeTag: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.three,
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,
    lineHeight: 24,

  },
  cardLocation: {
    marginTop: 4,
  },
  cardPrice: {
    marginTop: 8,
    fontSize: FontSize.md,
  },
  cardStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  cardStatusText: {
    fontSize: FontSize.xs,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  employBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  categoryBadge: {
    alignSelf: "flex-start",

    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: 600,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    color: Brand.text,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: FontSize.sm,
  },
  savedSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  saveModalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.five,
  },
  saveModalTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,

    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  saveModalInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    fontSize: FontSize.base,
    backgroundColor: Brand.bg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,

    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  saveBtnStyle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,

    alignItems: 'center',
  },
  saveBtnStyleText: {
    fontWeight: 700,
    fontSize: FontSize.base,
    color: '#FFFFFF',
  },
});
