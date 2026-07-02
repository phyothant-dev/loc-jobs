import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View, Dimensions } from 'react-native'
import LottieView from 'lottie-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Ionicons } from '@expo/vector-icons'
import ImageGallery from '@/components/image-gallery'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/contexts/ThemeContext'
import { useLocale } from '@/contexts/LocaleContext'

interface Message {
  id: string
  sender_id: string
  content: string
  image_url: string | null
  edited_at: string | null
  deleted: boolean
  reply_to_id: string | null
  read_at: string | null
  created_at: string
  reply_to?: {
    content: string
    sender_id: string
    image_url: string | null
    deleted: boolean
    created_at: string
  } | null
}

const SCREEN_WIDTH = Dimensions.get('window').width
const IMAGE_MAX_W = SCREEN_WIDTH * 0.55
const IMAGE_MAX_H = 260
const PAGE_SIZE = 30

interface MessageBubbleProps {
  item: Message
  isMine: boolean
  showDateSep: boolean
  Brand: ReturnType<typeof useBrand>
  t: (key: string) => string
  onLongPress: (msg: Message) => void
  onImagePress: (url: string) => void
}

const MessageBubble = React.memo(function MessageBubble({ item, isMine, showDateSep, Brand, t, onLongPress, onImagePress }: MessageBubbleProps) {
  return (
    <View>
      {showDateSep && (
        <View style={styles.dateSeparator}>
          <View style={[styles.dateSepLine, { backgroundColor: Brand.borderLight }]} />
          <ThemedText style={styles.dateSepText}>
            {formatDateSeparator(item.created_at, t)}
          </ThemedText>
          <View style={[styles.dateSepLine, { backgroundColor: Brand.borderLight }]} />
        </View>
      )}
      {item.deleted ? (
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
          <View style={[styles.bubble, styles.bubbleDeleted, { backgroundColor: Brand.borderLight }]}>
            <ThemedText style={styles.bubbleDeletedText}>{t('chat.messageDeleted')}</ThemedText>
          </View>
        </View>
      ) : (
        <Pressable
          onLongPress={() => onLongPress(item)}
          delayLongPress={400}
        >
          <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
            <View style={isMine ? [styles.bubble, styles.bubbleMine, { backgroundColor: Brand.primary }] : [styles.bubble, styles.bubbleOther, { backgroundColor: Brand.white }]}>
              {item.image_url ? (
                <Pressable onPress={() => onImagePress(item.image_url!)}>
                  <Image source={{ uri: item.image_url }} style={styles.bubbleImage} resizeMode="cover" />
                </Pressable>
              ) : null}
              {item.content ? (
                <ThemedText style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
                  {item.content}
                </ThemedText>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ThemedText style={[styles.bubbleTime, !item.content && item.image_url ? { marginTop: 0, paddingTop: 4 } : {}, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
                {item.edited_at && (
                  <ThemedText style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
                    · {t('chat.edited')}
                  </ThemedText>
                )}
                {isMine && item.read_at && (
                  <ThemedText style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
                    · {t('chat.seen')}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  )
})

export default function ChatDetailScreen() {
  const Brand = useBrand()
  const { t } = useLocale()

  const { user } = useAuth()
  const { jobId, otherUserId } = useLocalSearchParams<{ jobId: string; otherUserId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [otherName, setOtherName] = useState('')
  const [otherAvatarUrl, setOtherAvatarUrl] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editText, setEditText] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [scrolledUp, setScrolledUp] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const flatRef = useRef<FlatList>(null)
  const oldestTimeRef = useRef<string | null>(null)

  const loadPage = useCallback(async (olderThan?: string) => {
    if (!jobId || !otherUserId || !user) return
    let query = supabase
      .from('messages')
      .select('*, reply_to:messages!reply_to_id(content, sender_id, image_url, deleted, created_at)')
      .eq('job_id', jobId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (olderThan) {
      query = query.lt('created_at', olderThan)
    }
    const { data, error } = await query
    if (error) return
    return (data || []).reverse() as Message[]
  }, [jobId, otherUserId, user])

  const fetchReplyDetails = useCallback(async (msgId: string, replyToId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('content, sender_id, image_url, deleted, created_at')
      .eq('id', replyToId)
      .single()
    if (data) {
      setMessages((prev) => prev.map((p) => p.id === msgId ? { ...p, reply_to: data } : p))
    }
  }, [])

  const loadInitial = useCallback(async () => {
    if (!jobId || !otherUserId || !user) { setInitialLoading(false); return }
    try {
      const [page, jobRes, otherRes] = await Promise.all([
        loadPage(),
        supabase.from('jobs').select('title').eq('id', jobId).single(),
        supabase.from('users').select('display_name, avatar_url').eq('id', otherUserId).single(),
      ])
      if (page && page.length > 0) {
        setMessages(page)
        oldestTimeRef.current = page[0].created_at
        if (page.length < PAGE_SIZE) setHasMore(false)
        for (const msg of page) {
          if (msg.reply_to_id) {
            fetchReplyDetails(msg.id, msg.reply_to_id)
          }
        }
      } else {
        setHasMore(false)
      }
      if (jobRes.data) setJobTitle((jobRes.data as any).title || '')
      if (otherRes.data) {
        setOtherName((otherRes.data as any).display_name || 'Anonymous')
        setOtherAvatarUrl((otherRes.data as any).avatar_url || null)
      }
    } catch (e) {
      console.error('loadInitial error', e)
    }
    setInitialLoading(false)
  }, [loadPage, fetchReplyDetails, jobId, otherUserId, user])

  useEffect(() => { loadInitial() }, [loadInitial])

  useEffect(() => {
    if (!jobId || !otherUserId || !user) return
    const key = `${jobId}-${otherUserId}`
    AsyncStorage.getItem('chat_last_read').then((val) => {
      const map = val ? new Map(JSON.parse(val)) : new Map()
      map.set(key, Date.now())
      AsyncStorage.setItem('chat_last_read', JSON.stringify(Array.from(map.entries())))
    })
  }, [jobId, otherUserId, user])

  useEffect(() => {
    if (!jobId || !user || !otherUserId) return
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .is('read_at', null)
      .then(({ error }) => {
        if (error) console.error('Failed to mark as read', error)
      })
  }, [jobId, otherUserId, user])

  useEffect(() => {
    if (!jobId) return
    const sub = supabase
      .channel(`chat-messages-${jobId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new as any
          if (m.sender_id === user?.id || m.receiver_id === user?.id) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === m.id)) return prev
              return [...prev, m as Message]
            })
            if (m.reply_to_id) {
              fetchReplyDetails(m.id, m.reply_to_id)
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const m = payload.new as any
          setMessages((prev) => prev.map((p) => (p.id === m.id ? { ...p, ...m } : p)))
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as any
          setMessages((prev) => prev.filter((p) => p.id !== old.id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [jobId, user?.id])

  useEffect(() => {
    if (messages.length > 0 && !scrolledUp) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 50)
    }
  }, [messages.length, scrolledUp])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !user || sending) return
    setSending(true)
    setSendError(null)
    const payload: any = {
      job_id: jobId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: text,
    }
    if (replyingTo) {
      payload.reply_to_id = replyingTo.id
    }
    const { error } = await supabase.from('messages').insert(payload)
    if (error) {
      setSendError(t('chat.sendFailed'))
      setSending(false)
      return
    }
    setInput('')
    setReplyingTo(null)
    setSending(false)
  }

  const handlePickImage = async () => {
    if (!user) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.7,
    })
    if (result.canceled || !result.assets[0]) return
    const uri = result.assets[0].uri
    setImageUploading(true)
    try {
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase()
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
      const fileName = `chat/${jobId}/${user.id}/${Date.now()}.${ext}`
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      await FileSystem.uploadAsync(
        `https://axuroixwxueufgvodnde.supabase.co/storage/v1/object/job-images/${fileName}`,
        uri,
        { httpMethod: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': mime, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      )
      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-images/${fileName}`
      const payload: any = {
        job_id: jobId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: '',
        image_url: publicUrl,
      }
      if (replyingTo) {
        payload.reply_to_id = replyingTo.id
      }
      const { error } = await supabase.from('messages').insert(payload)
      if (error) {
        console.error('Image send failed', error)
        return
      }
      setReplyingTo(null)
    } catch (e) {
      console.error('Image send failed', e)
    }
    setImageUploading(false)
  }

  const handleLongPress = useCallback((msg: Message) => {
    if (msg.sender_id !== user?.id) {
      Alert.alert(t('chat.messageOptions'), undefined, [
        {
          text: t('chat.reply'),
          onPress: () => setReplyingTo(msg),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ])
      return
    }
    Alert.alert(t('chat.messageOptions'), undefined, [
      {
        text: t('chat.reply'),
        onPress: () => setReplyingTo(msg),
      },
      {
        text: t('chat.edit'),
        onPress: () => {
          setEditText(msg.content)
          setEditingMessage(msg)
        },
      },
      {
        text: t('chat.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('chat.deleteMessage'), t('chat.deleteMessageWarning'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                await supabase.from('messages').update({ deleted: true }).eq('id', msg.id)
              },
            },
          ])
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ])
  }, [user, t, setReplyingTo, setEditText, setEditingMessage])

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return
    await supabase
      .from('messages')
      .update({ content: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', editingMessage.id)
    setEditingMessage(null)
    setEditText('')
  }

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !oldestTimeRef.current) return
    setLoadingMore(true)
    const page = await loadPage(oldestTimeRef.current)
    setLoadingMore(false)
    if (!page || page.length === 0) {
      setHasMore(false)
      return
    }
    setMessages((prev) => [...page, ...prev])
    oldestTimeRef.current = page[0].created_at
    if (page.length < PAGE_SIZE) setHasMore(false)
    for (const msg of page) {
      if (msg.reply_to_id) {
        fetchReplyDetails(msg.id, msg.reply_to_id)
      }
    }
  }

  const handleScroll = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50
    setScrolledUp(!nearBottom)
    if (contentOffset.y <= 0 && hasMore && !loadingMore) {
      loadMoreMessages()
    }
  }

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender_id === user?.id
    const showDateSep = index === 0 || new Date(item.created_at).toDateString() !== new Date((messages[index - 1]?.created_at ?? '')).toDateString()
    return (
      <MessageBubble
        item={item}
        isMine={isMine}
        showDateSep={showDateSep}
        Brand={Brand}
        t={t}
        onLongPress={handleLongPress}
        onImagePress={setPreviewImage}
      />
    )
  }, [user, messages, Brand, t, handleLongPress, setPreviewImage])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      {initialLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LottieView
            source={require('@/assets/images/crew-loader.json')}
            style={{ width: 200, height: 200 }}
            autoPlay
            loop
          />
        </View>
      ) : (
      <>
      <View style={[styles.header, { backgroundColor: Brand.white, borderBottomColor: Brand.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <Pressable onPress={() => router.push(otherUserId === user?.id ? '/(tabs)/profile' : `/user/${otherUserId}`)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {otherAvatarUrl ? (
            <Image source={{ uri: otherAvatarUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: Brand.primaryLight }]}>
              <ThemedText style={styles.headerAvatarText}>
                {(otherName.charAt(0) || '?').toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: Spacing.three }}>
            <ThemedText style={[styles.headerName, { color: Brand.primary }]} numberOfLines={1}>{otherName}</ThemedText>
            {jobTitle ? <ThemedText type="caption" style={{ color: Brand.textSecondary }} numberOfLines={1}>{jobTitle}</ThemedText> : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.four, paddingBottom: Spacing.four }}
            windowSize={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={7}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={loadingMore ? (
              <View style={{ paddingVertical: Spacing.four, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Brand.primary} />
              </View>
            ) : hasMore ? (
              <Pressable onPress={loadMoreMessages} style={{ paddingVertical: Spacing.four, alignItems: 'center' }}>
                <ThemedText style={{ color: Brand.primary, fontWeight: 600 }}>{t('chat.loadEarlier')}</ThemedText>
              </Pressable>
            ) : null}
            renderItem={renderMessage}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                <View style={{ alignItems: 'center', paddingVertical: Spacing.five }}>
                  <Ionicons name="chatbox-ellipses-outline" size={48} color={Brand.textSecondary} />
                  <ThemedText type="small" style={{ color: Brand.textSecondary }}>{t('chat.noMessages')}</ThemedText>
                </View>
              </View>
            }
          />
          {scrolledUp && (
            <Pressable style={[styles.scrollToBottom, { backgroundColor: Brand.primary }]} onPress={() => { flatRef.current?.scrollToEnd({ animated: true }); setScrolledUp(false) }}>
              <Ionicons name="chevron-down" size={22} color={Brand.white} />
            </Pressable>
          )}
        </View>

        <View>
          {replyingTo && (
            <View style={[styles.replyBar, { backgroundColor: Brand.bg, borderTopColor: Brand.border }]}>
              <View style={[styles.replyBarLine, { backgroundColor: Brand.primary }]} />
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.replyBarLabel, { color: Brand.primary }]}>
                  {t('chat.replyingTo', { name: otherName })}
                </ThemedText>
                <ThemedText style={[styles.replyBarContent, { color: Brand.textSecondary }]} numberOfLines={1}>
                  {replyingTo.content || (replyingTo.image_url ? 'Photo' : '')}
                </ThemedText>
              </View>
              <Pressable onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
                <Ionicons name="close" size={20} color={Brand.textSecondary} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputBar}>
            <Pressable style={[styles.imageBtn, { backgroundColor: Brand.primaryLight }]} onPress={handlePickImage} disabled={imageUploading}>
              <ThemedText style={styles.imageBtnText}>{imageUploading ? '...' : '+'}</ThemedText>
            </Pressable>
            <TextInput
              style={[styles.input, { backgroundColor: Brand.bg, borderColor: Brand.borderLight, color: Brand.text }]}
              placeholder={t('chat.inputPlaceholder')}
              placeholderTextColor={Brand.placeholder}
              value={input}
              onChangeText={(v) => { setInput(v); setSendError(null) }}
              multiline
              maxLength={1000}
            />
            <Pressable style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }, { backgroundColor: Brand.white }]} onPress={handleSend} disabled={!input.trim() || sending}>
              <Ionicons name="send" size={20} color={Brand.primary} />
            </Pressable>
          </View>
          {sendError && (
            <Pressable style={{ paddingHorizontal: Spacing.four, paddingBottom: Spacing.two }} onPress={handleSend}>
              <ThemedText style={{ color: Brand.danger, fontSize: FontSize.sm }}>{sendError}</ThemedText>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!editingMessage} transparent animationType="fade" onRequestClose={() => setEditingMessage(null)}>
        <Pressable style={[styles.editOverlay, { backgroundColor: Brand.overlay }]} onPress={() => setEditingMessage(null)}>
          <Pressable style={[styles.editModal, { backgroundColor: Brand.bg }]} onPress={() => {}}>
            <ThemedText style={styles.editTitle}>{t('chat.editTitle')}</ThemedText>
            <TextInput
              style={[styles.editInput, { backgroundColor: Brand.bg, borderColor: Brand.borderLight, color: Brand.text }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={1000}
              autoFocus
              placeholderTextColor={Brand.placeholder}
            />
            <View style={styles.editActions}>
              <Pressable style={[styles.editCancelBtn, { backgroundColor: Brand.bg }]} onPress={() => setEditingMessage(null)}>
                <ThemedText style={styles.editCancelText}>{t('common.cancel')}</ThemedText>
              </Pressable>
              <Pressable style={[styles.editSaveBtn, !editText.trim() && { opacity: 0.4 }, { backgroundColor: Brand.primary }]} onPress={handleSaveEdit} disabled={!editText.trim()}>
                <ThemedText style={styles.editSaveText}>{t('chat.send')}</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ImageGallery
        images={previewImage ? [previewImage] : []}
        visible={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
      </>
      )}
    </SafeAreaView>
  )
}

function formatDateSeparator(dateStr: string, t: (key: string) => string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return t('chat.today')
  if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  headerName: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  connBar: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  connBarText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: 600,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
    gap: Spacing.three,
  },
  dateSepLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateSepText: {
    fontSize: FontSize.sm,
    fontWeight: 600,
  },
  bubbleRow: {
    marginBottom: Spacing.two,
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    ...Shadow.card,
  },
  bubbleDeleted: {
    borderBottomRightRadius: 4,
  },
  bubbleDeletedText: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  bubbleText: {
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextOther: {},
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  bubbleImage: {
    width: IMAGE_MAX_W,
    height: IMAGE_MAX_H,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  bubbleTimeOther: {},
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  replyBarLine: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  replyBarLabel: {
    fontSize: FontSize.sm,
    fontWeight: 600,
  },
  replyBarContent: {
    fontSize: FontSize.sm,
  },
  replyBarClose: {
    padding: Spacing.one,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginBottom: 4,
  },
  replyPreviewText: {
    fontSize: FontSize.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    marginHorizontal: Spacing.two,
    marginBottom: 45,
    borderRadius: BorderRadius.lg,
    gap: Spacing.two,
    ...Shadow.elevated,
  },
  imageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  imageBtnText: {
    fontSize: FontSize.lg,
    fontWeight: 700,
    lineHeight: 22,
    color: Brand.primary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSize.base,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  editModal: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.elevated,
  },
  editTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,
    marginBottom: Spacing.three,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.base,
    maxHeight: 120,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  editCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  editCancelText: {
    fontWeight: 600,
    fontSize: FontSize.base,
  },
  editSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  editSaveText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  scrollToBottom: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.elevated,
  },
})
