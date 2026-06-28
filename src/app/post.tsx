import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PickerModal } from "@/components/picker-modal";
import { ThemedText } from "@/components/themed-text";
import { Toast } from "@/components/toast";
import {
    BorderRadius,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, EMPLOYMENT_TYPES, SALARY_PERIODS, EMPLOYMENT_TYPE_LABELS, SALARY_PERIOD_LABELS } from "@/lib/categories";
import { REGIONS } from "@/lib/regions";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/contexts/ThemeContext";

const WORK_TYPES = ["onsite", "remote", "hybrid"] as const;

export default function PostJobScreen() {
  const Brand = useBrand();

  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [workType, setWorkType] = useState<string>("onsite");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [vacancies, setVacancies] = useState(1);
  const [useExactLocation, setUseExactLocation] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [category, setCategory] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("");
  const [showEmployTypePicker, setShowEmployTypePicker] = useState(false);
  const [showSalaryPeriodPicker, setShowSalaryPeriodPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const regionList = Object.keys(REGIONS).sort();
  const cityList = region
    ? (REGIONS[region] || []).sort()
    : Object.values(REGIONS).flat().sort();

  useEffect(() => {
    if (!isEditing || !id) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        const j = data as any;
        setTitle(j.title);
        setDescription(j.description || "");
        setPrice(j.price ? String(j.price) : "");
        setWorkType(j.work_type);
        setCity(j.city || "");
        setRegion(j.region || "");
        if (j.lat && j.lng) {
          setLat(j.lat);
          setLng(j.lng);
          setUseExactLocation(true);
        }
        setImages(j.image_urls || []);
        setVacancies(j.vacancies || 1);
        setCategory(j.category || "");
        setEmploymentType(j.employment_type || "");
        setSalaryMin(j.salary_min ? String(j.salary_min) : "");
        setSalaryMax(j.salary_max ? String(j.salary_max) : "");
        setSalaryPeriod(j.salary_period || "");
      }
    })();
  }, [isEditing, id]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;
    const uris = result.assets.map((a) => a.uri);
    setNewImageUris((prev) => [...prev, ...uris]);
  };

  const handleUseCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location Permission", "Location permission is needed to use your current location. Please enable it in Settings.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLat(loc.coords.latitude);
    setLng(loc.coords.longitude);
    setUseExactLocation(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required";

    const priceNum = price ? parseInt(price, 10) : NaN;
    if (price && (isNaN(priceNum) || priceNum <= 0)) errors.price = "Enter a valid price";

    const minNum = salaryMin ? parseInt(salaryMin, 10) : NaN;
    const maxNum = salaryMax ? parseInt(salaryMax, 10) : NaN;
    if (salaryMin && (isNaN(minNum) || minNum <= 0)) errors.salaryMin = "Enter a valid minimum salary";
    if (salaryMax && (isNaN(maxNum) || maxNum <= 0)) errors.salaryMax = "Enter a valid maximum salary";
    if (salaryMin && salaryMax && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      errors.salaryMin = "Min should be less than max";
    }

    if ((workType === "onsite" || workType === "hybrid") && !region) errors.region = "Region is required";
    if ((workType === "onsite" || workType === "hybrid") && !city) errors.city = "City is required";

    return errors;
  };

  const clearError = (field: string) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    const errors = validate();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      Alert.alert("Validation Error", Object.values(errors)[0]);
      return;
    }

    setSubmitting(true);
    setError(null);

    let uploadedUrls: string[] = [];
    for (const uri of newImageUris) {
      try {
        const ext = (uri.split(".").pop() || "jpg").toLowerCase();
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) continue;
        const uploadRes = await FileSystem.uploadAsync(
          `https://axuroixwxueufgvodnde.supabase.co/storage/v1/object/job-images/${fileName}?upsert=true`,
          uri,
          {
            httpMethod: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": mime,
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          },
        );
        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          uploadedUrls.push(
            `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-images/${fileName}`,
          );
        }
      } catch (e) { console.error('Image upload failed', e) }
    }
    const allImageUrls = [...images, ...uploadedUrls];

    const params: any = {
      p_title: title,
      p_uploader_id: user.id,
    };
    if (description) params.p_description = description;
    if (price) params.p_price = parseInt(price, 10);
    if (workType) params.p_work_type = workType;
    if (city) params.p_city = city;
    if (region) params.p_region = region;
    if (category) params.p_category = category;
    if (employmentType) params.p_employment_type = employmentType;
    if (salaryMin) params.p_salary_min = parseInt(salaryMin, 10);
    if (salaryMax) params.p_salary_max = parseInt(salaryMax, 10);
    if (salaryPeriod) params.p_salary_period = salaryPeriod;
    if (lat && lng) {
      params.p_lat = lat;
      params.p_lng = lng;
    }
    if (allImageUrls.length > 0) params.p_image_urls = allImageUrls;
    params.p_vacancies = vacancies;

    if (isEditing) {
      const updates: any = {
        title,
        description: description || null,
        price: price ? parseInt(price, 10) : null,
        work_type: workType,
        city: city || null,
        region: region || null,
        vacancies,
        category: category || null,
        employment_type: employmentType || null,
        salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
        salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
        salary_period: salaryPeriod || null,
      };
      if (lat && lng) {
        updates.lat = lat;
        updates.lng = lng;
      }
      if (allImageUrls.length > 0) updates.image_urls = allImageUrls;
      const { error: updateErr } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", id);
      if (updateErr) setError(updateErr.message);
      else {
        setToast({ visible: true, message: isEditing ? 'Job updated!' : 'Job posted!', type: 'success' });
        setTimeout(() => router.back(), 1200);
      }
    } else {
      const { data, error: rpcErr } = await supabase.rpc("post_job", params);
      if (rpcErr) setError(rpcErr.message);
      else {
        setToast({ visible: true, message: 'Job posted!', type: 'success' });
        setTimeout(() => router.back(), 1200);
      }
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
            <Ionicons name="chevron-down" size={24} color={Brand.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEditing ? "Edit Job" : "Post a Job"}
          </ThemedText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {error && (
            <ThemedText
              type="small"
              style={{
                textAlign: "center",
                marginBottom: Spacing.three,
              }}
            >
              {error}
            </ThemedText>
          )}

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Title *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: Brand.white, borderColor: Brand.borderLight, color: Brand.text }]}
              placeholder="Job title"
              placeholderTextColor={Brand.placeholder}
              value={title}
              onChangeText={(v) => { setTitle(v); clearError("title"); }}
            />
            {validationErrors.title && (
              <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.title}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: "top" }, { backgroundColor: Brand.white, borderColor: Brand.borderLight, color: Brand.text }]}
              placeholder="Describe the job..."
              placeholderTextColor={Brand.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Price (MMK)
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: Brand.white, borderColor: Brand.borderLight, color: Brand.text }]}
              placeholder="e.g. 50000"
              placeholderTextColor={Brand.placeholder}
              value={price}
              onChangeText={(v) => { setPrice(v.replace(/\D/g, '')); clearError("price"); }}
              keyboardType="number-pad"
            />
            {validationErrors.price && (
              <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.price}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Vacancies (how many people needed)
            </ThemedText>
            <View style={styles.slotsRow}>
              <Pressable
                style={[styles.slotBtn, vacancies <= 1 && { opacity: 0.3 }, { backgroundColor: Brand.primaryLight }]}
                onPress={() => setVacancies(Math.max(1, vacancies - 1))}
                disabled={vacancies <= 1}
              >
                <ThemedText style={styles.slotBtnText}>-</ThemedText>
              </Pressable>
              <ThemedText style={styles.slotValue}>{vacancies}</ThemedText>
              <Pressable
                style={[styles.slotBtn, vacancies >= 50 && { opacity: 0.3 }, { backgroundColor: Brand.primaryLight }]}
                onPress={() => setVacancies(Math.min(50, vacancies + 1))}
                disabled={vacancies >= 50}
              >
                <ThemedText style={styles.slotBtnText}>+</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Work Type
            </ThemedText>
            <View style={styles.pillRow}>
              {WORK_TYPES.map((wt) => (
                <Pressable
                  key={wt}
                  style={[styles.pill, workType === wt && styles.pillActive, { backgroundColor: Brand.white, borderColor: Brand.borderLight }, { backgroundColor: Brand.primary, borderColor: Brand.primary }]}
                  onPress={() => setWorkType(wt)}
                >
                  <ThemedText
                    type="caption"
                    style={[
                      styles.pillText,
                      workType === wt && styles.pillTextActive,
                    ]}
                  >
                    {wt}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Category
            </ThemedText>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <ThemedText
                type="small"
                style={!category ? { color: Brand.placeholder } : {}}
              >
                {category || "Select category"}
              </ThemedText>
            </Pressable>
            <PickerModal
              visible={showCategoryPicker}
              title="Select Category"
              options={[...CATEGORIES]}
              selected={category}
              onSelect={setCategory}
              onClose={() => setShowCategoryPicker(false)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Employment Type
            </ThemedText>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
              onPress={() => setShowEmployTypePicker(true)}
            >
              <ThemedText
                type="small"
                style={!employmentType ? { color: Brand.placeholder } : {}}
              >
                {employmentType ? EMPLOYMENT_TYPE_LABELS[employmentType] : "Select type"}
              </ThemedText>
            </Pressable>
            <PickerModal
              visible={showEmployTypePicker}
              title="Employment Type"
              options={["", ...EMPLOYMENT_TYPES.map((t) => EMPLOYMENT_TYPE_LABELS[t])]}
              selected={employmentType ? EMPLOYMENT_TYPE_LABELS[employmentType] : ""}
              onSelect={(val) => {
                if (!val) { setEmploymentType(""); return }
                const key = Object.entries(EMPLOYMENT_TYPE_LABELS).find(([, v]) => v === val)?.[0] || ""
                setEmploymentType(key)
              }}
              onClose={() => setShowEmployTypePicker(false)}
            />
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" style={styles.label}>
                Salary Min (MMK)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: Brand.white, borderColor: Brand.borderLight, color: Brand.text }]}
                placeholder="e.g. 300000"
                placeholderTextColor={Brand.placeholder}
                value={salaryMin}
                onChangeText={(v) => { setSalaryMin(v.replace(/\D/g, '')); clearError("salaryMin"); clearError("salaryMax"); }}
                keyboardType="number-pad"
              />
              {validationErrors.salaryMin && (
                <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.salaryMin}</ThemedText>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" style={styles.label}>
                Salary Max (MMK)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: Brand.white, borderColor: Brand.borderLight, color: Brand.text }]}
                placeholder="e.g. 800000"
                placeholderTextColor={Brand.placeholder}
                value={salaryMax}
                onChangeText={(v) => { setSalaryMax(v.replace(/\D/g, '')); clearError("salaryMax"); clearError("salaryMin"); }}
                keyboardType="number-pad"
              />
              {validationErrors.salaryMax && (
                <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.salaryMax}</ThemedText>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Salary Period
            </ThemedText>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
              onPress={() => setShowSalaryPeriodPicker(true)}
            >
              <ThemedText
                type="small"
                style={!salaryPeriod ? { color: Brand.placeholder } : {}}
              >
                {salaryPeriod ? SALARY_PERIOD_LABELS[salaryPeriod] : "Select period"}
              </ThemedText>
            </Pressable>
            <PickerModal
              visible={showSalaryPeriodPicker}
              title="Salary Period"
              options={["", ...SALARY_PERIODS.map((p) => SALARY_PERIOD_LABELS[p])]}
              selected={salaryPeriod ? SALARY_PERIOD_LABELS[salaryPeriod] : ""}
              onSelect={(val) => {
                if (!val) { setSalaryPeriod(""); return }
                const key = Object.entries(SALARY_PERIOD_LABELS).find(([, v]) => v === val)?.[0] || ""
                setSalaryPeriod(key)
              }}
              onClose={() => setShowSalaryPeriodPicker(false)}
            />
          </View>

          {(workType === "onsite" || workType === "hybrid") && (
            <>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={styles.label}>
                  Region
                </ThemedText>
                <Pressable
                  style={[styles.pickerBtn, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
                  onPress={() => setShowRegionPicker(true)}
                >
                  <ThemedText
                    type="small"
                    style={!region ? { color: Brand.placeholder } : {}}
                  >
                    {region || "Select region"}
                  </ThemedText>
                </Pressable>
                {validationErrors.region && (
                  <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.region}</ThemedText>
                )}
                <PickerModal
                  visible={showRegionPicker}
                  title="Select Region"
                  options={regionList}
                  selected={region}
                  onSelect={(v) => {
                    setRegion(v);
                    setCity("");
                  }}
                  onClose={() => setShowRegionPicker(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="caption" style={styles.label}>
                  City
                </ThemedText>
                <Pressable
                  style={[styles.pickerBtn, { backgroundColor: Brand.white, borderColor: Brand.borderLight }]}
                  onPress={() => setShowCityPicker(true)}
                >
                  <ThemedText
                    type="small"
                    style={!city ? { color: Brand.placeholder } : {}}
                  >
                    {city || "Select city"}
                  </ThemedText>
                </Pressable>
                {validationErrors.city && (
                  <ThemedText type="caption" style={{ color: '#E53935', marginTop: 4 }}>{validationErrors.city}</ThemedText>
                )}
                <PickerModal
                  visible={showCityPicker}
                  title="Select City"
                  options={cityList}
                  selected={city}
                  onSelect={setCity}
                  onClose={() => setShowCityPicker(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <ThemedText type="caption" style={styles.label}>
                    Use exact location
                  </ThemedText>
                  <Switch
                    value={useExactLocation}
                    onValueChange={setUseExactLocation}
                    trackColor={{
                      false: Brand.borderLight,
                      true: Brand.primaryLight,
                    }}
                    thumbColor={
                      useExactLocation ? Brand.primary : Brand.textSecondary
                    }
                  />
                </View>
                {useExactLocation && (
                  <Pressable
                    style={[styles.locationBtn, { backgroundColor: Brand.primaryLight }]}
                    onPress={handleUseCurrentLocation}
                  >
                    <ThemedText style={styles.locationBtnText}>
                      Use My Current Location
                    </ThemedText>
                  </Pressable>
                )}
                {lat && lng && (
                  <ThemedText
                    type="caption"
                    style={{ color: Brand.textSecondary, marginTop: 4 }}
                  >
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </ThemedText>
                )}
              </View>
            </>
          )}

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>
              Images
            </ThemedText>
            <Pressable style={[styles.addImageBtn, { borderColor: Brand.primary }]} onPress={handlePickImages}>
              <ThemedText style={styles.addImageBtnText}>
                + Add Images
              </ThemedText>
            </Pressable>
            {images.length + newImageUris.length > 0 && (
              <View style={styles.imagePreviewRow}>
                {[...images, ...newImageUris].map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.thumb} />
                ))}
              </View>
            )}
          </View>

          <Pressable
            style={({pressed}) => [
              styles.submitBtn,
              { opacity: submitting ? 0.6 : pressed ? 0.7 : 1 },, { backgroundColor: Brand.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <ThemedText style={styles.submitBtnText}>
                {isEditing ? "Update Job" : "Post Job"}
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: {
    fontSize: FontSize.md,
    lineHeight: 28,
    fontWeight: 700,

  },
  content: {
    padding: Spacing.four,
  },
  formGroup: {
    marginTop: Spacing.four,
  },
  label: {
    fontWeight: 600,

    marginBottom: 6,
  },
  input: {
    borderWidth: 1,

    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.base,


  },
  pickerBtn: {
    borderWidth: 1,

    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,

  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  slotsRow: {
    padding: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  slotBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",
  },
  slotBtnText: {
    fontSize: 24,
    fontWeight: 700,
  },
  slotValue: {
    fontSize: 24,
    justifyContent: "center",
    padding: Spacing.two,
    fontWeight: 700,

    minWidth: 40,
    textAlign: "center",
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,

    alignItems: "center",
    backgroundColor: Brand.white,
  },
  pillActive: {
  },
  pillText: {
    fontWeight: 600,
    color: '#FFFFFF',
    textTransform: "capitalize",
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  locationBtnText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  addImageBtn: {
    borderWidth: 1,

    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: "center",
    borderStyle: "dashed",
  },
  addImageBtnText: {
    fontWeight: 600,
    fontSize: FontSize.base,
  },
  imagePreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.sm,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.six,
    ...Shadow.elevated,
  },
  submitBtnText: {
    fontSize: FontSize.base,
    fontWeight: 700,
    color: '#FFFFFF',
  },
});
