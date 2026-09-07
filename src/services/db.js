/**
 * Supabase Storage helper.
 *
 * All database reads and writes go through `services/repository.js` — this file
 * only handles binary uploads (citizen evidence) into the `attachments` bucket.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const sizeLabel = (bytes) => `${((bytes || 0) / (1024 * 1024)).toFixed(1)} MB`;
const kindOf = (type) => (type?.startsWith('image/') ? 'image' : type?.startsWith('video/') ? 'video' : 'doc');

/**
 * Uploads one file and returns { name, url, path, size, type }.
 * Falls back to a local object URL so the submission flow never blocks on
 * storage being unavailable — the metadata row still records the file name.
 */
export async function uploadFileToSupabase(file, bucket = 'attachments', userId = 'anon') {
  const fallback = () => ({
    name: file?.name || 'attachment',
    url: file ? URL.createObjectURL(file) : '',
    path: null,
    size: sizeLabel(file?.size),
    type: kindOf(file?.type),
  });

  if (!isSupabaseConfigured || !file) return fallback();

  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId || 'anon'}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.warn('Storage upload notice:', uploadError.message);
      return fallback();
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      name: file.name,
      url: publicUrl,
      path: filePath,
      size: sizeLabel(file.size),
      type: kindOf(file.type),
    };
  } catch (err) {
    console.error('Attachment upload failed:', err);
    return fallback();
  }
}
