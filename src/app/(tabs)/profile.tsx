import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, ScrollView, View, Image } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { BorderRadius, BottomTabInset, Brand, Shadow, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (data) {
      const u = data as any
      setDisplayName(u.display_name || '')
      setPhone(u.phone || '')
      setCity(u.city || '')
      setRegion(u.region || '')
      setAvatarUrl(u.avatar_url || null)
    }
    setLoading(false)
  }, [user])

  useFocusEffect(useCallback(() => {
    loadProfile()
  }, [loadProfile]))

  const initial = (displayName || user?.email || '?')[0].toUpperCase()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <Pressable onPress={signOut} style={styles.signOutBtn}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            <>
              <View style={styles.avatarCard}>
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatar}>
                      <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
              </View>

              <View style={styles.profileCard}>
                {displayName && (
                  <View style={styles.fieldRow}>
                    <ThemedText style={styles.fieldLabel}>Name</ThemedText>
                    <ThemedText style={styles.fieldValue}>{displayName}</ThemedText>
                  </View>
                )}
                {phone && (
                  <View style={styles.fieldRow}>
                    <ThemedText style={styles.fieldLabel}>Phone</ThemedText>
                    <ThemedText style={styles.fieldValue}>{phone}</ThemedText>
                  </View>
                )}
                {city && (
                  <View style={styles.fieldRow}>
                    <ThemedText style={styles.fieldLabel}>City</ThemedText>
                    <ThemedText style={styles.fieldValue}>{city}</ThemedText>
                  </View>
                )}
                {region && (
                  <View style={styles.fieldRow}>
                    <ThemedText style={styles.fieldLabel}>Region</ThemedText>
                    <ThemedText style={styles.fieldValue}>{region}</ThemedText>
                  </View>
                )}
                {!displayName && !phone && !city && (
                  <ThemedText style={{ color: Brand.textSecondary }}>No info set yet</ThemedText>
                )}
              </View>

              <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile' as any)}>
                <ThemedText style={styles.editBtnText}>Edit Profile</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.text,
  },
  signOutBtn: {
    backgroundColor: Brand.dangerLight,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  signOutText: {
    color: Brand.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    backgroundColor: Brand.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Brand.primaryLight,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '800',
    color: Brand.white,
  },
  emailText: {
    marginTop: Spacing.two,
    color: Brand.textSecondary,
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: Brand.white,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  fieldLabel: {
    fontSize: 14,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.text,
  },
  editBtn: {
    backgroundColor: Brand.primary,
    padding: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    ...Shadow.button,
  },
  editBtnText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
  },
})