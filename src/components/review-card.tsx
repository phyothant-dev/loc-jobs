import { useState } from 'react'
import { Alert, Image, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { StarRating } from '@/components/star-rating'
import { ThemedText } from '@/components/themed-text'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/contexts/LocaleContext'
import { useBrand } from "@/contexts/ThemeContext";

interface ReviewItem {
  id: string
  reviewer_id: string
  reviewer_name: string
  reviewer_avatar: string | null
  rating: number
  comment: string | null
  created_at: string
}

interface ReviewCardProps {
  review: ReviewItem
  isOwn: boolean
  onUpdated: () => void
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

export function ReviewCard({ review, isOwn, onUpdated }: ReviewCardProps) {
  const Brand = useBrand();

  const { t } = useLocale()
  const [editOpen, setEditOpen] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editComment, setEditComment] = useState(review.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const handleDelete = () => {
    Alert.alert(t('jobDetail.deleteReview'), t('jobDetail.deleteReviewConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('reviews').delete().eq('id', review.id)
          onUpdated()
        },
      },
    ])
  }

  const handleEdit = async () => {
    setSubmitting(true)
    await supabase.from('reviews').update({
      rating: editRating,
      comment: editComment || null,
    }).eq('id', review.id)
    setSubmitting(false)
    setEditOpen(false)
    onUpdated()
  }

  const initial = (review.reviewer_name || '?')[0].toUpperCase()

  return (
    <View style={[styles.card, { backgroundColor: Brand.white }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: Brand.primaryLight }]}>
          {review.reviewer_avatar ? (
            <Image source={{ uri: review.reviewer_avatar }} style={styles.avatarImg} />
          ) : (
            <ThemedText style={styles.avatarText}>{initial}</ThemedText>
          )}
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {review.reviewer_name}
          </ThemedText>
          <StarRating rating={review.rating} size={12} />
        </View>
        <View style={styles.headerRight}>
          <ThemedText type="caption" style={{ color: Brand.textSecondary }}>
            {relativeTime(review.created_at, t)}
          </ThemedText>
          {isOwn && (
            <View style={styles.actions}>
              <Pressable onPress={() => { setEditRating(review.rating); setEditComment(review.comment || ''); setEditOpen(true) }} hitSlop={8}>
                <Ionicons name="pencil" size={16} color={Brand.textSecondary} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={Brand.danger} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
      {review.comment ? (
        <ThemedText type="small" style={{ color: Brand.text, marginTop: Spacing.two }}>
          {review.comment}
        </ThemedText>
      ) : null}

      <Modal visible={editOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: Brand.white }]} onPress={() => {}}>
            <ThemedText style={styles.modalTitle}>{t('jobDetail.editReview')}</ThemedText>
            <View style={{ alignItems: 'center', marginVertical: Spacing.three }}>
              <StarRating rating={editRating} size={36} interactive onChange={setEditRating} />
            </View>
            <TextInput
              style={[styles.commentInput, { backgroundColor: Brand.bg }]}
              placeholder={t('jobDetail.writeReview')}
              placeholderTextColor={Brand.textSecondary}
              value={editComment}
              onChangeText={setEditComment}
              multiline
              maxLength={500}
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.cancelBtn, { backgroundColor: Brand.bg }]} onPress={() => setEditOpen(false)}>
                <ThemedText style={styles.cancelText}>{t('common.cancel')}</ThemedText>
              </Pressable>
              <Pressable style={[styles.submitBtn, { backgroundColor: Brand.primary }]} onPress={handleEdit} disabled={submitting}>
                <ThemedText style={styles.submitText}>{t('common.save')}</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.three,
    gap: 2,
  },
  name: {
    fontWeight: 700,
    fontSize: FontSize.base,

  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.five,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: 700,

    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  commentInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    fontSize: FontSize.base,

    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,

    alignItems: 'center',
  },
  cancelText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,

    alignItems: 'center',
  },
  submitText: {
    fontWeight: 700,
    fontSize: FontSize.base,
  },
})
