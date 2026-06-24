import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import { Skeleton } from "@/components/skeleton";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { StarRating } from "@/components/star-rating";
import {
    BorderRadius,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";
import { EMPLOYMENT_TYPE_LABELS, SALARY_PERIOD_LABELS } from "@/lib/categories";
import { useBrand } from "@/contexts/ThemeContext";
import * as Location from "expo-location";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  reject_reason: string | null;
}

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  pending: { color: Brand.warning, bg: Brand.warningLight },
  accepted: { color: Brand.success, bg: Brand.successLight },
  rejected: { color: Brand.danger, bg: Brand.dangerLight },
};

export default function JobDetailScreen() {
  const Brand = useBrand();

  const { user } = useAuth();
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderPhone, setUploaderPhone] = useState("");
  const [uploaderAvatarUrl, setUploaderAvatarUrl] = useState<string | null>(
    null,
  );
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacanciesFilled, setVacanciesFilled] = useState(0);
  const [applying, setApplying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myApplication, setMyApplication] = useState<Applicant | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [reviewedUserIds, setReviewedUserIds] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

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

  const loadReviews = async () => {
    if (!job || !user) return
    const { data } = await supabase
      .from('reviews')
      .select('reviewee_id')
      .eq('job_id', job.id)
      .eq('reviewer_id', user.id)
    setReviewedUserIds(new Set((data ?? []).map((r: any) => r.reviewee_id)))
  }

  const openReviewModal = (targetId: string, targetName: string) => {
    setReviewTarget({ id: targetId, name: targetName })
    setReviewRating(0)
    setReviewComment('')
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!job || !user || !reviewTarget || reviewRating === 0) return
    setSubmittingReview(true)
    await supabase.from('reviews').insert({
      job_id: job.id,
      reviewer_id: user.id,
      reviewee_id: reviewTarget.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    })
    setSubmittingReview(false)
    setShowReviewModal(false)
    setReviewTarget(null)
    setReviewRating(0)
    setReviewComment('')
    loadReviews()
  }

  const handleReport = () => {
    if (!job || !user) return
    Alert.alert(t('jobDetail.reportTitle'), t('jobDetail.reportPrompt'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('jobDetail.reportSpam'), onPress: () => submitReport(t('jobDetail.reportSpam')) },
      { text: t('jobDetail.reportInappropriate'), onPress: () => submitReport(t('jobDetail.reportInappropriate')) },
      { text: t('jobDetail.reportFake'), onPress: () => submitReport(t('jobDetail.reportFake')) },
      { text: t('jobDetail.reportWrongCategory'), onPress: () => submitReport(t('jobDetail.reportWrongCategory')) },
    ])
  }

  const submitReport = async (reason: string) => {
    if (!job || !user) return
    await supabase.from('reports').insert({
      job_id: job.id,
      reporter_id: user.id,
      reason,
    })
  }

  const handleShare = async () => {
    if (!job) return
    await Share.share({
      message: `Check out this job on LocJobs: ${job.title}`,
    })
  }

  const loadJob = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setJob(data as any);
        const uRes = await supabase
          .from("users")
          .select("display_name, phone, avatar_url")
          .eq("id", data.uploader_id)
          .single();
        if (uRes.data) {
          setUploaderName(uRes.data.display_name || "");
          setUploaderPhone(uRes.data.phone || "");
          setUploaderAvatarUrl(uRes.data.avatar_url || null);
        }
        const { data: apps } = await supabase
          .from("applications")
          .select("searcher_id, status, message, reject_reason")
          .eq("job_id", id);
        const applicantList: Applicant[] = [];
        let filled = 0;
        if (apps && apps.length > 0) {
          const sIds = apps.map((a: any) => a.searcher_id);
          const { data: users } = await supabase
            .from("users")
            .select("id, display_name, phone, avatar_url")
            .in("id", sIds);
          const userMap: Record<string, any> = {};
          for (const u of (users ?? []) as any) userMap[u.id] = u;
          for (const a of apps as any[]) {
            const u = userMap[a.searcher_id];
            const applicant: Applicant = {
              id: a.searcher_id,
              name: u?.display_name || "",
              phone: u?.phone || "",
              avatarUrl: u?.avatar_url || null,
              status: a.status,
              message: a.message || null,
              reject_reason: a.reject_reason || null,
            };
            applicantList.push(applicant);
            if (applicant.status === "accepted") filled++;
            if (a.searcher_id === user?.id) setMyApplication(applicant);
          }
          setVacanciesFilled(filled);
        } else {
          setVacanciesFilled(0);
          setMyApplication(null);
        }
        setApplicants(applicantList);
      }
      loadSavedJobs()
      loadReviews()
    } catch (error) {
      console.error('Failed to load job', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [loadJob]),
  );

  useEffect(() => {
    if (!id) return;
    const sub = supabase
      .channel(`job-applications-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `job_id=eq.${id}`,
        },
        () => {
          loadJob();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [id]);

  const handleApply = async (message?: string) => {
    if (!job || !user) return;
    setApplying(true);
    setError(null);
    const { error: applyErr } = await supabase
      .from("applications")
      .insert({ job_id: job.id, searcher_id: user.id, message: message || null });
    if (applyErr) {
      setError(applyErr.message);
      setApplying(false);
      return;
    }
    setApplying(false);
    setShowApplyModal(false);
    setApplyMessage('');
    loadJob();
  };

  const handleAccept = async (applicationUserId: string) => {
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", job.id)
      .eq("searcher_id", applicationUserId)
      .single();
    if (!app) return;
    const { error } = await supabase.rpc("accept_application", {
      p_application_id: (app as any).id,
    });
    if (error) {
      setError(error.message);
      return;
    }
    loadJob();
  };

  const handleReject = async (applicationUserId: string, reason?: string) => {
    if (!job) return
    if (!reason) {
      Alert.alert(t('jobDetail.rejectTitle'), t('jobDetail.rejectPrompt'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('jobDetail.rejectNotAvailable'), onPress: () => handleReject(applicationUserId, t('jobDetail.rejectNotAvailable')) },
        { text: t('jobDetail.rejectNotQualified'), onPress: () => handleReject(applicationUserId, t('jobDetail.rejectNotQualified')) },
        { text: t('jobDetail.rejectPositionFilled'), onPress: () => handleReject(applicationUserId, t('jobDetail.rejectPositionFilled')) },
        { text: t('jobDetail.rejectOther'), onPress: () => handleReject(applicationUserId, t('jobDetail.rejectOther')) },
      ])
      return
    }
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", job.id)
      .eq("searcher_id", applicationUserId)
      .single();
    if (!app) return;
    const { error } = await supabase
      .from("applications")
      .update({ status: 'rejected', reject_reason: reason })
      .eq("id", (app as any).id);
    if (error) {
      setError(error.message);
      return;
    }
    loadJob();
  };

  const handleComplete = async () => {
    if (!job) return;
    setCompleting(true);
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", job.id);
    if (updateErr) setError(updateErr.message);
    // check verification for uploader and accepted applicants
    await supabase.rpc("check_user_verification", { p_user_id: job.uploader_id });
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("searcher_id")
      .eq("job_id", job.id)
      .eq("status", "accepted");
    if (acceptedApps) {
      for (const app of acceptedApps as any[]) {
        await supabase.rpc("check_user_verification", { p_user_id: app.searcher_id });
      }
    }
    setCompleting(false);
    loadJob();
  };

  const handleDirections = async () => {
    if (!job?.lat || !job?.lng) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const userLoc = await Location.getCurrentPositionAsync({});
    const url = `https://www.google.com/maps/dir/${userLoc.coords.latitude},${userLoc.coords.longitude}/${job.lat},${job.lng}`;
    Linking.openURL(url);
  };

  const hasLocation = job?.lat && job?.lng;
  const isUploader = user?.id === job?.uploader_id;
  const isTaken = job?.status === "full" || job?.status === "completed";
  const isCompleted = job?.status === "completed";
  const vacanciesTotal = job?.vacancies || 1;
  const canApply = !isUploader && job?.status === "open" && !myApplication;
  const canComplete = isUploader && !isCompleted;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={["top"]}>
        <View style={styles.header}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width="50%" height={22} />
          <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
            <Skeleton width={36} height={36} borderRadius={18} />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton width="100%" height={220} borderRadius={BorderRadius.md} />
          <View style={{ height: Spacing.four }} />
          <Skeleton width="80%" height={22} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="60%" height={14} />
          <View style={{ height: Spacing.two }} />
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Skeleton width={80} height={24} />
            <Skeleton width={80} height={24} />
            <Skeleton width={60} height={24} />
          </View>
          <View style={{ height: Spacing.four }} />
          <View style={{ width: '100%', height: 1, backgroundColor: Brand.border }} />
          <View style={{ height: Spacing.four }} />
          <Skeleton width={100} height={14} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="100%" height={14} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="90%" height={14} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="80%" height={14} />
          <View style={{ height: Spacing.four }} />
          <View style={{ width: '100%', height: 1, backgroundColor: Brand.border }} />
          <View style={{ height: Spacing.four }} />
          <Skeleton width={80} height={14} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="70%" height={14} />
          <View style={{ height: Spacing.two }} />
          <Skeleton width="100%" height={150} borderRadius={BorderRadius.md} />
          <View style={{ height: Spacing.four }} />
          <View style={{ width: '100%', height: 1, backgroundColor: Brand.border }} />
          <View style={{ height: Spacing.four }} />
          <Skeleton width={100} height={14} />
          <View style={{ height: Spacing.two }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <Skeleton width="30%" height={14} />
            <Skeleton width={60} height={24} />
            <Skeleton width={60} height={24} />
          </View>
          <View style={{ height: Spacing.four }} />
          <Skeleton width="100%" height={56} borderRadius={BorderRadius.md} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
			<ThemedText type="small" style={{ color: Brand.textSecondary }}>
				{t('jobDetail.jobNotFound')}
			</ThemedText>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
            <Ionicons name="chevron-back" size={22} color={Brand.primary} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
          <Pressable
            style={[styles.flagBtn, { backgroundColor: Brand.borderLight }]}
            onPress={handleReport}
            hitSlop={8}
          >
            <Ionicons name="flag-outline" size={18} color={Brand.textSecondary} />
          </Pressable>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: Brand.primaryLight }]}
            onPress={handleShare}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={18} color={Brand.primary} />
          </Pressable>
          {isUploader && (
            <>
              <Pressable
                style={[styles.editBtn, { backgroundColor: Brand.primaryLight }]}
                onPress={() => router.push(`/post?id=${job.id}` as any)}
              >
                <Ionicons name="pencil" size={18} color={Brand.primary} />
              </Pressable>
              <Pressable
                style={[styles.deleteBtn, { backgroundColor: Brand.dangerLight }]}
                onPress={() => {
                  Alert.alert(
                    t('jobDetail.deleteJob'),
                    t('common.deleteWarning'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.delete'), style: 'destructive', onPress: async () => {
                        await supabase.from('jobs').update({ deleted: true }).eq('id', job.id)
                        router.back()
                      }},
                    ],
                  )
                }}
              >
                <Ionicons name="trash-outline" size={18} color={Brand.danger} />
              </Pressable>
            </>
          )}
          <Pressable
            style={[styles.headerSaveBtn, { backgroundColor: Brand.primaryLight }]}
            onPress={() => toggleSave(job.id)}
            hitSlop={8}
          >
            <Ionicons
              name={savedJobIds.has(job.id) ? "heart" : "heart-outline"}
              size={22}
              color={savedJobIds.has(job.id) ? Brand.danger : Brand.textSecondary}
            />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>{job.title}</ThemedText>
          <View style={styles.titleMeta}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    job.status === "open"
                      ? Brand.successLight
                      : job.status === "full"
                        ? Brand.warningLight
                        : job.status === "completed"
                          ? Brand.primaryLight
                          : Brand.dangerLight,
                },
              ]}
            >
              <ThemedText
                type="caption"
                style={{
                  fontWeight: 700,
                  color:
                    job.status === "open"
                      ? Brand.success
                      : job.status === "full"
                        ? Brand.warning
                        : job.status === "completed"
                          ? Brand.primary
                          : Brand.danger,
                }}
              >
                {job.status === "full" ? "Full" : job.status}
              </ThemedText>
            </View>
            <ThemedText type="caption">{job.work_type}</ThemedText>
            {job.employment_type && (
              <View style={{ backgroundColor: Brand.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginTop: 4 }}>
                <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 600 }}>{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</ThemedText>
              </View>
            )}
          <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
            {vacanciesFilled}/{vacanciesTotal} {t('jobDetail.filled')}
          </ThemedText>
          </View>
          {job.price && !job.employment_type && (
            <ThemedText
              type="price"
              style={{ marginTop: 8, padding: Spacing.one }}
            >
              {job.price.toLocaleString()} MMK
            </ThemedText>
          )}
          {job.salary_min && job.employment_type && (
            <ThemedText
              type="price"
              style={{ marginTop: 8, padding: Spacing.one }}
            >
              {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} MMK{job.salary_period ? `/${SALARY_PERIOD_LABELS[job.salary_period] || ''}` : ''}
            </ThemedText>
          )}
        </View>

        {job.image_urls && job.image_urls.length > 0 && (
          <View style={{ marginBottom: Spacing.four }}>
            <FlatList
              data={job.image_urls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get("window").width - Spacing.four * 2))
                setGalleryIndex(idx)
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{
                    width: Dimensions.get("window").width - Spacing.four * 2,
                    height: 220,
                    borderRadius: BorderRadius.md,
                  }}
                  resizeMode="cover"
                />
              )}
              keyExtractor={(_, i) => String(i)}
            />
            {job.image_urls.length > 1 && (
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: Spacing.two }}>
                {job.image_urls.map((_: string, i: number) => (
                  <View
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === galleryIndex ? Brand.primary : Brand.border,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {job.description && (
          <View style={[styles.card, { backgroundColor: Brand.white }]}>
            <ThemedText
              type="caption"
              style={{
                fontWeight: 600,

                marginBottom: 6,
              }}
            >
              Description
            </ThemedText>
            <ThemedText style={{ lineHeight: 22, color: Brand.text }}>
              {job.description}
            </ThemedText>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: Brand.white }]}>
          <ThemedText
            type="caption"
            style={{
              fontWeight: 600,

              marginBottom: 8,
            }}
          >
            Location
          </ThemedText>
          {hasLocation ? (
            <>
              <ThemedText style={styles.infoLine}>
                {job.city ? `${job.city}, ` : ""}
                {job.region || ""}
              </ThemedText>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: job.lat,
                  longitude: job.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: job.lat, longitude: job.lng }}
                  title={job.title}
                />
              </MapView>
              <Pressable style={[styles.directionsBtn, { backgroundColor: Brand.primaryLight }]} onPress={handleDirections}>
                <ThemedText style={styles.directionsBtnText}>
                  {t('jobDetail.getDirections')}
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <ThemedText style={styles.infoLine}>Remote</ThemedText>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: Brand.white }]}>
          <ThemedText
            type="caption"
            style={{
              fontWeight: 600,

              marginBottom: 8,
            }}
          >
            Uploader
          </ThemedText>
          <Pressable
            onPress={() => router.push(job.uploader_id === user?.id ? '/(tabs)/profile' : `/user/${job.uploader_id}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.three,
            }}
          >
            {uploaderAvatarUrl ? (
              <Image
                source={{ uri: uploaderAvatarUrl }}
                style={styles.applicantAvatar}
              />
            ) : (
              <View
                style={[
                  styles.applicantAvatarPlaceholder,
                  { backgroundColor: Brand.primaryLight },
                ]}
              >
                <ThemedText style={styles.applicantAvatarText}>
                  {(uploaderName.charAt(0) || "?").toUpperCase()}
                </ThemedText>
              </View>
            )}
            <View>
              <ThemedText style={[styles.infoLine, { color: Brand.primary }]}>
                {uploaderName || "Anonymous"}
              </ThemedText>
              {uploaderPhone && (
                <ThemedText
                  type="caption"
                  style={{ color: Brand.textSecondary }}
                >
                  {uploaderPhone}
                </ThemedText>
              )}
            </View>
          </Pressable>
        </View>

        {myApplication && !isUploader && (
          <View style={[styles.card, { backgroundColor: Brand.white }]}>
            <ThemedText
              type="caption"
              style={{
                fontWeight: 600,

                marginBottom: 6,
              }}
            >
              My Application
            </ThemedText>
            <View
              style={[
                styles.miniBadge,
                {
                  backgroundColor: STATUS_COLOR[myApplication.status].bg,
                  alignSelf: "flex-start",
                },
              ]}
            >
              <ThemedText
                type="caption"
                style={{
                  fontWeight: 700,
                  color: STATUS_COLOR[myApplication.status].color,
                }}
              >
                {myApplication.status.charAt(0).toUpperCase() +
                  myApplication.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        )}

        {applicants.length > 0 && (
          <View style={[styles.card, { backgroundColor: Brand.white }]}>
            <ThemedText
              type="caption"
              style={{
                fontWeight: 600,

                marginBottom: 8,
              }}
            >
              Applicants ({applicants.length})
            </ThemedText>
            {applicants.map((a, i) => {
              const sc = STATUS_COLOR[a.status];
              return (
                <View
                  key={i}
                  style={{
                    marginBottom: i < applicants.length - 1 ? Spacing.three : 0,
                  }}
                >
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
                          gap: Spacing.two,
                        }}
                      >
                        {a.avatarUrl ? (
                          <Image
                            source={{ uri: a.avatarUrl }}
                            style={styles.applicantAvatar}
                          />
                        ) : (
                          <View style={[styles.applicantAvatarPlaceholder, { backgroundColor: Brand.primaryLight }]}>
                            <ThemedText style={styles.applicantAvatarText}>
                              {(a.name.charAt(0) || "?").toUpperCase()}
                            </ThemedText>
                          </View>
                        )}
                        <Pressable onPress={() => router.push(a.id === user?.id ? '/(tabs)/profile' : `/user/${a.id}`)}>
                          <ThemedText
                            style={[styles.infoLine, { color: Brand.primary }]}
                          >
                            {a.name || "Anonymous"}
                          </ThemedText>
                        </Pressable>
                        <View
                          style={[styles.miniBadge, { backgroundColor: sc.bg }]}
                        >
                          <ThemedText
                            type="caption"
                            style={{ fontWeight: 700, color: sc.color }}
                          >
                            {a.status.charAt(0).toUpperCase() +
                              a.status.slice(1)}
                          </ThemedText>
                        </View>
                      </View>
                      {a.phone ? (
                        <ThemedText
                          type="caption"
                          style={{ color: Brand.textSecondary, marginTop: 2 }}
                        >
                          {a.phone}
                        </ThemedText>
                      ) : null}
                      {a.message && isUploader && (
                        <ThemedText
                          type="caption"
                          style={{ color: Brand.textSecondary, marginTop: 4, fontStyle: 'italic' }}
                          numberOfLines={2}
                        >
                          "{a.message}"
                        </ThemedText>
                      )}
                      {a.reject_reason && a.status === "rejected" && (
                        <ThemedText
                          type="caption"
                          style={{ color: Brand.danger, marginTop: 4 }}
                        >
                          Reason: {a.reject_reason}
                        </ThemedText>
                      )}
                    </View>
                    {isUploader && a.status === "pending" && (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <Pressable
                          onPress={() => handleAccept(a.id)}
                          style={[styles.acceptBtn, { backgroundColor: Brand.successLight }]}
                        >
                          <ThemedText style={styles.acceptBtnText}>
                      {t('jobDetail.accept')}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.rejectBtn, { backgroundColor: Brand.dangerLight }]}
                    onPress={() => handleReject(a.id)}
                  >
                    <ThemedText style={styles.rejectBtnText}>
                      {t('jobDetail.reject')}
                    </ThemedText>
                        </Pressable>
                      </View>
                    )}
                    {isUploader && a.status !== "pending" && (
                      <Pressable
                        onPress={() => router.push(`/chat/${job.id}/${a.id}`)}
                        style={[styles.chatBtn, { backgroundColor: Brand.primaryLight }]}
                      >
                        <ThemedText style={styles.chatBtnText}>{t('tabs.chat')}</ThemedText>
                      </Pressable>
                    )}
                    {isCompleted && isUploader && a.status === "accepted" && !reviewedUserIds.has(a.id) && (
                      <Pressable
                        onPress={() => openReviewModal(a.id, a.name)}
                        style={[styles.reviewBtn, { backgroundColor: Brand.warningLight }]}
                      >
                        <ThemedText style={styles.reviewBtnText}>Review</ThemedText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {isCompleted && !isUploader && myApplication?.status === "accepted" && !reviewedUserIds.has(job?.uploader_id ?? '') && (
          <Pressable
            onPress={() => openReviewModal(job.uploader_id, uploaderName || 'Uploader')}
            style={[styles.reviewFullBtn, { backgroundColor: Brand.warningLight }]}
          >
            <ThemedText style={styles.reviewFullBtnText}>Leave a Review for {uploaderName || 'Uploader'}</ThemedText>
          </Pressable>
        )}

        {canApply && (
          <Pressable
            style={[styles.primaryBtn, applying && { opacity: 0.6 }, { backgroundColor: Brand.primary }]}
            onPress={() => setShowApplyModal(true)}
            disabled={applying}
          >
            {applying ? <ActivityIndicator size="small" color={Brand.white} /> : <ThemedText style={styles.primaryBtnText}>{t('jobDetail.apply')}</ThemedText>}
          </Pressable>
        )}

        {canComplete && (
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: Brand.success },
              completing && { opacity: 0.6 },, { backgroundColor: Brand.primary }]}
            onPress={handleComplete}
            disabled={completing}
          >
            {completing ? <ActivityIndicator size="small" color={Brand.white} /> : <ThemedText style={styles.primaryBtnText}>Mark as Completed</ThemedText>}
          </Pressable>
        )}

        {error && (
          <ThemedText
            type="small"
            style={{
              textAlign: "center",
              marginTop: Spacing.three,
            }}
          >
            {error}
          </ThemedText>
        )}
      </ScrollView>

      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: Brand.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: Brand.white }]}>
            <ThemedText style={styles.modalTitle}>Rate {reviewTarget?.name || 'User'}</ThemedText>
            <View style={{ alignItems: 'center', marginBottom: Spacing.four }}>
              <StarRating rating={reviewRating} size={36} interactive onChange={setReviewRating} />
            </View>
            <TextInput
              style={[styles.modalInput, { borderColor: Brand.border }]}
              placeholder="Write a comment (optional)"
              placeholderTextColor={Brand.textSecondary}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three }}>
              <Pressable
                onPress={() => setShowReviewModal(false)}
                style={[styles.modalBtn, { backgroundColor: Brand.border }]}
              >
                <ThemedText style={[styles.modalBtnText, { color: Brand.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
                style={[
                  styles.modalBtn,
                  { backgroundColor: Brand.primary },
                  (reviewRating === 0 || submittingReview) && { opacity: 0.6 },
                ]}
              >
                {submittingReview ? <ActivityIndicator size="small" color={Brand.white} /> : <ThemedText style={styles.modalBtnText}>Submit</ThemedText>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showApplyModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: Brand.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: Brand.white }]}>
            <ThemedText style={styles.modalTitle}>{t('jobDetail.applyingModalTitle')}</ThemedText>
            <ThemedText type="small" style={{ color: Brand.textSecondary, textAlign: 'center', marginBottom: Spacing.four }}>
                {t('jobDetail.applyingModalHelper')}
            </ThemedText>
            <TextInput
              style={[styles.modalInput, { borderColor: Brand.border }]}
                placeholder={t('jobDetail.applyingModalPlaceholder')}
              placeholderTextColor={Brand.textSecondary}
              value={applyMessage}
              onChangeText={setApplyMessage}
              multiline
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three }}>
              <Pressable
                onPress={() => { setShowApplyModal(false); setApplyMessage('') }}
                style={[styles.modalBtn, { backgroundColor: Brand.border }]}
              >
                <ThemedText style={[styles.modalBtnText, { color: Brand.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleApply(applyMessage)}
                disabled={applying}
                style={[
                  styles.modalBtn,
                  { backgroundColor: Brand.primary },
                  applying && { opacity: 0.6 },
                ]}
              >
                {applying ? <ActivityIndicator size="small" color={Brand.white} /> : <ThemedText style={styles.modalBtnText}>Send Application</ThemedText>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
  },
  titleSection: {
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,

    padding: Spacing.one,
    letterSpacing: -0.5,
  },
  titleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    ...Shadow.card,
  },
  infoLine: {
    fontSize: FontSize.base,

  },
  detailImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
  },
  map: {
    width: "100%",
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.two,
  },
  directionsBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  directionsBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.three,
    ...Shadow.elevated,
  },
  primaryBtnText: {
    fontSize: FontSize.base,
    fontWeight: 700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  flagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  headerSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },
  chatBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  chatBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  acceptBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  rejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  rejectBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  applicantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  applicantAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },
  applicantAvatarText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  reviewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginLeft: 6,
  },
  reviewBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  reviewFullBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  reviewFullBtnText: {
    fontSize: FontSize.base,
    fontWeight: 700,
  },
  modalOverlay: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.five,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: 700,

    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  modalInput: {
    borderWidth: 1,

    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    fontSize: FontSize.base,

    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalBtnText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
});
