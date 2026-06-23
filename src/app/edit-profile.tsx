import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, ScrollView, View, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'

import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import { PickerModal } from '@/components/picker-modal'
import { BorderRadius, Brand, Shadow, Spacing, FontSize } from '@/constants/theme'
import { REGIONS } from '@/lib/regions'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function EditProfileScreen() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
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
        setBio(u.bio || '')
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
    const updates: any = { display_name: displayName || null, phone: phone || null, bio: bio || null, city: city || null, region: region || null }
    if (avatarUrl) updates.avatar_url = avatarUrl
    const { error } = await supabase.from('users').update(updates).eq('id', user.id)
    if (!error) { setSaved(true); setTimeout(() => router.back(), 800) }
    setSaving(false)
  }

  const initial = (displayName || user?.email || '?')[0].toUpperCase()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.bg }}>
        <LottieView
          source={require('@/assets/images/crew-loader.json')}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Brand.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {error && <ThemedText type="small" style={{ color: Brand.danger, textAlign: 'center', marginBottom: Spacing.three }}>{error}</ThemedText>}

          <Pressable onPress={handlePickImage} style={styles.avatarContainer} disabled={imageUploading}>
            {(localAvatarUri || avatarUrl) ? (
              <Image source={{ uri: localAvatarUri || avatarUrl! }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
              </View>
            )}
            <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: 600, marginTop: Spacing.two }}>
              {imageUploading ? 'Uploading...' : 'Tap to change photo'}
            </ThemedText>
          </Pressable>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>Display Name</ThemedText>
            <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={Brand.placeholder} value={displayName} onChangeText={setDisplayName} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>Bio</ThemedText>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Tell people about yourself..." placeholderTextColor={Brand.placeholder} value={bio} onChangeText={setBio} multiline />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>Phone</ThemedText>
            <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor={Brand.placeholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>Region</ThemedText>
            <Pressable style={styles.pickerBtn} onPress={() => setShowRegionPicker(true)}>
              <ThemedText type="small" style={!region ? { color: Brand.placeholder } : {}}>{region || 'Select region'}</ThemedText>
            </Pressable>
            <PickerModal visible={showRegionPicker} title="Select Region" options={regionList} selected={region} onSelect={setRegion} onClose={() => setShowRegionPicker(false)} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="caption" style={styles.label}>City</ThemedText>
            <Pressable style={styles.pickerBtn} onPress={() => setShowCityPicker(true)}>
              <ThemedText type="small" style={!city ? { color: Brand.placeholder } : {}}>{city || 'Select city'}</ThemedText>
            </Pressable>
            <PickerModal visible={showCityPicker} title="Select City" options={cityList} selected={city} onSelect={setCity} onClose={() => setShowCityPicker(false)} />
          </View>

          {saved && <ThemedText type="small" style={{ color: Brand.success, textAlign: 'center', fontWeight: 700 }}>Saved!</ThemedText>}

          <Pressable style={({pressed}) => [styles.saveBtn, { opacity: saving ? 0.6 : pressed ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <ThemedText style={styles.saveBtnText}>Save</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    lineHeight: 28,
    fontWeight: 700,
    color: Brand.text,
  },
  content: {
    padding: Spacing.four,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Brand.primaryLight,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 700,
    color: Brand.white,
  },
  formGroup: {
    marginTop: Spacing.four,
  },
  label: {
    fontWeight: 600,
    color: Brand.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.base,
    backgroundColor: Brand.white,
    color: Brand.text,
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: Brand.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Brand.white,
  },
  saveBtn: {
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.six,
    ...Shadow.elevated,
  },
  saveBtnText: {
    color: Brand.white,
    fontSize: FontSize.base,
    fontWeight: 700,
  },
})
