import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from '@/components/skeleton'
import { ThemedText } from "@/components/themed-text";
import {
    BorderRadius,
    Brand,
    FontSize,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useFilterCount } from "@/contexts/FilterCountContext";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/contexts/ThemeContext";

interface Conversation {
  key: string;
  jobId: string;
  jobTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherAvatarUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

function relativeTime(dateStr: string, t?: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t ? t('time.now') : "now";
  if (mins < 60) return `${mins}${t ? t('time.mins') : 'm'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t ? t('time.hours') : 'h'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t ? t('time.days') : 'd'}`;
  return new Date(dateStr).toLocaleDateString();
}

function buildConversations(msgs: any[], userId: string, lastReadAt: Map<string, number>): Conversation[] {
  const seen = new Map<string, any>();
  for (const m of msgs) {
    const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const key = `${m.job_id}-${otherId}`;
    const existing = seen.get(key);
    const msgTime = new Date(m.created_at).getTime()
    const isUnread = m.receiver_id === userId && msgTime > (lastReadAt.get(key) || 0)
    if (!existing || msgTime > new Date(existing.lastMessageTime).getTime()) {
      const otherName =
        m.sender_id === userId
          ? m.receiver?.display_name || ""
          : m.sender?.display_name || "";
      const otherAvatar =
        m.sender_id === userId
          ? m.receiver?.avatar_url || null
          : m.sender?.avatar_url || null;
      seen.set(key, {
        key,
        jobId: m.job_id,
        jobTitle: m.job?.title || "",
        otherUserId: otherId,
        otherUserName: otherName || "Anonymous",
        otherAvatarUrl: otherAvatar,
        lastMessage: m.content || (m.image_url ? "📷 Photo" : ""),
        lastMessageTime: m.created_at,
        unreadCount: existing ? existing.unreadCount + (isUnread ? 1 : 0) : (isUnread ? 1 : 0),
      });
    } else {
      if (isUnread) {
        existing.unreadCount++
      }
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
}

export default function ChatScreen() {
  const Brand = useBrand();

  const { user } = useAuth();
  const { t } = useLocale();
  const { setCount } = useFilterCount();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const lastReadAt = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    AsyncStorage.getItem('chat_last_read').then((val) => {
      if (val) lastReadAt.current = new Map(JSON.parse(val))
    })
  }, [])

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select(
          "*, job:jobs!job_id(title), sender:users!sender_id(display_name, avatar_url), receiver:users!receiver_id(display_name, avatar_url)",
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (msgs) {
        const convs = buildConversations(msgs as any[], user.id, lastReadAt.current)
        setConversations(convs);
        setCount('chat', convs.reduce((sum, c) => sum + c.unreadCount, 0))
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const computeTotalUnread = useCallback((convs: Conversation[]) => {
    const total = convs.reduce((sum, c) => sum + c.unreadCount, 0)
    setCount('chat', total)
  }, [setCount])

  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel('chat-list')
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const m = payload.new as any
          if (m.sender_id !== user.id && m.receiver_id !== user.id) return
          const { data: msg } = await supabase
            .from("messages")
            .select(
              "*, job:jobs!job_id(title), sender:users!sender_id(display_name, avatar_url), receiver:users!receiver_id(display_name, avatar_url)",
            )
            .eq("id", m.id)
            .single()
          if (msg) {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
            const key = `${msg.job_id}-${otherId}`
            const otherName =
              msg.sender_id === user.id
                ? msg.receiver?.display_name || ""
                : msg.sender?.display_name || ""
            const otherAvatar =
              msg.sender_id === user.id
                ? msg.receiver?.avatar_url || null
                : msg.sender?.avatar_url || null
            const isUnread = msg.receiver_id === user.id && new Date(msg.created_at).getTime() > (lastReadAt.current.get(key) || 0)
            const entry: Conversation = {
              key,
              jobId: msg.job_id,
              jobTitle: msg.job?.title || "",
              otherUserId: otherId,
              otherUserName: otherName || "Anonymous",
              otherAvatarUrl: otherAvatar,
              lastMessage: msg.content || (msg.image_url ? "📷 Photo" : ""),
              lastMessageTime: msg.created_at,
              unreadCount: isUnread ? 1 : 0,
            }
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.key === key)
              const existing = idx !== -1 ? prev[idx] : null
              if (existing) {
                entry.unreadCount = existing.unreadCount + (isUnread ? 1 : 0)
              }
              const next = idx !== -1
                ? [...prev.slice(0, idx), ...prev.slice(idx + 1)]
                : [...prev]
              const result = [entry, ...next]
              computeTotalUnread(result)
              return result
            })
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  const handlePress = (item: Conversation) => {
    lastReadAt.current.set(item.key, Date.now())
    AsyncStorage.setItem('chat_last_read', JSON.stringify(Array.from(lastReadAt.current.entries())))
    setConversations((prev) => {
      const next = prev.map((c) => (c.key === item.key ? { ...c, unreadCount: 0 } : c))
      computeTotalUnread(next)
      return next
    })
    router.push(`/chat/${item.jobId}/${item.otherUserId}`)
  }

  const handleLongPress = (item: Conversation) => {
      Alert.alert(item.otherUserName, undefined, [
      {
        text: t('chat.deleteConversation'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('chat.deleteConversation'), t('chat.deleteConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                await supabase
                  .from('messages')
                  .delete()
                  .eq('job_id', item.jobId)
                  .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${item.otherUserId}),and(sender_id.eq.${item.otherUserId},receiver_id.eq.${user?.id})`)
                setConversations((prev) => prev.filter((c) => c.key !== item.key))
              },
            },
          ])
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ])
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Brand.bg }}
      edges={["top"]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{t('chat.title')}</ThemedText>
        </View>

        {loading ? (
          <View style={{ flex: 1, backgroundColor: Brand.bg, padding: Spacing.four, gap: Spacing.three }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={[styles.conversationCard, { backgroundColor: Brand.white }]}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.conversationContent}>
                  <View style={styles.conversationTop}>
                    <Skeleton width="40%" height={14} />
                    <Skeleton width="15%" height={12} />
                  </View>
                  <View style={{ paddingLeft: 40, paddingVertical: 4 }}>
                    <Skeleton width="70%" height={13} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : conversations.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: Spacing.five,
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: Spacing.five }}>
              <Ionicons name="chatbubbles-outline" size={48} color={Brand.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: Brand.textSecondary, textAlign: "center" }}
              >
                {t('chat.noConversations')}
              </ThemedText>
            </View>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              padding: Spacing.four,
              paddingBottom: 100,
            }}
            windowSize={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={7}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.two }} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePress(item)}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={400}
              >
                <View style={[styles.conversationCard, { backgroundColor: Brand.white }]}>
                  <View style={[styles.avatar, { backgroundColor: Brand.primaryLight }]}>
                    {item.otherAvatarUrl ? (
                      <Image
                        source={{ uri: item.otherAvatarUrl }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <ThemedText style={styles.avatarText}>
                        {(item.otherUserName.charAt(0) || "?").toUpperCase()}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationTop}>
                      <ThemedText style={styles.otherName} numberOfLines={1}>
                        {item.otherUserName}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {item.unreadCount > 0 && (
                          <View style={[styles.unreadBadge, { backgroundColor: Brand.primary }]}>
                            <Text style={styles.unreadBadgeText}>
                              {item.unreadCount > 9 ? '9+' : item.unreadCount}
                            </Text>
                          </View>
                        )}
                        <ThemedText
                          type="caption"
                          style={{ color: Brand.textSecondary }}
                        >
                          {relativeTime(item.lastMessageTime, t)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      type="caption"
                      style={{ color: Brand.textSecondary }}
                      numberOfLines={1}
                    >
                      {item.jobTitle}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{
                        color: item.unreadCount > 0 ? Brand.text : Brand.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    lineHeight: 40,
    fontWeight: 700,

    letterSpacing: -0.5,
    padding: Spacing.one,
  },
  conversationCard: {
    flexDirection: "row",

    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,

    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontWeight: 700,
    fontSize: FontSize.md,
  },
  conversationContent: {
    flex: 1,
    gap: 2,
  },
  conversationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  otherName: {
    fontWeight: 700,
    fontSize: FontSize.base,

    flex: 1,
    marginRight: Spacing.two,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: 700,
  },
});
