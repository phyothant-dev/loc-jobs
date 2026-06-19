import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, ScrollView, View, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'

import { ThemedText } from '@/components/themed-text'
import { PickerModal } from '@/components/picker-modal'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'
import { REGIONS } from '@/lib/regions'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function EditProfileScreen() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [showRegionPicker, setShowRegionPicker] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)

  const regionList = Object.keys(REGIONS).sort()
  const cityList = region ? (REGIONS[region] || []).sort() : Object.values(REGIONS).flat().sort()

  useEffect(() => {
    if (!user) return
    ;(async () => {
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
    })()
  }, [user])

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0] || !user) return
    const uri = result.assets[0].uri
    setLocalAvatarUri(uri)
    setImageUploading(true)
    setError(null)
    try {
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase()
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
      const fileName = `${user.id}/avatar.${ext}`
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) { setError('Not authenticated'); setImageUploading(false); return }
      const uploadRes = await FileSystem.uploadAsync(
        `https://axuroixwxueufgvodnde.supabase.co/storage/v1/object/job-images/${fileName}?upsert=true`,
        uri,
        { httpMethod: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': mime, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      )
      if (uploadRes.status < 200 || uploadRes.status >= 300) {
        console.error('Avatar upload failed:', uploadRes.status, uploadRes.body)
        setError('Upload failed')
      } else {
        const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-images/${fileName}`
        setAvatarUrl(publicUrl)
      }
    } catch (e: any) {
      setError('Upload failed')
    }
    setImageUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    const updates: any = { display_name: displayName || null, phone: phone || null, city: city || null, region: region || null }
    if (avatarUrl) updates.avatar_url = avatarUrl
    const { error } = await supabase.from('users').update(updates).eq('id', user.id)
    if (!error) { setSaved(true); setTimeout(() => router.back(), 800) }
    setSaving(false)
  }

  const initial = (displayName || user?.email || '?')[0].toUpperCase()

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: Brand.primary, fontWeight: '700', fontSize: 15 }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable onPress={handlePickImage} style={styles.avatarContainer} disabled={imageUploading}>
            {(localAvatarUri || avatarUrl) ? (
              <Image source={{ uri: localAvatarUri || avatarUrl! }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
              </View>
            )}
            <ThemedText style={styles.avatarLabel}>
              {imageUploading ? 'Uploading...' : 'Tap to change photo'}
            </ThemedText>
          </Pressable>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Display Name</ThemedText>
            <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={Brand.placeholder} value={displayName} onChangeText={setDisplayName} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor={Brand.placeholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Region</ThemedText>
            <Pressable style={styles.pickerBtn} onPress={() => setShowRegionPicker(true)}>
              <ThemedText style={!region ? { color: Brand.placeholder } : { color: Brand.text }}>
                {region || 'Select region'}
              </ThemedText>
            </Pressable>
            <PickerModal visible={showRegionPicker} title="Select Region" options={regionList} selected={region} onSelect={setRegion} onClose={() => setShowRegionPicker(false)} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>City</ThemedText>
            <Pressable style={styles.pickerBtn} onPress={() => setShowCityPicker(true)}>
              <ThemedText style={!city ? { color: Brand.placeholder } : { color: Brand.text }}>
                {city || 'Select city'}
              </ThemedText>
            </Pressable>
            <PickerModal visible={showCityPicker} title="Select City" options={cityList} selected={city} onSelect={setCity} onClose={() => setShowCityPicker(false)} />
          </View>

          {saved && <ThemedText style={{ color: Brand.success, textAlign: 'center', marginTop: Spacing.two, fontWeight: '700', fontSize: 15 }}>Saved!</ThemedText>}

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <ThemedText style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</ThemedText>
          </Pressable>
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
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.text,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
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
  avatarLabel: {
    fontSize: 14,
    color: Brand.primary,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  formGroup: {
    marginTop: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: Brand.white,
    color: Brand.text,
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Brand.white,
  },
  error: {
    color: Brand.danger,
    textAlign: 'center',
    marginBottom: Spacing.two,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.four,
    ...Shadow.button,
  },
  saveText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
  },
})