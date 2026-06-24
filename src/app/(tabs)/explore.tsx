import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
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

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: Brand.success, bg: Brand.successLight },
  full: { color: Brand.warning, bg: Brand.warningLight },
  accepted: { color: Brand.warning, bg: Brand.warningLight },
  completed: { color: Brand.primary, bg: Brand.primaryLight },
  cancelled: { color: Brand.danger, bg: Brand.dangerLight },
};

const NUM_COLUMNS = 2;
const CARD_GAP = Spacing.three;
const SCREEN_PADDING = Spacing.four;
const CARD_WIDTH =
  (Dimensions.get("window").width - SCREEN_PADDING * 2 - CARD_GAP) /
  NUM_COLUMNS;

export default function AllJobsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
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
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .eq("deleted", false)
      .order("created_at", { ascending: false });
    const allJobs = (data ?? []) as Job[];
    setJobs(allJobs);
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
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
          filter: "status=eq.open",
        },
        (payload) => {
          const newJob = payload.new as Job;
          setJobs((prev) => [newJob, ...prev]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

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
          <Pressable style={styles.saveModalContent} onPress={() => {}}>
            <ThemedText style={styles.saveModalTitle}>{t('explore.saveSearch')}</ThemedText>
            <TextInput
              style={styles.saveModalInput}
              placeholder={t('explore.saveSearchName')}
              placeholderTextColor={Brand.placeholder}
              value={saveSearchName}
              onChangeText={setSaveSearchName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four }}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowSaveSearchModal(false)}>
                <ThemedText style={styles.cancelBtnText}>{t('common.cancel')}</ThemedText>
              </Pressable>
              <Pressable style={styles.saveBtnStyle} onPress={saveCurrentSearch}>
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
              <View key={i} style={styles.card}>
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
                    style={styles.userSearchBtn}
                    onPress={() => router.push('/search-users' as any)}
                  >
                    <Ionicons name="people-outline" size={20} color={Brand.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.userSearchBtn}
                    onPress={() => setShowSaveSearchModal(true)}
                  >
                    <Ionicons name="bookmark-outline" size={20} color={Brand.primary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchInner}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={Brand.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.searchInput}
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
                          style={styles.savedSearchChip}
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
                      style={styles.dropdown}
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
                      style={styles.dropdown}
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
                      style={styles.dropdown}
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
                          !selectedCity && styles.cityChipActive,
                        ]}
                        onPress={() => setSelectedCity(null)}
                      >
                        <ThemedText
                          type="small"
                          style={[
                            !selectedCity ? styles.cityChipTextActive : {},
                          ]}
                        >
                          All
                        </ThemedText>
                      </Pressable>
                      {allCities.map((city) => (
                        <Pressable
                          key={city}
                          style={[
                            styles.cityChip,
                            selectedCity === city && styles.cityChipActive,
                          ]}
                          onPress={() =>
                            setSelectedCity(selectedCity === city ? null : city)
                          }
                        >
                          <ThemedText
                            type="small"
                            style={[
                              selectedCity === city
                                ? styles.cityChipTextActive
                                : {},
                            ]}
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
                          !selectedCategory && styles.cityChipActive,
                        ]}
                        onPress={() => setSelectedCategory(null)}
                      >
                        <ThemedText
                          type="small"
                          style={[
                            !selectedCategory ? styles.cityChipTextActive : {},
                          ]}
                        >
                          {t("common.all")}
                        </ThemedText>
                      </Pressable>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          style={[
                            styles.cityChip,
                            selectedCategory === cat && styles.cityChipActive,
                          ]}
                          onPress={() =>
                            setSelectedCategory(
                              selectedCategory === cat ? null : cat,
                            )
                          }
                        >
                          <ThemedText
                            type="small"
                            style={[
                              selectedCategory === cat
                                ? styles.cityChipTextActive
                                : {},
                            ]}
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
                    style={styles.priceInput}
                    placeholder={t("explore.min")}
                    placeholderTextColor={Brand.placeholder}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="number-pad"
                  />
                  <ThemedText
                    type="small"
                    style={{ color: Brand.textSecondary, paddingHorizontal: 4 }}
                  >
                    —
                  </ThemedText>
                  <TextInput
                    style={styles.priceInput}
                    placeholder={t("explore.max")}
                    placeholderTextColor={Brand.placeholder}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
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
                    const s = STATUS_STYLE[job.status] || STATUS_STYLE.open;
                    return (
                      <Pressable
                        key={job.id}
                        style={styles.card}
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
                          <View style={styles.categoryBadge}>
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
                        {job.employment_type && (
                          <View
                            style={{
                              backgroundColor: Brand.primaryLight,
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              borderRadius: BorderRadius.sm,
                              alignSelf: "flex-start",
                              marginTop: 4,
                            }}
                          >
                            <ThemedText
                              type="caption"
                              style={{ color: Brand.primary, fontWeight: 600 }}
                            >
                              {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                            </ThemedText>
                          </View>
                        )}
                        <View style={styles.cardMetaRow}>
                          <View style={styles.cardPrice}>
                            <ThemedText
                              type="caption"
                              style={{ color: Brand.primary, fontWeight: 600 }}
                            >
                              {job.employment_type
                                ? job.salary_min != null &&
                                  job.salary_max != null
                                  ? `${job.salary_min.toLocaleString()} — ${job.salary_max.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                  : job.salary_min != null
                                    ? `From ${job.salary_min.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                    : job.salary_max != null
                                      ? `Up to ${job.salary_max.toLocaleString()} ${SALARY_PERIOD_LABELS[job.salary_period || "month"]}`
                                      : EMPLOYMENT_TYPE_LABELS[
                                          job.employment_type
                                        ]
                                : job.price != null
                                  ? `${job.price.toLocaleString()} MMK`
                                  : EMPLOYMENT_TYPE_LABELS[
                                      job.employment_type || "full_time"
                                    ]}
                            </ThemedText>
                          </View>
                          <View style={styles.cardStatus}>
                            <ThemedText
                              type="caption"
                              style={{ color: s.color }}
                            >
                              {job.status.charAt(0).toUpperCase() +
                                job.status.slice(1)}
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
            <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={48} color={Brand.textSecondary} />
              <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                {t("explore.noJobs")}
              </ThemedText>
            </View>
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
    color: Brand.text,
    padding: Spacing.one,
    letterSpacing: -0.5,
  },
  userSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: Spacing.three,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.borderLight,
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
    borderColor: Brand.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.white,
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
    borderColor: Brand.borderLight,
    backgroundColor: Brand.white,
  },
  cityChipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  cityChipTextActive: {
    color: Brand.white,
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
    color: Brand.text,
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
    backgroundColor: Brand.white,
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
    color: Brand.text,
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
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
  },
  categoryBadgeText: {
    color: Brand.primary,
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
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: FontSize.sm,
    color: Brand.text,
  },
  savedSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.primaryLight,
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
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.five,
  },
  saveModalTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,
    color: Brand.text,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  saveModalInput: {
    backgroundColor: Brand.bg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    fontSize: FontSize.base,
    color: Brand.text,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Brand.bg,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Brand.textSecondary,
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  saveBtnStyle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Brand.primary,
    alignItems: 'center',
  },
  saveBtnStyleText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: FontSize.base,
  },
});
