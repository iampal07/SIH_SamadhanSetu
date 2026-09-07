import { supabase, isSupabaseConfigured } from './supabase';

/* Media belongs in Supabase Storage, never inside a database row. We only fall
   back to an inline data URL for small files when Storage is unavailable, and
   never for anything large — bigger files fall back to a session-only blob URL
   which the persistence layer deliberately skips. */
const INLINE_FALLBACK_LIMIT = 1.5 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

async function localFallback(file, fileType, fileSizeMb) {
  const url = file.size <= INLINE_FALLBACK_LIMIT
    ? (await fileToBase64(file)) || URL.createObjectURL(file)
    : URL.createObjectURL(file);
  return { name: file.name, url, size: fileSizeMb, type: fileType, storagePath: null };
}

/**
 * Uploads a file (image, pdf, document) to Supabase Storage bucket
 * Returns { name, url, size, type } with durable base64 fallback
 */
export async function uploadFileToSupabase(file, bucket = 'attachments', userId = 'anon') {
  if (!file) {
    return {
      name: 'attachment.jpg',
      url: '',
      size: '1.0 MB',
      type: 'image',
    };
  }

  const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isVideo = file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|mov|mkv)$/i);
  const fileType = isImage ? 'image' : isVideo ? 'video' : 'doc';
  const fileSizeMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  if (!isSupabaseConfigured) return localFallback(file, fileType, fileSizeMb);

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId || 'anon'}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type || undefined });

    if (uploadError) {
      console.warn(`Supabase storage notice (${bucket}): ${uploadError.message} — falling back to a local preview for this file.`);
      return localFallback(file, fileType, fileSizeMb);
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { name: file.name, url: publicUrl, size: fileSizeMb, type: fileType, storagePath: filePath };
  } catch (err) {
    console.error('File upload failed, using local preview:', err);
    return localFallback(file, fileType, fileSizeMb);
  }
}

/**
 * Inserts a new citizen challenge into public.challenges in Supabase
 */
export async function insertChallengeInDb(challenge) {
  if (!isSupabaseConfigured) return challenge;

  try {
    const record = {
      code: challenge.code || challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category || 'Public Services',
      district: challenge.district,
      village: challenge.village || challenge.district,
      affected_population: Number(challenge.affected) || 0,
      citizen_name: challenge.citizen?.name || 'Citizen',
      citizen_id: challenge.citizen?.id?.startsWith('cit-') ? null : challenge.citizen?.id,
      status: challenge.status || 'submitted',
      validation_status: challenge.validation?.status || 'pending',
      priority_score: challenge.priority?.score || 50,
      priority_level: challenge.priority?.level || 'MEDIUM',
      attachments: challenge.attachments || [],
      upvotes: challenge.upvotes || 1,
    };

    const { data, error } = await supabase
      .from('challenges')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('Database insert notice for challenge:', error.message);
      return challenge;
    }

    return { ...challenge, dbId: data.id };
  } catch (err) {
    console.error('Error saving challenge to Supabase:', err);
    return challenge;
  }
}

/**
 * Updates a challenge in Supabase (e.g. government validation or stage change)
 */
export async function updateChallengeInDb(codeOrId, patch) {
  if (!isSupabaseConfigured || !codeOrId) return;

  try {
    const dbPatch = {};
    if (patch.status) dbPatch.status = patch.status;
    if (patch.validation) {
      dbPatch.validation_status = patch.validation.status;
      dbPatch.validated_by = patch.validation.by;
      dbPatch.validation_notes = patch.validation.note;
    }
    if (patch.priority) {
      dbPatch.priority_score = patch.priority.score;
      dbPatch.priority_level = patch.priority.level;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);
    const query = supabase.from('challenges').update(dbPatch);

    if (isUuid) {
      await query.eq('id', codeOrId);
    } else {
      await query.eq('code', codeOrId);
    }
  } catch (err) {
    console.error('Error updating challenge in Supabase:', err);
  }
}

/**
 * Inserts a university working prototype into public.prototypes_and_proposals
 */
export async function insertPrototypeInDb(prototypeData, challenge) {
  if (!isSupabaseConfigured) return prototypeData;

  try {
    const record = {
      title: prototypeData.title,
      abstract: prototypeData.abstract,
      trl_level: Number(prototypeData.trl) || 6,
      demo_url: prototypeData.demoUrl || null,
      video_demo_url: prototypeData.videoDemoUrl || null,
      estimated_funding_required: Number(prototypeData.estimatedFunding) || 0,
      integration_requirements: prototypeData.integrationRequirements || [],
      faculty_lead: prototypeData.facultyLead || 'Faculty Lead',
      student_contributors: prototypeData.studentContributors || [],
      is_industry_ready: true,
      status: 'published',
      university_name: challenge?.university?.name || 'University Innovation Cell',
    };

    const { data, error } = await supabase
      .from('prototypes_and_proposals')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('Notice saving prototype to Supabase:', error.message);
    }
    return data || prototypeData;
  } catch (err) {
    console.error('Error inserting prototype in Supabase:', err);
    return prototypeData;
  }
}

/**
 * Inserts an industry funding pledge into public.industry_commitments
 */
export async function insertIndustryCommitmentInDb(commitment) {
  if (!isSupabaseConfigured) return commitment;

  try {
    const record = {
      industry_name: commitment.industryName,
      amount_committed: Number(commitment.amount) || 0,
      support_types: commitment.supports || ['Funding'],
      notes: commitment.notes || '',
      mou_status: 'inquiry',
    };

    const { data, error } = await supabase
      .from('industry_commitments')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('Notice saving industry commitment to Supabase:', error.message);
    }
    return data || commitment;
  } catch (err) {
    console.error('Error inserting industry commitment in Supabase:', err);
    return commitment;
  }
}

/**
 * Fetches challenges stored in Supabase database
 */
export async function fetchChallengesFromDb() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice reading challenges from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching challenges from Supabase:', err);
    return [];
  }
}
