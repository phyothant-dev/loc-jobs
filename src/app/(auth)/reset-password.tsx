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

export default function ResetPasswordScreen() {
  const Brand = useBrand();

  const { t } = useLocale()
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "error" as "error" | "success" });
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleReset = async () => {
    if (password.length < 6) {
      setToast({ visible: true, message: "Password must be at least 6 characters", type: "error" });
      return;
    }
    if (password !== confirm) {
      setToast({ visible: true, message: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error.message, type: "error" });
    } else {
      setToast({ visible: true, message: "Password updated successfully", type: "success" });
      setTimeout(() => router.replace("/(auth)/login"), 1200);
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

          <View style={styles.formContainer}>
            <View style={[styles.fieldGroup, { backgroundColor: Brand.borderLight }]}>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder={t('auth.password')}
                placeholderTextColor={Brand.textSecondary}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Pressable style={styles.toggleBtn} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Brand.textSecondary} />
              </Pressable>
            </View>
            <View style={[styles.fieldGroup, { backgroundColor: Brand.borderLight }]}>
              <TextInput
                ref={confirmRef}
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder={t('auth.confirmPassword')}
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
    position: "relative",
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Brand.text,
    paddingRight: 44,
  },
  toggleBtn: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
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
});
