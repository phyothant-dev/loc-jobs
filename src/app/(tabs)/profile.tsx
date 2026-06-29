import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ReviewCard } from "@/components/review-card";
import { StarRating } from "@/components/star-rating";
import { Skeleton } from '@/components/skeleton'
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
import { supabase } from "@/lib/supabase";
import { useBrand, useToggleTheme, useIsDark } from "@/contexts/ThemeContext";

export default function ProfileScreen() {
  const Brand = useBrand();
  const isDark = useIsDark();
  const toggleTheme = useToggleTheme();
  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    toggleTheme()
  }

  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [expandedCompleted, setExpandedCompleted] = useState(false);
  const [expandedSaved, setExpandedSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userRes, myCompletedRes, myAppsRes, savedRes, ratingRes, reviewRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase.from("jobs").select("*").eq("uploader_id", user.id).eq("status", "completed").eq("deleted", false).order("updated_at", { ascending: false }),
        supabase.from("applications").select("job_id").eq("searcher_id", user.id).eq("status", "accepted"),
        supabase.from("saved_jobs").select("job_id").eq("user_id", user.id),
        supabase.from('reviews').select('rating').eq('reviewee_id', user.id),
        supabase.from('reviews').select('*, reviewer:users!reviewer_id(display_name, avatar_url)').eq('reviewee_id', user.id).order('created_at', { ascending: false }).limit(3),
      ])

      const { data } = userRes
      if (data) {
        const u = data as any;
        setDisplayName(u.display_name || "");
        setBio(u.bio || "");
        setPhone(u.phone || "");
        setCity(u.city || "");
        setRegion(u.region || "");
        setAvatarUrl(u.avatar_url || null);
        setVerified(u.verified || false);
      }

      const { data: myCompleted } = myCompletedRes

      const { data: myApps } = myAppsRes

      let workedJobs: any[] = [];
      const jobIds = (myApps ?? []).map((a: any) => a.job_id);
      if (jobIds.length > 0) {
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .in("id", jobIds)
          .eq("status", "completed")
          .order("updated_at", { ascending: false });
        workedJobs = (data ?? []) as any[];
      }

      const all = [...((myCompleted ?? []) as any[]), ...workedJobs];
      const unique = all.filter((j, i, arr) => arr.findIndex((x) => x.id === j.id) === i);
      setCompletedJobs(unique);

      const { data: savedRows } = savedRes

      const savedJobIds = (savedRows ?? []).map((r: any) => r.job_id);
      if (savedJobIds.length > 0) {
        const { data: sj } = await supabase
          .from("jobs")
          .select("*")
          .in("id", savedJobIds)
          .order("created_at", { ascending: false });
        setSavedJobs((sj ?? []) as any[]);
      } else {
        setSavedJobs([]);
      }

      const { data: ratingData } = ratingRes
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc: number, r: any) => acc + r.rating, 0);
        setAvgRating(Number((sum / ratingData.length).toFixed(1)));
        setRatingCount(ratingData.length);
      } else {
        setAvgRating(0);
        setRatingCount(0);
      }

      const { data: reviewRows } = reviewRes
      if (reviewRows) {
        setReviews((reviewRows as any[]).map((r) => ({
          id: r.id,
          reviewer_id: r.reviewer_id,
          reviewer_name: (r as any).reviewer?.display_name || 'Anonymous',
          reviewer_avatar: (r as any).reviewer?.avatar_url || null,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        })));
      }
      setLoadingReviews(false);
    } catch (error) {
      console.error('Failed to load profile', error);
      setLoadingReviews(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const initial = (displayName || user?.email || "?")[0].toUpperCase();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t('profile.title')}</ThemedText>
          <Pressable onPress={signOut} style={[styles.signOutBtn, { backgroundColor: Brand.dangerLight }]}>
            <ThemedText style={[styles.signOutText, { color: Brand.danger }]}>{t('profile.signOut')}</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {loading ? (
            <View style={{ gap: Spacing.four }}>
              <View style={[styles.profileCard, { backgroundColor: Brand.white }]}>
                <Skeleton width={88} height={88} borderRadius={44} />
                <Skeleton width="50%" height={18} style={{ marginTop: Spacing.three }} />
              </View>

              <View style={[styles.infoCard, { backgroundColor: Brand.white }]}>
                <View style={styles.infoRow}>
                  <Skeleton width="30%" height={14} />
                  <Skeleton width="50%" height={14} />
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.infoRow}>
                  <Skeleton width="30%" height={14} />
                  <Skeleton width="50%" height={14} />
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.infoRow}>
                  <Skeleton width="30%" height={14} />
                  <Skeleton width="50%" height={14} />
                </View>
              </View>

              <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                <ThemedText style={styles.sectionTitle}>{t('profile.completedJobs', { count: 0 })}</ThemedText>
                <View style={styles.jobRow}>
                  <Skeleton width="60%" height={14} />
                  <Ionicons name="chevron-forward" size={18} color={Brand.borderLight} />
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.jobRow}>
                  <Skeleton width="60%" height={14} />
                  <Ionicons name="chevron-forward" size={18} color={Brand.borderLight} />
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.jobRow}>
                  <Skeleton width="60%" height={14} />
                  <Ionicons name="chevron-forward" size={18} color={Brand.borderLight} />
                </View>
              </View>

              <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                <ThemedText style={styles.sectionTitle}>{t('profile.savedJobs', { count: 0 })}</ThemedText>
                <View style={styles.jobRow}>
                  <Skeleton width="60%" height={14} />
                  <Ionicons name="chevron-forward" size={18} color={Brand.borderLight} />
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.jobRow}>
                  <Skeleton width="60%" height={14} />
                  <Ionicons name="chevron-forward" size={18} color={Brand.borderLight} />
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.profileCard, { backgroundColor: Brand.white }]}>
                <Pressable
                  style={[styles.editBtn, { backgroundColor: Brand.primaryLight }]}
                  onPress={() => router.push("/edit-profile" as any)}
                >
                  <Ionicons name="pencil" size={16} color={Brand.primary} />
                </Pressable>

                <View style={styles.avatarWrap}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={[styles.avatar, { backgroundColor: Brand.primary, borderColor: Brand.primaryLight }]} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: Brand.primary, borderColor: Brand.primaryLight }]}>
                      <ThemedText style={styles.avatarInitial}>
                        {initial}
                      </ThemedText>
                    </View>
                  )}
                </View>

                {displayName ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={styles.nameText}>{displayName}</ThemedText>
                    {verified && (
                      <Ionicons name="checkmark-circle" size={18} color={Brand.primary} />
                    )}
                  </View>
                ) : null}
                <ThemedText type="small" style={{ color: Brand.textSecondary }}>
                  {user?.email}
                </ThemedText>
                {bio ? (
                  <ThemedText type="small" style={{ color: Brand.text, marginTop: Spacing.two, textAlign: 'center', paddingHorizontal: Spacing.four }}>
                    {bio}
                  </ThemedText>
                ) : null}
                {ratingCount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.half, gap: 6 }}>
                    <StarRating rating={Math.round(avgRating)} size={14} />
                    <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
                      {avgRating} ({ratingCount})
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={[styles.infoCard, { backgroundColor: Brand.white }]}>
                <View style={styles.infoRow}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    {t('profile.phone')}
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {phone || t('profile.emDash')}
                  </ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.infoRow}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    {t('profile.city')}
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {city || t('profile.emDash')}
                  </ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.infoRow}>
                  <ThemedText type="caption" style={styles.infoLabel}>
                    {t('profile.region')}
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {region || t('profile.emDash')}
                  </ThemedText>
                </View>
              </View>

              {reviews.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.reviews')}</ThemedText>
                  <View style={{ gap: Spacing.two, paddingHorizontal: Spacing.four, paddingBottom: Spacing.four }}>
                    {reviews.map((r) => (
                      <ReviewCard key={r.id} review={r} isOwn={r.reviewer_id === user?.id} onUpdated={loadProfile} />
                    ))}
                  </View>
                  <Pressable
                    style={[styles.seeAllRow, { borderTopColor: Brand.borderLight }]}
                    onPress={() => router.push(`/reviews/${user?.id}` as any)}
                  >
                    <ThemedText style={styles.seeAllText}>{t('profile.seeAllReviews')}</ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={Brand.primary} />
                  </Pressable>
                </View>
              )}

              {completedJobs.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.completedJobs', { count: completedJobs.length })}</ThemedText>
                  {(expandedCompleted ? completedJobs : completedJobs.slice(0, 3)).map((job, i) => (
                    <Pressable key={job.id} onPress={() => router.push(`/job/${job.id}`)}>
                      <View style={[styles.jobRow, i < (expandedCompleted ? completedJobs.length : Math.min(completedJobs.length, 3)) - 1 && styles.jobRowBorder, { borderBottomColor: Brand.borderLight }]}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.jobTitle}>{job.title}</ThemedText>
                          {job.price ? <ThemedText type="caption" style={{ color: Brand.textSecondary }}>{job.price.toLocaleString()} MMK</ThemedText> : null}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
                      </View>
                    </Pressable>
                  ))}
                  {!expandedCompleted && completedJobs.length > 3 && (
                    <Pressable onPress={() => setExpandedCompleted(true)} style={[styles.seeAllRow, { borderTopColor: Brand.borderLight }]}>
                      <ThemedText style={styles.seeAllText}>+{completedJobs.length - 3} {t('userSearch.jobs')}</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}

              {savedJobs.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.savedJobs', { count: savedJobs.length })}</ThemedText>
                  {(expandedSaved ? savedJobs : savedJobs.slice(0, 3)).map((job, i) => (
                    <Pressable key={job.id} onPress={() => router.push(`/job/${job.id}`)}>
                      <View style={[styles.jobRow, i < (expandedSaved ? savedJobs.length : Math.min(savedJobs.length, 3)) - 1 && styles.jobRowBorder, { borderBottomColor: Brand.borderLight }]}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.jobTitle}>{job.title}</ThemedText>
                          {job.price ? <ThemedText type="caption" style={{ color: Brand.textSecondary }}>{job.price.toLocaleString()} MMK</ThemedText> : null}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
                      </View>
                    </Pressable>
                  ))}
                  {!expandedSaved && savedJobs.length > 3 && (
                    <Pressable onPress={() => setExpandedSaved(true)} style={[styles.seeAllRow, { borderTopColor: Brand.borderLight }]}>
                      <ThemedText style={styles.seeAllText}>+{savedJobs.length - 3} {t('userSearch.jobs')}</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}

                <View style={[styles.sectionCard, { backgroundColor: Brand.white }]}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.settings')}</ThemedText>
                  <View style={styles.settingRow}>
                    <ThemedText style={styles.settingLabel}>{t('profile.language')}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ThemedText type="caption" style={{ color: locale === 'en' ? Brand.primary : Brand.textSecondary, fontWeight: 700 }}>EN</ThemedText>
                      <Switch
                        value={locale === 'my'}
                        onValueChange={(v) => setLocale(v ? 'my' : 'en')}
                        trackColor={{ false: Brand.borderLight, true: Brand.primaryLight }}
                        thumbColor={locale === 'my' ? Brand.primary : Brand.textSecondary}
                      />
                      <ThemedText type="caption" style={{ color: locale === 'my' ? Brand.primary : Brand.textSecondary, fontWeight: 700 }}>MY</ThemedText>
                    </View>
                  </View>
                <View style={[styles.settingDivider, { backgroundColor: Brand.borderLight }]} />
                <View style={styles.settingRow}>
                  <ThemedText style={styles.settingLabel}>{t('profile.darkMode')}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sunny" size={16} color={isDark ? Brand.textSecondary : Brand.primary} />
                    <Switch
                      value={isDark}
                      onValueChange={handleToggleTheme}
                      trackColor={{ false: Brand.borderLight, true: Brand.primaryLight }}
                      thumbColor={isDark ? Brand.primary : Brand.textSecondary}
                    />
                    <Ionicons name="moon" size={16} color={isDark ? Brand.primary : Brand.textSecondary} />
                  </View>
                </View>
              <View style={[styles.settingDivider, { backgroundColor: Brand.borderLight }]} />
              <Pressable
                  style={styles.settingRow}
                  onPress={() => router.push('/onboarding')}
                >
                  <ThemedText style={styles.settingLabel}>Onboarding</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={Brand.textSecondary} />
                </Pressable>
              <View style={[styles.settingDivider, { backgroundColor: Brand.borderLight }]} />
              <Pressable
                  style={styles.settingRow}
                  onPress={() => router.push('/support')}
                >
                  <ThemedText style={styles.settingLabel}>{t('profile.helpSupport')}</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={Brand.textSecondary} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.deleteAccountBtn, { backgroundColor: Brand.dangerLight }]}
                onPress={() => {
                  Alert.alert(
                    t('profile.deleteAccount'),
                    t('profile.deleteWarning'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.delete'), style: 'destructive', onPress: async () => {
                        if (!user) return
                        await supabase.rpc('delete_user_account')
                        signOut()
                      }},
                    ],
                  )
                }}
              >
                <ThemedText style={[styles.deleteAccountText, { color: Brand.danger }]}>{t('profile.deleteAccount')}</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTitle: {
    padding: Spacing.one,
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,

    letterSpacing: -0.5,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  signOutText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing.five,
    paddingTop: Spacing.six,

    borderRadius: BorderRadius.lg,
    position: "relative",
    ...Shadow.card,
  },
  avatarWrap: {
    alignItems: "center",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,

    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,

  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 700,

  },
  nameText: {
    fontSize: FontSize.md,
    fontWeight: 700,

    marginTop: Spacing.three,
  },
  editBtn: {
    position: "absolute",
    top: Spacing.three,
    right: Spacing.three,
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
  },
  infoLabel: {
    fontWeight: 600,

  },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: 600,

  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.borderLight,
    marginHorizontal: Spacing.four,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    overflow: "hidden",
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: FontSize.base,

    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
  },
  jobRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,

  },
  jobTitle: {
    fontSize: FontSize.base,
    lineHeight: 24,
    fontWeight: 600,

  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
  },
  settingLabel: {
    fontWeight: 600,

    fontSize: FontSize.base,
  },
  settingValue: {
    fontWeight: 600,

    fontSize: FontSize.sm,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,

    marginHorizontal: Spacing.four,
  },
  deleteAccountBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: BottomTabInset,
  },
  deleteAccountText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,

  },
  seeAllText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
});
