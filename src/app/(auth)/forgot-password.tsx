import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Toast } from "@/components/toast";
import { BorderRadius, Brand, Spacing } from "@/constants/theme";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/contexts/ThemeContext";

export default function ForgotPasswordScreen() {
  const Brand = useBrand();

  const { t } = useLocale()
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "error" as "error" | "success" });

  const handleReset = async () => {
    if (!email.trim()) {
      setToast({ visible: true, message: "Enter your email address", type: "error" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'locjobs://reset-password',
    });
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error.message, type: "error" });
    } else {
      setSent(true);
    }
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.white }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
        <View style={styles.container}>
          <View style={styles.logoSection}>
            <ThemedText style={styles.appName}>LocJobs</ThemedText>
            <ThemedText style={styles.subtitle}>{t('auth.resetPassword')}</ThemedText>
          </View>

          {sent ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing.five }}>
              <Ionicons name="mail-outline" size={48} color={Brand.primary} style={{ marginBottom: Spacing.three }} />
              <ThemedText style={{ fontSize: 17, fontWeight: 600, textAlign: "center", marginBottom: Spacing.two }}>
                {t('auth.emailSent')}
              </ThemedText>
              <ThemedText type="small" style={{ color: Brand.textSecondary, textAlign: "center", marginBottom: Spacing.five }}>
                {t('auth.emailSent')}{"\n"}{email.trim()}
              </ThemedText>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <ThemedText type="smallBold" style={{ color: Brand.primary }}>{t('auth.signIn')}</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.formContainer}>
                <View style={[styles.fieldGroup, { backgroundColor: Brand.borderLight }]}>
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder={t('auth.email')}
                    placeholderTextColor={Brand.textSecondary}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                </View>
                <Pressable style={({pressed}) => [styles.primaryBtn, loading && { opacity: 0.6 }, pressed && { opacity: 0.8 }, { backgroundColor: Brand.primary }]} onPress={handleReset} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color={Brand.white} />
                  ) : (
                    <ThemedText style={styles.primaryBtnText}>{t('auth.resetPassword')}</ThemedText>
                  )}
                </Pressable>
              </View>

              <View style={styles.footer}>
                <Pressable onPress={() => router.back()}>
                  <ThemedText type="smallBold" style={{ color: Brand.primary }}>{t('auth.signIn')}</ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Brand.text,
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
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: 17,
  },
  footer: {
    marginTop: Spacing.seven,
    alignItems: "center",
  },
});
