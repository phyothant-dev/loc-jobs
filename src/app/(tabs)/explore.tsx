import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PickerModal } from "@/components/picker-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
    BorderRadius,
    BottomTabInset,
    Brand,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { supabase } from "@/lib/supabase";

interface Job {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  price: number | null;
  work_type: string;
  status: string;
}

const WORK_TYPES = ["onsite", "remote", "hybrid"] as const;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: Brand.success,
    accepted: Brand.warning,
    completed: Brand.primary,
    cancelled: Brand.danger,
  };
  const bgColors: Record<string, string> = {
    open: Brand.successLight,
    accepted: Brand.warningLight,
    completed: Brand.primaryLight,
    cancelled: Brand.dangerLight,
  };
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: bgColors[status] || Brand.primaryLight },
      ]}
    >
      <ThemedText
        style={[
          styles.statusBadgeText,
          { color: colors[status] || Brand.primary },
        ]}
      >
        {status}
      </ThemedText>
    </View>
  );
}

export default function AllJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      const allJobs = (data ?? []) as Job[];
      setJobs(allJobs);
      const uniqueCities = [
        ...new Set(allJobs.map((j) => j.city).filter(Boolean)),
      ] as string[];
      setCities(uniqueCities);
      setLoading(false);
    })();
  }, []);

  const filtered = jobs.filter((j) => {
    const matchCity = !selectedCity || j.city === selectedCity;
    const matchWorkType = !selectedWorkType || j.work_type === selectedWorkType;
    const matchSearch =
      !search || j.title.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchWorkType && matchSearch;
  });

  const hasAnyFilter = selectedCity || selectedWorkType;
  const clearFilters = () => {
    setSelectedCity(null);
    setSelectedWorkType(null);
    setSearch("");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <ThemedView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>All Jobs</ThemedText>
          {hasAnyFilter && (
            <Pressable onPress={clearFilters}>
              <ThemedText style={styles.clearText}>Clear</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={Brand.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filtersSection}>
          {/* Location picker */}
          <View style={styles.filterRow}>
            <View style={styles.filterPickerGroup}>
              <ThemedText style={styles.filterLabel}>Location</ThemedText>
              <Pressable
                style={[
                  styles.pickerBtn,
                  selectedCity && styles.pickerBtnActive,
                ]}
                onPress={() => setShowCityPicker(true)}
              >
                <ThemedText
                  style={[
                    styles.pickerBtnText,
                    selectedCity && styles.pickerBtnTextActive,
                  ]}
                >
                  {selectedCity || "All cities"}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.pickerChevron,
                    selectedCity && styles.pickerBtnTextActive,
                  ]}
                >
                  ›
                </ThemedText>
              </Pressable>
            </View>

            {/* Work type pills */}
            <View style={styles.filterPickerGroup}>
              <ThemedText style={styles.filterLabel}>Work Type</ThemedText>
              <FlatList
                horizontal
                data={WORK_TYPES}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.pill,
                      selectedWorkType === item && styles.pillActive,
                    ]}
                    onPress={() =>
                      setSelectedWorkType(
                        selectedWorkType === item ? null : item,
                      )
                    }
                  >
                    <ThemedText
                      style={[
                        styles.pillText,
                        selectedWorkType === item && styles.pillTextActive,
                      ]}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </ThemedText>
                  </Pressable>
                )}
                ListHeaderComponent={
                  <Pressable
                    style={[
                      styles.pill,
                      !selectedWorkType && styles.pillActive,
                    ]}
                    onPress={() => setSelectedWorkType(null)}
                  >
                    <ThemedText
                      style={[
                        styles.pillText,
                        !selectedWorkType && styles.pillTextActive,
                      ]}
                    >
                      All
                    </ThemedText>
                  </Pressable>
                }
              />
            </View>
          </View>
        </View>

        <PickerModal
          visible={showCityPicker}
          title="Select City"
          options={["All", ...cities]}
          selected={selectedCity ?? "All"}
          onSelect={(val) => setSelectedCity(val === "All" ? null : val)}
          onClose={() => setShowCityPicker(false)}
        />

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ThemedText>Loading...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: Spacing.four,
              paddingBottom: BottomTabInset + Spacing.four,
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.two }} />
            )}
            ListEmptyComponent={
              <View style={{ padding: Spacing.four, alignItems: "center" }}>
                <ThemedText>No jobs found</ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                <View style={styles.jobCard}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.two,
                      }}
                    >
                      <ThemedText style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                      </ThemedText>
                      <StatusBadge status={item.status} />
                    </View>
                    <ThemedText style={styles.jobMeta}>
                      {item.city}
                      {item.region ? `, ${item.region}` : ""} · {item.work_type}
                    </ThemedText>
                    {item.price && (
                      <ThemedText style={styles.priceText}>
                        {item.price.toLocaleString()} MMK
                      </ThemedText>
                    )}
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Brand.text,
  },
  clearText: {
    color: Brand.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: Brand.white,
    color: Brand.text,
  },
  filtersSection: {
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  filterRow: {
    gap: Spacing.three,
  },
  filterPickerGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Brand.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Brand.white,
  },
  pickerBtnActive: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryLight,
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Brand.textSecondary,
  },
  pickerBtnTextActive: {
    color: Brand.primary,
  },
  pickerChevron: {
    fontSize: 20,
    color: Brand.textSecondary,
    lineHeight: 22,
  },
  filterList: {
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
  },
  pillActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: Brand.textSecondary,
  },
  pillTextActive: {
    color: Brand.white,
  },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  jobTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: Brand.text,
    flex: 1,
  },
  jobMeta: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  priceText: {
    fontWeight: "800",
    color: Brand.primary,
    fontSize: 14,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
