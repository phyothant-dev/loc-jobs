import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingOverlay } from "@/components/loading-overlay";
import { ThemedText } from "@/components/themed-text";
import { Toast } from "@/components/toast";
import { BorderRadius, Brand, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const { t } = useLocale()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error" as "error" | "success",
  });
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const { signInWithGoogle } = useAuth();

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

  const handleLogin = async () => {
    setError(null);
    await withMinDelay(async () => {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authErr) {
        setError(authErr.message);
        setToast({ visible: true, message: authErr.message, type: "error" });
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await withMinDelay(async () => {
      const { error: authErr } = await signInWithGoogle();
      if (authErr) {
        setToast({ visible: true, message: authErr, type: "error" });
      } else {
        setToast({
          visible: true,
          message: "Signed in with Google",
          type: "success",
        });
      }
    });
  };

  const renderField = (
    key: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      secure?: boolean;
      keyboardType?: "email-address";
      children?: React.ReactNode;
    },
  ) => {
    const isFocused = focusedField === key;
    const hasValue = value.length > 0;
    const isUp = isFocused || hasValue;
    return (
      <View style={[styles.fieldGroup, isFocused && styles.fieldGroupFocused]}>
        <TextInput
          ref={key === "email" ? emailRef : passwordRef}
          style={styles.input}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          secureTextEntry={key === "password" && !showPassword}
          keyboardType={opts?.keyboardType}
          autoCapitalize="none"
          placeholder=""
          placeholderTextColor="transparent"
          returnKeyType={key === "email" ? "next" : "done"}
          onSubmitEditing={key === "email" ? () => passwordRef.current?.focus() : handleLogin}
        />
        <Pressable
          style={styles.labelHit}
          onPress={() => {
            if (key === "email") emailRef.current?.focus();
            else passwordRef.current?.focus();
          }}
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
    <View style={{ flex: 1, position: "relative" }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.white }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((p) => ({ ...p, visible: false }))}
        />
        <View style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <ThemedText style={styles.appName}>LocJobs</ThemedText>
            <ThemedText style={styles.subtitle}>
              Finding local talent, simplified.
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {renderField("email", t('auth.email'), email, setEmail, {
              keyboardType: "email-address",
            })}
            {renderField("password", t('auth.password'), password, setPassword, {
              secure: true,
              children: (
                  <Pressable
                    style={styles.toggleBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Brand.textSecondary}
                    />
                  </Pressable>
                ),
            })}

            <View style={styles.forgotRow}>
              <Pressable onPress={() => router.push("/(auth)/forgot-password" as any)}>
                <ThemedText
                  type="smallBold"
                  style={{ color: Brand.primary, fontSize: 14 }}
                >
                  {t('auth.forgotPassword')}
                </ThemedText>
              </Pressable>
            </View>

            {/* Sign In Button */}
            <View style={{ marginTop: Spacing.two }}>
              <Pressable
                style={({pressed}) => [styles.primaryBtn, loading && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Brand.white} />
                ) : (
                  <ThemedText style={styles.primaryBtnText}>{t('auth.signIn')}</ThemedText>
                )}
              </Pressable>
            </View>

            {/* Social Logins */}
            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>
                  {t('auth.or')}
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({pressed}) => [styles.googleBtn, pressed && { opacity: 0.8 }]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <View style={styles.googleIconWrap}>
                  <Ionicons name="logo-google" size={18} color={Brand.text} />
                </View>
                <ThemedText style={styles.googleBtnText}>
                  {t('auth.signInWithGoogle')}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              {t('auth.noAccount')}{" "}
              <ThemedText
                style={styles.footerLink}
                onPress={() => router.replace("/register" as any)}
              >
                {t('auth.signUp')}
              </ThemedText>
            </ThemedText>
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    maxWidth: 390,
    width: "100%",
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  appName: {
    fontSize: 35,
    padding: Spacing.five,
    fontWeight: "condensedBold",
    color: Brand.primary,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 500,
    color: Brand.textSecondary,
  },
  formContainer: {
    width: "100%",
  },
  fieldGroup: {
    backgroundColor: Brand.borderLight,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
    position: "relative",
  },
  fieldGroupFocused: {
    backgroundColor: Brand.borderLight,
  },
  input: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Brand.text,
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
    color: Brand.textSecondary,
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
  forgotRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    marginBottom: Spacing.four,
  },
  primaryBtn: {
    backgroundColor: Brand.primary,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  primaryBtnText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: 17,
  },
  socialSection: {
    marginTop: Spacing.six,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: 700,
    color: Brand.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: "row",
    height: 54,
    backgroundColor: Brand.text,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.white,
    justifyContent: "center",
    alignItems: "center",
  },
  googleBtnText: {
    color: Brand.white,
    fontWeight: 600,
    fontSize: 16,
  },
  footer: {
    marginTop: Spacing.seven,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    fontWeight: 500,
    color: Brand.textSecondary,
  },
  footerLink: {
    color: Brand.primary,
    fontWeight: 700,
  },
});
