import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import { PHOTO_BUCKET, supabase } from '@/lib/supabase'

export type BodyMeasurement = Tables<'body_measurements'>
export type BodyMeasurementInsert = TablesInsert<'body_measurements'>
export type BodyMeasurementUpdate = TablesUpdate<'body_measurements'>

export async function fetchMeasurements(userId: string): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveMeasurement(
  userId: string,
  entry: BodyMeasurementUpdate & { measured_on: string },
): Promise<BodyMeasurement> {
  if (entry.id) {
    const { data, error } = await supabase
      .from('body_measurements')
      .update(entry)
      .eq('id', entry.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ ...entry, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteMeasurement(id: string): Promise<void> {
  const { error } = await supabase.from('body_measurements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Uploads a private progress photo to {userId}/{timestamp}-{name}. */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  return path
}

/** Returns a short-lived signed URL for a private photo. */
export async function getPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}