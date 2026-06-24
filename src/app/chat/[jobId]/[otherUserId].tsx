import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View, Dimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  sender_id: string
  content: string
  image_url: string | null
  edited_at: string | null
  deleted: boolean
  created_at: string
}

const SCREEN_WIDTH = Dimensions.get('window').width
const IMAGE_MAX_W = SCREEN_WIDTH * 0.55
const IMAGE_MAX_H = 260

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

function shouldShowDateSeparator(messages: Message[], index: number) {
  if (index === 0) return true
  const curr = new Date(messages[index].created_at).toDateString()
  const prev = new Date(messages[index - 1].created_at).toDateString()
  return curr !== prev
}

export default function ChatDetailScreen() {
  const { user } = useAuth()
  const { jobId, otherUserId } = useLocalSearchParams<{ jobId: string; otherUserId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [otherName, setOtherName] = useState('')
  const [otherAvatarUrl, setOtherAvatarUrl] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editText, setEditText] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [scrolledUp, setScrolledUp] = useState(false)
  const flatRef = useRef<FlatList>(null)

  const loadInitial = useCallback(async () => {
    if (!jobId || !otherUserId || !user) return
    const [msgsRes, jobRes, otherRes] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }),
      supabase.from('jobs').select('title').eq('id', jobId).single(),
      supabase.from('users').select('display_name, avatar_url').eq('id', otherUserId).single(),
    ])
    if (msgsRes.data) setMessages(msgsRes.data as any)
    if (jobRes.data) setJobTitle((jobRes.data as any).title || '')
    if (otherRes.data) {
      setOtherName((otherRes.data as any).display_name || 'Anonymous')
      setOtherAvatarUrl((otherRes.data as any).avatar_url || null)
    }
  }, [jobId, otherUserId, user])

  useEffect(() => { loadInitial() }, [loadInitial])

  useEffect(() => {
    if (!jobId || !otherUserId || !user) return
    const key = `${jobId}-${otherUserId}`
    try {
      AsyncStorage.getItem('chat_last_read').then((val) => {
        const map = val ? new Map(JSON.parse(val)) : new Map()
        map.set(key, Date.now())
        AsyncStorage.setItem('chat_last_read', JSON.stringify(Array.from(map.entries())))
      })
    } catch {}
  }, [jobId, otherUserId, user])

  useEffect(() => {
    if (!jobId) return
    const sub = supabase
      .channel(`chat-messages-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new as any
          if (m.sender_id === user?.id || m.receiver_id === user?.id) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === m.id)) return prev
              return [...prev, m]
            })
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
    setInput('')
    await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: text,
    })
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
      await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: '',
        image_url: publicUrl,
      })
    } catch (e) {
      console.error('Image send failed', e)
    }
    setImageUploading(false)
  }

  const handleLongPress = (msg: Message) => {
    if (msg.sender_id !== user?.id) return
    Alert.alert('Message', undefined, [
      {
        text: 'Edit',
        onPress: () => {
          setEditText(msg.content)
          setEditingMessage(msg)
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete message?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await supabase.from('messages').update({ deleted: true }).eq('id', msg.id)
              },
            },
          ])
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return
    await supabase
      .from('messages')
      .update({ content: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', editingMessage.id)
    setEditingMessage(null)
    setEditText('')
  }

  const handleScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height
    setScrolledUp(distanceFromBottom > 100)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Brand.primary} />
        </Pressable>
        <Pressable onPress={() => router.push(otherUserId === user?.id ? '/(tabs)/profile' : `/user/${otherUserId}`)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {otherAvatarUrl ? (
            <Image source={{ uri: otherAvatarUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
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
            onScroll={handleScroll}
            scrollEventThrottle={100}
            renderItem={({ item, index }) => {
              const isMine = item.sender_id === user?.id
              const showDateSep = shouldShowDateSeparator(messages, index)
              return (
                <View>
                  {showDateSep && (
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateSepLine} />
                      <ThemedText style={styles.dateSepText}>
                        {formatDateSeparator(item.created_at)}
                      </ThemedText>
                      <View style={styles.dateSepLine} />
                    </View>
                  )}
                  {item.deleted ? (
                    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                      <View style={[styles.bubble, styles.bubbleDeleted]}>
                        <ThemedText style={styles.bubbleDeletedText}>Message deleted</ThemedText>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onLongPress={() => handleLongPress(item)}
                      delayLongPress={400}
                    >
                      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                          {item.image_url ? (
                            <Pressable onPress={() => setPreviewImage(item.image_url)}>
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
                                · edited
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )}
                </View>
              )
            }}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                <View style={{ alignItems: 'center', paddingVertical: Spacing.five }}>
                  <Ionicons name="chatbox-ellipses-outline" size={48} color={Brand.textSecondary} />
                  <ThemedText type="small" style={{ color: Brand.textSecondary }}>No messages yet. Say hello!</ThemedText>
                </View>
              </View>
            }
          />
          {scrolledUp && (
            <Pressable style={styles.scrollToBottom} onPress={() => { flatRef.current?.scrollToEnd({ animated: true }); setScrolledUp(false) }}>
              <Ionicons name="chevron-down" size={22} color={Brand.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.inputBar}>
          <Pressable style={styles.imageBtn} onPress={handlePickImage} disabled={imageUploading}>
            <ThemedText style={styles.imageBtnText}>{imageUploading ? '...' : '+'}</ThemedText>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Brand.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <Pressable style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]} onPress={handleSend} disabled={!input.trim() || sending}>
            <Ionicons name="send" size={20} color={Brand.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!editingMessage} transparent animationType="fade" onRequestClose={() => setEditingMessage(null)}>
        <Pressable style={styles.editOverlay} onPress={() => setEditingMessage(null)}>
          <Pressable style={styles.editModal} onPress={() => {}}>
            <ThemedText style={styles.editTitle}>Edit Message</ThemedText>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={1000}
              autoFocus
              placeholderTextColor={Brand.placeholder}
            />
            <View style={styles.editActions}>
              <Pressable style={styles.editCancelBtn} onPress={() => setEditingMessage(null)}>
                <ThemedText style={styles.editCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.editSaveBtn, !editText.trim() && { opacity: 0.4 }]} onPress={handleSaveEdit} disabled={!editText.trim()}>
                <ThemedText style={styles.editSaveText}>Save</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImage(null)}>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
    backgroundColor: Brand.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryLight,
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
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: Brand.primary,
    fontWeight: 700,
    fontSize: FontSize.sm,
  },
  headerName: {
    fontWeight: 700,
    fontSize: FontSize.base,
    color: Brand.text,
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
    backgroundColor: Brand.borderLight,
  },
  dateSepText: {
    fontSize: FontSize.sm,
    color: Brand.textSecondary,
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
    backgroundColor: Brand.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Brand.white,
    borderBottomLeftRadius: 4,
    ...Shadow.card,
  },
  bubbleDeleted: {
    backgroundColor: Brand.borderLight,
    borderBottomRightRadius: 4,
  },
  bubbleDeletedText: {
    fontSize: FontSize.sm,
    color: Brand.textSecondary,
    fontStyle: 'italic',
  },
  bubbleText: {
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: Brand.white,
  },
  bubbleTextOther: {
    color: Brand.text,
  },
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
  bubbleTimeOther: {
    color: Brand.textSecondary,
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
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  imageBtnText: {
    color: Brand.primary,
    fontSize: FontSize.lg,
    fontWeight: 700,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.borderLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSize.base,
    maxHeight: 100,
    backgroundColor: Brand.bg,
    color: Brand.text,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    flex: 1,
    backgroundColor: Brand.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  editModal: {
    width: '100%',
    backgroundColor: Brand.bg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.elevated,
  },
  editTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,
    color: Brand.text,
    marginBottom: Spacing.three,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Brand.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Brand.text,
    backgroundColor: Brand.bg,
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
    backgroundColor: Brand.bg,
  },
  editCancelText: {
    color: Brand.textSecondary,
    fontWeight: 600,
    fontSize: FontSize.base,
  },
  editSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Brand.primary,
  },
  editSaveText: {
    color: Brand.white,
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
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.elevated,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
})
