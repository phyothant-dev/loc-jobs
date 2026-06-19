import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import * as FileSystem from 'expo-file-system/legacy'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'
import { PickerModal } from '@/components/picker-modal'
import { BorderRadius, Brand, Shadow, Spacing } from '@/constants/theme'
import { REGIONS } from '@/lib/regions'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const WORK_TYPES = ['onsite', 'remote', 'hybrid'] as const

export default function PostJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workType, setWorkType] = useState<'onsite' | 'remote' | 'hybrid'>('onsite')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [existingUrls, setExistingUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [showRegionPicker, setShowRegionPicker] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)

  const regionList = Object.keys(REGIONS).sort()
  const cityList = region ? (REGIONS[region] || []).sort() : Object.values(REGIONS).flat().sort()

  useEffect(() => {
    if (!isEdit || !id) return
    ;(async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single()
      if (data) {
        const j = data as any
        setTitle(j.title || '')
        setDescription(j.description || '')
        setWorkType(j.work_type || 'onsite')
        setAddress(j.address || '')
        setCity(j.city || '')
        setRegion(j.region || '')
        setPrice(j.price ? String(j.price) : '')
        setExistingUrls(j.image_urls || [])
      }
      setInitialLoading(false)
    })()
  }, [id, isEdit])

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)])
    }
  }

  const uploadNewImages = async (): Promise<string[]> => {
    if (images.length === 0 || !user) return []
    const urls: string[] = []
    setUploading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) return []
    for (const uri of images) {
      try {
        const ext = (uri.split('.').pop() || 'jpg').toLowerCase()
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const uploadRes = await FileSystem.uploadAsync(
          `https://axuroixwxueufgvodnde.supabase.co/storage/v1/object/job-images/${fileName}?upsert=true`,
          uri,
          {
            httpMethod: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': mime,
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          }
        )
        if (uploadRes.status < 200 || uploadRes.status >= 300) {
          console.error('Upload failed:', uploadRes.body)
          continue
        }
        const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-images/${fileName}`
        urls.push(publicUrl)
      } catch (e) {
        console.error('Upload error:', e)
      }
    }
    setUploading(false)
    return urls
  }

  const handlePost = async () => {
    if (!title || !city) {
      setError('Title and city are required')
      return
    }
    if (!user) return
    setLoading(true)
    setError(null)
    let lat: number | null = null
    let lng: number | null = null
    if (workType !== 'remote') {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({})
          lat = loc.coords.latitude
          lng = loc.coords.longitude
        } catch {}
      }
    }
    const newUrls = await uploadNewImages()
    const allUrls = [...existingUrls, ...newUrls]
    if (isEdit) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ title, description: description || null, work_type: workType, address: address || null, city, region: region || null, price: price ? parseFloat(price) : null, image_urls: allUrls.length > 0 ? allUrls : null })
        .eq('id', id!)
      if (updateError) setError(updateError.message)
      else router.back()
    } else {
      const { error: insertError } = await supabase.rpc('post_job', {
        p_uploader_id: user.id, p_title: title, p_description: description || null, p_work_type: workType, p_address: address || null, p_city: city, p_region: region || null, p_price: price ? parseFloat(price) : null, p_image_urls: allUrls.length > 0 ? allUrls : null, p_lat: lat, p_lng: lng,
      })
      if (insertError) setError(insertError.message)
      else router.back()
    }
    setLoading(false)
  }

  const handleDelete = () => {
    if (!id) return
    Alert.alert('Delete Job', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true)
        const { error: deleteError } = await supabase.from('jobs').delete().eq('id', id)
        if (deleteError) { setError(deleteError.message); setLoading(false) }
        else router.back()
      }},
    ])
  }

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index))
  const removeExistingImage = (index: number) => setExistingUrls((prev) => prev.filter((_, i) => i !== index))

  if (initialLoading) {
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <ThemedText style={{ color: Brand.primary, fontWeight: '700', fontSize: 15 }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.headerTitle}>{isEdit ? 'Edit Job' : 'Post a Job'}</ThemedText>
            <View style={{ width: 50 }} />
          </View>

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Title *</ThemedText>
            <TextInput style={styles.input} placeholder="e.g. Need help moving" placeholderTextColor={Brand.placeholder} value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the job..." placeholderTextColor={Brand.placeholder} value={description} onChangeText={setDescription} multiline numberOfLines={4} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Work Type</ThemedText>
            <View style={styles.workTypeRow}>
              {WORK_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.workTypeBtn, workType === type && styles.workTypeSelected]}
                  onPress={() => setWorkType(type)}
                >
                  <ThemedText style={[styles.workTypeText, workType === type && styles.workTypeTextSelected]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {workType !== 'remote' && (
            <>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Address</ThemedText>
                <TextInput style={styles.input} placeholder="Street address" placeholderTextColor={Brand.placeholder} value={address} onChangeText={setAddress} />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Region *</ThemedText>
                <Pressable style={styles.pickerBtn} onPress={() => setShowRegionPicker(true)}>
                  <ThemedText style={!region ? { color: Brand.placeholder } : { color: Brand.text }}>
                    {region || 'Select region'}
                  </ThemedText>
                </Pressable>
                <PickerModal visible={showRegionPicker} title="Select Region" options={regionList} selected={region} onSelect={setRegion} onClose={() => setShowRegionPicker(false)} />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>City *</ThemedText>
                <Pressable style={styles.pickerBtn} onPress={() => setShowCityPicker(true)}>
                  <ThemedText style={!city ? { color: Brand.placeholder } : { color: Brand.text }}>
                    {city || 'Select city'}
                  </ThemedText>
                </Pressable>
                <PickerModal visible={showCityPicker} title="Select City" options={cityList} selected={city} onSelect={setCity} onClose={() => setShowCityPicker(false)} />
              </View>
            </>
          )}

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Price (MMK)</ThemedText>
            <TextInput style={styles.input} placeholder="e.g. 15000" placeholderTextColor={Brand.placeholder} value={price} onChangeText={setPrice} keyboardType="numeric" />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Photos (optional)</ThemedText>
            {existingUrls.length > 0 && (
              <>
                <ThemedText style={{ fontSize: 12, marginBottom: Spacing.half, color: Brand.textSecondary }}>Existing photos</ThemedText>
                <View style={styles.imageRow}>
                  {existingUrls.map((url, i) => (
                    <View key={`e-${i}`} style={styles.imageWrap}>
                      <Image source={{ uri: url }} style={styles.thumb} />
                      <Pressable style={styles.removeBtn} onPress={() => removeExistingImage(i)}>
                        <ThemedText style={styles.removeBtnText}>X</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
            {images.length > 0 && (
              <View style={styles.imageRow}>
                {images.map((uri, i) => (
                  <View key={`n-${i}`} style={styles.imageWrap}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <Pressable style={styles.removeBtn} onPress={() => removeImage(i)}>
                      <ThemedText style={styles.removeBtnText}>X</ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Pressable style={styles.addImageBtn} onPress={pickImages}>
              <ThemedText style={styles.addImageText}>
                {images.length > 0 || existingUrls.length > 0 ? '+ Add More' : '+ Add Photos'}
              </ThemedText>
            </Pressable>
          </View>

          <Pressable
            style={[styles.submitBtn, (loading || uploading) && { opacity: 0.6 }]}
            onPress={handlePost}
            disabled={loading || uploading}
          >
            <ThemedText style={styles.submitText}>
              {uploading ? 'Uploading...' : loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Post Job'}
            </ThemedText>
          </Pressable>

          {isEdit && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <ThemedText style={styles.deleteText}>Delete Job</ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.text,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  workTypeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  workTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    backgroundColor: Brand.white,
  },
  workTypeSelected: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  workTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  workTypeTextSelected: {
    color: Brand.white,
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Brand.white,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  imageWrap: {
    position: 'relative',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Brand.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: Brand.white,
    fontSize: 12,
    fontWeight: '800',
  },
  addImageBtn: {
    borderWidth: 1.5,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.half,
  },
  addImageText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.four,
    ...Shadow.button,
  },
  submitText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Brand.danger,
    marginTop: Spacing.two,
    marginBottom: Spacing.six,
  },
  deleteText: {
    color: Brand.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: Brand.danger,
    textAlign: 'center',
    marginBottom: Spacing.two,
    fontSize: 13,
  },
})