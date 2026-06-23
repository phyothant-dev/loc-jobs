import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Toast } from "@/components/toast";
import { LoadingOverlay } from "@/components/loading-overlay";
import {
    BorderRadius,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const { t } = useLocale()
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "error" as "error" | "success" });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const MIN_LOADING_MS = 800;

  const withMinDelay = async (fn: () => Promise<void>) => {
    const start = Date.now();
    setLoading(true);
    await fn();
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    setLoading(false);
  };

  const showError = (msg: string) => {
    setError(msg);
    setToast({ visible: true, message: msg, type: "error" });
  };

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    if (!fullName.trim()) {
      showError("Full name is required");
      return;
    }
    if (!trimmedEmail) {
      showError("Email is required");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      showError("Please agree to the Terms of Service");
      return;
    }
    await withMinDelay(async () => {
      setError(null);
      const { data, error: authErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (authErr) {
        setError(authErr.message);
        setToast({ visible: true, message: authErr.message, type: "error" });
        return;
      }
      if (data.user && data.user.email_confirmed_at) {
        await supabase.from("users").upsert({
          id: data.user.id,
          email: trimmedEmail,
          display_name: fullName.trim(),
        });
      } else {
        router.replace("/(auth)/verify-email" as any);
      }
    });
  };

  const refMap: Record<string, React.RefObject<TextInput | null>> = {
    fullName: fullNameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmRef,
  };

  const renderField = (
    key: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      secure?: boolean;
      keyboardType?: "email-address";
      autoCapitalize?: "none" | "words";
      children?: React.ReactNode;
    },
  ) => {
    const isFocused = focusedField === key;
    const hasValue = value.length > 0;
    const isUp = isFocused || hasValue;
    const ref = refMap[key];
    return (
      <View style={[styles.fieldGroup, isFocused && styles.fieldGroupFocused]}>
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          secureTextEntry={opts?.secure ?? false}
          keyboardType={opts?.keyboardType}
          autoCapitalize={opts?.autoCapitalize ?? "none"}
          placeholder=""
          placeholderTextColor="transparent"
        />
        <Pressable
          style={styles.labelHit}
          onPress={() => ref.current?.focus()}
        >
          <ThemedText
            style={[styles.floatingLabel, isUp && styles.floatingLabelUp]}
          >
            {label}
          </ThemedText>
        </Pressable>
        {opts?.children}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
        <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Atmospheric blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.container}>
          {/* Brand Identity */}
          <View style={styles.logoSection}>
            <ThemedText style={styles.appName}>LocJobs</ThemedText>
            <ThemedText
              type="small"
              style={{
                color: Brand.textSecondary,
                opacity: 0.8,
                textAlign: "center",
              }}
            >
              Find your place in the local workforce.
            </ThemedText>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <View style={{ marginBottom: Spacing.four }}>
              <ThemedText style={styles.cardTitle}>{t('auth.signUpTitle')}</ThemedText>
              <ThemedText
                type="caption"
                style={{ color: Brand.textSecondary, marginTop: 4 }}
              >
                {t('auth.signUpSubtitle')}
              </ThemedText>
            </View>

            {/* Full Name */}
            {renderField("fullName", t('auth.displayName'), fullName, setFullName, {
              autoCapitalize: "words",
            })}

            {/* Email */}
            {renderField("email", t('auth.email'), email, setEmail, {
              keyboardType: "email-address",
            })}

            {/* Password + Confirm */}
            <View style={styles.passwordRow}>
              <View style={{ flex: 1 }}>
                {renderField("password", t('auth.password'), password, setPassword, {
                  secure: !showPassword,
                  children: (
                    <Pressable
                      style={styles.toggleBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#8E8E93"
                      />
                    </Pressable>
                  ),
                })}
              </View>
              <View style={{ flex: 1 }}>
                {renderField("confirmPassword", t('auth.confirmPassword'), confirmPassword, setConfirmPassword, {
                  secure: !showConfirm,
                  children: (
                    <Pressable
                      style={styles.toggleBtn}
                      onPress={() => setShowConfirm(!showConfirm)}
                    >
                      <Ionicons
                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#8E8E93"
                      />
                    </Pressable>
                  ),
                })}
              </View>
            </View>

            {/* Terms */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View
                style={[styles.checkbox, agreeTerms && styles.checkboxActive]}
              >
                {agreeTerms && (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                )}
              </View>
              <ThemedText
                type="caption"
                style={{ color: Brand.textSecondary, flex: 1 }}
              >
                I agree to the{" "}
                <ThemedText type="caption" style={{ color: Brand.primary }}>
                  Terms of Service
                </ThemedText>{" "}
                and{" "}
                <ThemedText type="caption" style={{ color: Brand.primary }}>
                  Privacy Policy
                </ThemedText>
              </ThemedText>
            </Pressable>

            {/* Primary Action */}
            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Brand.white} />
              ) : (
                <ThemedText style={styles.primaryBtnText}>{t('auth.signUp')}</ThemedText>
              )}
            </Pressable>
          </View>

          {/* Bottom Link */}
          <Pressable onPress={() => router.replace("/login" as any)}>
            <ThemedText
              type="small"
              style={{ textAlign: "center", color: Brand.textSecondary }}
            >
              {t('auth.haveAccount')}{" "}
              <ThemedText type="smallBold" style={{ color: Brand.primary }}>
                {t('auth.signIn')}
              </ThemedText>
            </ThemedText>
          </Pressable>

          {/* Trust badges */}
          <View style={styles.trustSection}>
            <ThemedText
              type="caption"
              style={{
                color: Brand.textTertiary,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Trusted by leading local employers
            </ThemedText>
            <View style={styles.trustRow}>
              <View style={styles.trustBar} />
              <View style={[styles.trustBar, { width: 60 }]} />
              <View style={[styles.trustBar, { width: 80 }]} />
            </View>
          </View>

          {/* Footer */}
          <ThemedText
            type="caption"
            style={{
              color: Brand.textTertiary,
              textAlign: "center",
              marginTop: Spacing.five,
              opacity: 0.6,
            }}
          >
            © 2024 LocJobs Inc. All rights reserved.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
    <LoadingOverlay visible={loading} />
  </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  blob1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Brand.primaryLight,
    opacity: 0.15,
    top: -60,
    left: -60,
  },
  blob2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Brand.successLight,
    opacity: 0.1,
    bottom: -40,
    right: -40,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: "center",
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.three,
    padding: Spacing.three,
  },
  appName: {
    fontSize: 28,
    fontWeight: "condensedBold",
    color: Brand.primary,
    padding: Spacing.three,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: Brand.border,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: 700,
    color: Brand.text,
    paddingTop: Spacing.two,
    letterSpacing: -0.5,
  },
  fieldGroup: {
    backgroundColor: "rgba(118,118,128,0.12)",
    borderRadius: 12,
    marginBottom: 12,
    position: "relative",
  },
  fieldGroupFocused: {
    backgroundColor: "rgba(118,118,128,0.18)",
  },
  input: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#000",
  },
  labelHit: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  floatingLabel: {
    fontSize: 17,
    color: "#8E8E93",
  },
  floatingLabelUp: {
    fontSize: 12,
    fontWeight: 600,
    color: Brand.primary,
    position: "absolute",
    top: 6,
    left: 16,
  },
  toggleBtn: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingTop: 8,
  },
  passwordRow: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Brand.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  checkmark: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    paddingHorizontal: Spacing.five,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    marginTop: Spacing.five,
    ...Shadow.elevated,
  },
  primaryBtnText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: FontSize.md,
  },
  trustSection: {
    alignItems: "center",
    marginTop: Spacing.five,
    gap: Spacing.three,
    opacity: 0.5,
  },
  trustRow: {
    flexDirection: "row",
    gap: Spacing.five,
    alignItems: "center",
  },
  trustBar: {
    width: 80,
    height: 20,
    backgroundColor: Brand.borderLight,
    borderRadius: BorderRadius.full,
  },
});
