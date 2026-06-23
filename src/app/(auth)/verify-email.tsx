import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Brand, Spacing } from "@/constants/theme";
import { useLocale } from "@/contexts/LocaleContext";

export default function VerifyEmailScreen() {
  const { t } = useLocale()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.white }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Ionicons name="mail-unread-outline" size={64} color={Brand.primary} style={{ marginBottom: Spacing.four }} />
        <ThemedText style={styles.title}>{t('auth.verifyEmail')}</ThemedText>
        <ThemedText type="small" style={styles.body}>
          {t('auth.verifyEmailSent')}
        </ThemedText>
        <Pressable style={styles.btn} onPress={() => router.replace("/(auth)/login")}>
          <ThemedText style={styles.btnText}>{t('auth.signIn')}</ThemedText>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.five,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: Spacing.two,
    color: Brand.text,
  },
  body: {
    color: Brand.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  btn: {
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    borderRadius: BorderRadius.md,
  },
  btnText: {
    color: Brand.white,
    fontWeight: 700,
    fontSize: 16,
  },
});
