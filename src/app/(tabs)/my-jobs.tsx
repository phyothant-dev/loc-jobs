import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import LottieView from 'lottie-react-native';
import {
    BorderRadius,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { EMPLOYMENT_TYPE_LABELS, SALARY_PERIOD_LABELS } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";

interface JobWithMeta {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  price: number | null;
  status: string;
  work_type: string;
  created_at: string;
  vacancies: number;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
}

interface SearcherInfo {
  id: string;
  name: string;
  email: string;
  status: string;
  reject_reason: string | null;
}

interface AppliedInfo {
  jobId: string;
  status: string;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: Brand.success, bg: Brand.successLight },
  full: { color: Brand.warning, bg: Brand.warningLight },
  accepted: { color: Brand.warning, bg: Brand.warningLight },
  completed: { color: Brand.primary, bg: Brand.primaryLight },
  cancelled: { color: Brand.danger, bg: Brand.dangerLight },
};

const APP_STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: Brand.warning, bg: Brand.warningLight },
  accepted: { color: Brand.success, bg: Brand.successLight },
  rejected: { color: Brand.danger, bg: Brand.dangerLight },
};

type Tab = "posted" | "applied";

export default function MyJobsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("posted");
  const [posted, setPosted] = useState<JobWithMeta[]>([]);
  const [applied, setApplied] = useState<JobWithMeta[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<
    Record<string, string>
  >({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [searcherInfo, setSearcherInfo] = useState<
    Record<string, SearcherInfo[]>
  >({});

  const loadJobs = async () => {
    if (!user) return;
    setLoading(true);

    const [postedRes, appliedRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .eq("uploader_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("job_id, searcher_id, status, reject_reason")
        .eq("searcher_id", user.id),
    ]);
    const postedList: JobWithMeta[] = ((postedRes.data ?? []) as any[]).map(
      (j: any) => ({ ...j }),
    );
    setPosted(postedList);

    const postedIds = postedList.map((j) => j.id);

    const searcherInfo_: Record<string, SearcherInfo[]> = {};
    if (postedIds.length > 0) {
      const { data: applications } = await supabase
        .from("applications")
        .select("job_id, searcher_id, status, reject_reason")
        .in("job_id", postedIds);
      const searcherIds = [
        ...new Set((applications ?? []).map((a: any) => a.searcher_id)),
      ];
      const searcherMap: Record<
        string,
        { display_name: string; email: string }
      > = {};
      if (searcherIds.length > 0) {
        const { data: searchers } = await supabase
          .from("users")
          .select("id, display_name, email")
          .in("id", searcherIds);
        for (const s of (searchers ?? []) as any[]) {
          searcherMap[s.id] = {
            display_name: s.display_name || "",
            email: s.email || "",
          };
        }
      }
      for (const a of (applications ?? []) as any[]) {
        const info = searcherMap[a.searcher_id];
        if (info) {
          if (!searcherInfo_[a.job_id]) searcherInfo_[a.job_id] = [];
          searcherInfo_[a.job_id].push({
            id: a.searcher_id,
            name: info.display_name,
            email: info.email,
            status: a.status,
            reject_reason: a.reject_reason || null,
          });
        }
      }
    }
    setSearcherInfo(searcherInfo_);

    const statusMap: Record<string, string> = {};
    let appliedList: JobWithMeta[] = [];
    if (appliedRes.data && appliedRes.data.length > 0) {
      const jobIds = appliedRes.data.map((a: any) => a.job_id);
    const rejectMap: Record<string, string | null> = {};
    for (const a of appliedRes.data as any[]) {
      statusMap[a.job_id] = a.status;
      rejectMap[a.job_id] = a.reject_reason || null;
    }
    setAppliedStatuses(statusMap);
    setRejectReasons(rejectMap);
      const { data: appliedJobs } = await supabase
        .from("jobs")
        .select("*")
        .in("id", jobIds);
      appliedList = ((appliedJobs ?? []) as any[]).map((j: any) => ({ ...j }));
    }
    setApplied(appliedList);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel(`my-jobs-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => {
          loadJobs();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [user?.id]);

  const handleDelete = (jobId: string) => {
    Alert.alert(t('myJobs.deleteJob'), t('myJobs.deleteWarning'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('common.delete'),
        style: "destructive",
        onPress: async () => {
          await supabase.from("jobs").delete().eq("id", jobId);
          loadJobs();
        },
      },
    ]);
  };

  const handleAccept = async (jobId: string, searcherId: string) => {
    setSearcherInfo((prev) => {
      const updated = { ...prev };
      const list = (updated[jobId] || []).map((s) =>
        s.id === searcherId ? { ...s, status: "accepted" } : s,
      );
      updated[jobId] = list;
      return updated;
    });
    setPosted((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const accepted =
          (searcherInfo[jobId] || []).filter((s) => s.status === "accepted")
            .length + 1;
        return accepted >= (j.vacancies || 1) ? { ...j, status: "full" } : j;
      }),
    );
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("searcher_id", searcherId)
      .single();
    if (!app) return;
    await supabase.rpc("accept_application", {
      p_application_id: (app as any).id,
    });
    loadJobs();
  };

  const handleReject = async (jobId: string, searcherId: string) => {
    setSearcherInfo((prev) => {
      const updated = { ...prev };
      const list = (updated[jobId] || []).map((s) =>
        s.id === searcherId ? { ...s, status: "rejected" } : s,
      );
      updated[jobId] = list;
      return updated;
    });
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("searcher_id", searcherId)
      .single();
    if (!app) return;
    await supabase.rpc("reject_application", {
      p_application_id: (app as any).id,
    });
    loadJobs();
  };

  const items = tab === "posted" ? posted : applied;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.headerTitle}>{t('myJobs.title')}</ThemedText>
          {tab === "posted" && (
            <Pressable
              style={styles.topPostBtn}
              onPress={() => router.push("/post")}
            >
              <ThemedText style={styles.topPostBtnText}>+</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === "posted" && styles.tabActive]}
            onPress={() => setTab("posted")}
          >
            <ThemedText
              type="smallBold"
              style={[styles.tabText, tab === "posted" && styles.tabTextActive]}
            >
              {t('myJobs.posted')} ({posted.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "applied" && styles.tabActive]}
            onPress={() => setTab("applied")}
          >
            <ThemedText
              type="smallBold"
              style={[
                styles.tabText,
                tab === "applied" && styles.tabTextActive,
              ]}
            >
              {t('myJobs.applied')} ({applied.length})
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(item) => String(item)}
            contentContainerStyle={{
              padding: Spacing.four,
              paddingBottom: 100,
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.three }} />
            )}
            renderItem={() => (
              <View style={styles.jobCard}>
                <Skeleton width="65%" height={16} />
                <Skeleton
                  width="100%"
                  height={14}
                  style={{ marginTop: Spacing.two }}
                />
                <View style={[styles.metaRow, { marginTop: Spacing.two }]}>
                  <Skeleton width={60} height={22} />
                  <Skeleton width="30%" height={14} />
                  <Skeleton width="20%" height={14} />
                </View>
                <View style={[styles.metaRow, { marginTop: Spacing.two }]}>
                  <Skeleton width="15%" height={14} />
                  <Skeleton width="40%" height={14} />
                </View>
                <View style={styles.actionRow}>
                  <Skeleton style={{ flex: 1 }} height={36} />
                  <Skeleton style={{ flex: 1 }} height={36} />
                </View>
              </View>
            )}
          />
        ) : items.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: Spacing.five,
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: Spacing.five }}>
              <Ionicons
                name={tab === "posted" ? "briefcase-outline" : "document-text-outline"}
                size={48}
                color={Brand.textSecondary}
              />
              <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                {tab === "posted" ? t('myJobs.noPosted') : t('myJobs.noApplied')}
              </ThemedText>
            </View>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: Spacing.four,
              paddingBottom: 100,
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.three }} />
            )}
            renderItem={({ item }) => {
              const s = STATUS_STYLE[item.status] || STATUS_STYLE.open;
              return (
                <Pressable onPress={() => router.push(`/job/${item.id}`)}>
                  <View style={styles.jobCard}>
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                      </ThemedText>
                    </View>
                    <View style={styles.metaRow}>
                      <View
                        style={[styles.statusBadge, { backgroundColor: s.bg }]}
                      >
                        <ThemedText
                          style={[styles.statusBadgeText, { color: s.color }]}
                        >
                          {item.status === "full" ? "Full" : item.status}
                        </ThemedText>
                      </View>
                      <ThemedText type="caption">
                        {item.city}
                        {item.region ? `, ${item.region}` : ""} ·{" "}
                        {item.work_type}
                        {item.employment_type ? ` · ${EMPLOYMENT_TYPE_LABELS[item.employment_type]}` : ''}
                      </ThemedText>
                    </View>
                    {item.price && !item.employment_type && (
                      <ThemedText type="price" style={{ marginTop: 8 }}>
                        {item.price.toLocaleString()} MMK
                      </ThemedText>
                    )}
                    {item.salary_min && item.employment_type && (
                        <ThemedText type="price">
                          {item.salary_min.toLocaleString()} - {item.salary_max?.toLocaleString()} MMK{item.salary_period ? `/${SALARY_PERIOD_LABELS[item.salary_period] || ''}` : ''}
                        </ThemedText>
                      )}

                    {tab === "posted" && (
                      <>
                        <ThemedText
                          type="caption"
                          style={{ marginTop: 4, color: Brand.textSecondary }}
                        >
                          {item.vacancies
                            ? `${(searcherInfo[item.id] || []).filter((s) => s.status === "accepted").length}/${item.vacancies} vacancies filled`
                            : "1 vacancy"}
                        </ThemedText>
                        {searcherInfo[item.id] &&
                          searcherInfo[item.id].length > 0 && (
                            <View style={styles.searcherRow}>
                              <ThemedText
                                type="caption"
                                style={{ color: Brand.textSecondary }}
                              >
                                Applicants ({searcherInfo[item.id].length}):
                              </ThemedText>
                              {searcherInfo[item.id].map((s, i) => {
                                const asc =
                                  APP_STATUS_STYLE[s.status] ||
                                  APP_STATUS_STYLE.pending;
                                return (
                                  <View key={i} style={{ marginTop: 6 }}>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <View style={{ flex: 1 }}>
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                          }}
                                        >
                                          <Pressable
                                            onPress={() =>
                                              router.push(`/user/${s.id}`)
                                            }
                                          >
                                            <ThemedText
                                              type="small"
                                              style={{ color: Brand.primary }}
                                            >
                                              {s.name}
                                            </ThemedText>
                                          </Pressable>
                                          <View
                                            style={[
                                              styles.miniBadge,
                                              { backgroundColor: asc.bg },
                                            ]}
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                fontWeight: 700,
                                                color: asc.color,
                                              }}
                                            >
                                              {s.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                s.status.slice(1)}
                                            </ThemedText>
                                          </View>
                                        </View>
                                        {s.reject_reason && s.status === "rejected" && (
                                          <ThemedText
                                            type="caption"
                                            style={{ color: Brand.danger, marginTop: 2, marginLeft: 4 }}
                                          >
                                            {t('myJobs.reasonPrefix')}{s.reject_reason}
                                          </ThemedText>
                                        )}
                                      </View>
                                      <View
                                        style={{ flexDirection: "row", gap: 4 }}
                                      >
                                        {s.status === "pending" && (
                                          <>
                                            <Pressable
                                              onPress={() =>
                                                handleAccept(item.id, s.id)
                                              }
                                              style={styles.acceptBtn}
                                            >
                                              <ThemedText
                                                style={styles.acceptBtnText}
                                              >
                                                {t('myJobs.accept')}
                                              </ThemedText>
                                            </Pressable>
                                            <Pressable
                                              onPress={() =>
                                                handleReject(item.id, s.id)
                                              }
                                              style={styles.rejectBtn}
                                            >
                                              <ThemedText
                                                style={styles.rejectBtnText}
                                              >
                                                {t('myJobs.reject')}
                                              </ThemedText>
                                            </Pressable>
                                          </>
                                        )}
                                        {s.status !== "pending" && (
                                          <Pressable
                                            onPress={() =>
                                              router.push(
                                                `/chat/${item.id}/${s.id}`,
                                              )
                                            }
                                            style={styles.chatBtn}
                                          >
                                            <ThemedText
                                              style={styles.chatBtnText}
                                            >
                                                {t('myJobs.message')}
                                              </ThemedText>
                                          </Pressable>
                                        )}
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.editBtn}
                            onPress={() => router.push(`/post?id=${item.id}`)}
                          >
                            <ThemedText style={styles.editBtnText}>
                              {t('myJobs.editJob')}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item.id)}
                          >
                            <ThemedText style={styles.deleteBtnText}>
                              {t('myJobs.deleteJob')}
                            </ThemedText>
                          </Pressable>
                        </View>
                      </>
                    )}

                    {tab === "applied" && appliedStatuses[item.id] && (
                      <View style={{ marginTop: 8 }}>
                        <View
                          style={[
                            styles.miniBadge,
                            {
                              backgroundColor:
                                APP_STATUS_STYLE[appliedStatuses[item.id]]
                                  ?.bg || Brand.warningLight,
                              alignSelf: "flex-start",
                            },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{
                              fontWeight: 700,
                              color:
                                APP_STATUS_STYLE[appliedStatuses[item.id]]
                                  ?.color || Brand.warning,
                            }}
                          >
                            {appliedStatuses[item.id].charAt(0).toUpperCase() +
                              appliedStatuses[item.id].slice(1)}
                          </ThemedText>
                        </View>
                        {rejectReasons[item.id] && appliedStatuses[item.id] === "rejected" && (
                          <ThemedText
                            type="caption"
                            style={{ color: Brand.danger, marginTop: 4 }}
                          >
                            Reason: {rejectReasons[item.id]}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    paddingBottom: Spacing.four,
    minHeight: 52,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 700,
    color: Brand.text,
    padding: Spacing.one,
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    backgroundColor: Brand.borderLight,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Brand.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: Brand.textSecondary,
  },
  tabTextActive: {
    color: Brand.text,
  },
  jobCard: {
    backgroundColor: Brand.white,
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  jobTitle: {
    fontWeight: 700,
    fontSize: FontSize.md,
    color: Brand.text,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  searcherRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  editBtn: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Brand.primary,
    alignItems: "center",
  },
  editBtnText: {
    color: Brand.primary,
    fontSize: FontSize.sm,
    fontWeight: 700,
  },
  deleteBtn: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Brand.danger,
    alignItems: "center",
  },
  deleteBtnText: {
    color: Brand.danger,
    fontSize: FontSize.sm,
    fontWeight: 700,
  },
  topPostBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.elevated,
  },
  topPostBtnText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 24,
  },
  chatBtn: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  chatBtnText: {
    color: Brand.primary,
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  acceptBtn: {
    backgroundColor: Brand.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  acceptBtnText: {
    color: Brand.success,
    fontWeight: 700,
    fontSize: FontSize.xs,
  },
  rejectBtn: {
    backgroundColor: Brand.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  rejectBtnText: {
    color: Brand.danger,
    fontWeight: 700,
    fontSize: FontSize.xs,
  },
});
