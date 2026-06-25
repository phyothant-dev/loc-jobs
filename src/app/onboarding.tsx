import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, FontSize, Shadow, Spacing } from "@/constants/theme";
import { useBrand } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");

const PAGES = [
  {
    icon: "locate" as const,
    title: "Find Local Jobs",
    description:
      "Browse jobs posted by people near you. Filter by type, category, location, and price.",
    color: "#FF6B35",
    bg: "#FFF4ED",
  },
  {
    icon: "chatbubbles" as const,
    title: "Chat & Apply",
    description:
      "Apply to jobs you like, chat with job posters, and negotiate directly in the app.",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  {
    icon: "checkmark-circle" as const,
    title: "Get Hired or Hire",
    description:
      "Complete jobs, earn money, and build your reputation with ratings and reviews.",
    color: "#2ECC71",
    bg: "#E8F8F0",
  },
];

function PageAnimation({
  icon,
  color,
  bg,
  index,
  currentIndex,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  index: number;
  currentIndex: number;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isActive = index === currentIndex;

  useEffect(() => {
    if (!isActive) {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulse.start();
    rotate.start();
    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [isActive, pulseAnim, rotateAnim]);

  const rotateInterp = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.iconWrap, { backgroundColor: bg }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={[styles.iconRing, { borderColor: color }]}>
          <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
            <Ionicons name={icon} size={72} color={color} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen({ onDone }: { onDone?: () => void }) {
  const Brand = useBrand();

  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback(
    (toPage: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setPage(toPage);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  const onNext = useCallback(() => {
    if (page < PAGES.length - 1) {
      animateTransition(page + 1);
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    }
  }, [page, animateTransition]);

  const onComplete = useCallback(async () => {
    await AsyncStorage.setItem("onboarding_complete", "true");
    if (onDone) onDone();
    else router.back();
  }, [onDone]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Brand.bg }]}
      edges={["top", "bottom"]}
    >
      <FlatList
        ref={listRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View style={styles.page}>
            <PageAnimation
              icon={item.icon}
              color={item.color}
              bg={item.bg}
              index={index}
              currentIndex={page}
            />
            <Animated.View style={{ opacity: index === page ? 1 : 0 }}>
              <ThemedText style={[styles.title, { color: item.color }]}>
                {item.title}
              </ThemedText>
            </Animated.View>
            <ThemedText style={styles.description}>
              {item.description}
            </ThemedText>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === page && [
                  styles.dotActive,
                  { backgroundColor: PAGES[i].color },
                ],
                { backgroundColor: Brand.border },
              ]}
            />
          ))}
        </View>

        <View
          style={{ flexDirection: "row", gap: Spacing.three, width: "100%" }}
        >
          {page < PAGES.length - 1 ? (
            <>
              <Pressable onPress={onComplete} style={[styles.skipBtn]}>
                <ThemedText style={styles.skipText}>Skip</ThemedText>
              </Pressable>
              <Pressable
                onPress={onNext}
                style={[styles.btn, { backgroundColor: PAGES[page].color }]}
              >
                <ThemedText style={[styles.btnText, { color: PAGES[page].bg }]}>
                  Next
                </ThemedText>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={onComplete}
              style={[
                styles.btn,
                styles.fullBtn,
                { backgroundColor: PAGES[page].color },
              ]}
            >
              <ThemedText style={[styles.btnText, { color: "white" }]}>
                Get Started
              </ThemedText>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: "center",
  },
  page: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.six,
  },
  iconWrap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.six,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 800,
    padding: Spacing.three,
    textAlign: "center",
    marginBottom: Spacing.three,
  },
  description: {
    fontSize: FontSize.base,

    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
    alignItems: "center",
    gap: Spacing.five,
  },
  dots: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    ...Shadow.elevated,
  },
  fullBtn: {
    flex: 0,
    width: "100%",
  },
  btnText: {
    fontSize: FontSize.base,
    fontWeight: 700,
  },
  skipBtn: {
    paddingHorizontal: Spacing.two,
    justifyContent: "center",
    alignItems: "center",
  },
  skipText: {
    fontSize: FontSize.base,
    fontWeight: 600,
  },
});
