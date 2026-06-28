import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  useEffect(() => {
    (async () => {
      const url = await Linking.getInitialURL();
      if (!url) {
        const session = (await supabase.auth.getSession()).data.session;
        router.replace(session ? "/(tabs)" : "/(auth)/login");
        return;
      }

      const fragment = url.split("#")[1];
      if (!fragment) {
        router.replace("/(auth)/login");
        return;
      }

      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        const session = (await supabase.auth.getSession()).data.session;
        if (session) {
          const googleAvatar = session.user?.user_metadata?.avatar_url;
          if (googleAvatar) {
            const { data: existing } = await supabase
              .from("users")
              .select("avatar_url")
              .eq("id", session.user.id)
              .single();
            if (!(existing as any)?.avatar_url) {
              await supabase
                .from("users")
                .update({ avatar_url: googleAvatar })
                .eq("id", session.user.id);
            }
          }
        }
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}
