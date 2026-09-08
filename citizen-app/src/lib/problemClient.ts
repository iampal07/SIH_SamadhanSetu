import { supabaseClient } from "./supabaseClient";

export type ProblemSubmissionInput = {
  title: string;
  description: string;
  category: string;
  district: string;
  villageLocality: string;
  peopleAffected?: number;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  images: File[];
  citizenId: string;
};

export type SubmittedProblem = {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  category: string;
  district: string;
  villageLocality: string;
  peopleAffected?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyM?: number | null;
  status: string;
  createdAt: string;
  evidence: Array<{ id: string; fileUrl: string }>;
};

// Generate challenge tracking code: JH-YYYY-XXXXXX
async function generateClientChallengeId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JH-${year}-`;
  try {
    const { count, error } = await supabaseClient
      .from("challenges")
      .select("code", { count: "exact", head: true })
      .ilike("code", `${prefix}%`);

    if (error || count === null) {
      const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
      return `CH-${fallbackSeq}`;
    }

    const sequence = String((count ?? 0) + 1).padStart(6, "0");
    return `${prefix}${sequence}`;
  } catch {
    const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
    return `CH-${fallbackSeq}`;
  }
}

export async function submitProblemClient(
  input: ProblemSubmissionInput
): Promise<{ id: string; challengeId: string }> {
  // 1. Generate tracking code
  const challengeCode = await generateClientChallengeId();
  const year = new Date().getFullYear();

  // 2. Upload images to Supabase Storage 'attachments'
  const savedUrls: string[] = [];
  const mediaRecords: Array<{ url: string; file_name: string }> = [];

  for (const file of input.images) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileUid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `${fileUid}.${ext}`;
    const storagePath = `citizen/${year}/${challengeCode}/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Storage upload warning:", uploadError.message);
    } else {
      const { data } = supabaseClient.storage
        .from("attachments")
        .getPublicUrl(storagePath);

      if (data?.publicUrl) {
        savedUrls.push(data.publicUrl);
        mediaRecords.push({ url: data.publicUrl, file_name: file.name });
      }
    }
  }

  // 3. Insert challenge record into 'challenges' table
  const { data: challenge, error: insertError } = await supabaseClient
    .from("challenges")
    .insert({
      code: challengeCode,
      citizen_id: input.citizenId,
      title: input.title,
      description: input.description,
      category: input.category || "Other",
      district: input.district,
      village: input.villageLocality,
      affected_population: input.peopleAffected ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_accuracy_m: input.locationAccuracyM ?? null,
      status: "submitted",
      validation_status: "pending",
      attachments: savedUrls,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to submit challenge: ${insertError.message}`);
  }

  // 4. Insert media references into 'challenge_media' table if applicable
  if (mediaRecords.length > 0 && challenge) {
    const mediaToInsert = mediaRecords.map((m) => ({
      challenge_id: challenge.id,
      challenge_code: challenge.code,
      url: m.url,
      file_name: m.file_name,
      media_type: "image",
    }));

    await supabaseClient.from("challenge_media").insert(mediaToInsert).select();
  }

  // 5. Kick off the same AI pipeline the website uses (Gemini key stays
  // server-side in the edge function's secrets). Never blocks the citizen's
  // submission on AI availability — the website re-runs it if it fails here.
  try {
    await supabaseClient.functions.invoke("ai-analyze", {
      body: {
        challengeCode: challenge.code,
        title: challenge.title,
        description: challenge.description,
        district: challenge.district,
        village: challenge.village,
        affected: challenge.affected_population ?? 0,
      },
    });
  } catch (aiError) {
    console.warn("AI analysis could not be started:", aiError);
  }

  return { id: challenge.id, challengeId: challenge.code };
}

export async function fetchCitizenChallenges(citizenId: string): Promise<SubmittedProblem[]> {
  const { data, error } = await supabaseClient
    .from("challenges")
    .select("*")
    .eq("citizen_id", citizenId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    challengeId: p.code,
    title: p.title,
    description: p.description,
    category: p.category,
    district: p.district,
    villageLocality: p.village,
    peopleAffected: p.affected_population,
    latitude: p.latitude,
    longitude: p.longitude,
    locationAccuracyM: p.location_accuracy_m,
    status: p.status ? p.status.toUpperCase() : "SUBMITTED",
    createdAt: p.created_at,
    evidence: (p.attachments || []).map((url: string, i: number) => ({
      id: `${p.id}-${i}`,
      fileUrl: url,
    })),
  }));
}

export async function fetchChallengeDetail(idOrCode: string): Promise<SubmittedProblem | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

  let query = supabaseClient.from("challenges").select("*");
  if (isUuid) {
    query = query.eq("id", idOrCode);
  } else {
    query = query.eq("code", idOrCode);
  }

  const { data: challenge, error } = await query.maybeSingle();
  if (error || !challenge) return null;

  const { data: media } = await supabaseClient
    .from("challenge_media")
    .select("*")
    .or(`challenge_id.eq.${challenge.id},challenge_code.eq.${challenge.code}`);

  const evidence: Array<{ id: string; fileUrl: string }> =
    media && media.length > 0
      ? media.map((m: { id: string; url: string }) => ({ id: m.id, fileUrl: m.url }))
      : (challenge.attachments || []).map((url: string, idx: number) => ({
          id: `${challenge.id}-${idx}`,
          fileUrl: url,
        }));

  return {
    id: challenge.id,
    challengeId: challenge.code,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    district: challenge.district,
    villageLocality: challenge.village,
    peopleAffected: challenge.affected_population,
    latitude: challenge.latitude,
    longitude: challenge.longitude,
    locationAccuracyM: challenge.location_accuracy_m,
    status: challenge.status ? challenge.status.toUpperCase() : "SUBMITTED",
    createdAt: challenge.created_at,
    evidence,
  };
}
