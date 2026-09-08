import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { getCitizenId } from "@/lib/citizen";
import { generateChallengeId } from "@/lib/challengeId";
import { problemInputSchema } from "@/lib/validation";
import { saveImageFile, UploadError } from "@/lib/storage";

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? NaN : n;
}

export async function POST(request: NextRequest) {
  const citizenId = await getCitizenId();

  const formData = await request.formData();

  const parsed = problemInputSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    district: formData.get("district") ?? "",
    villageLocality: formData.get("villageLocality") ?? "",
    peopleAffected: parseOptionalNumber(formData.get("peopleAffected")),
    latitude: parseOptionalNumber(formData.get("latitude")),
    longitude: parseOptionalNumber(formData.get("longitude")),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  let savedFiles;
  try {
    savedFiles = await Promise.all(files.map((f) => saveImageFile(f)));
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const challengeCode = await generateChallengeId();

  const affectedCount =
    data.peopleAffected === undefined || Number.isNaN(data.peopleAffected)
      ? null
      : data.peopleAffected;

  const lat = data.latitude === undefined || Number.isNaN(data.latitude) ? null : data.latitude;
  const lng = data.longitude === undefined || Number.isNaN(data.longitude) ? null : data.longitude;

  // Insert problem challenge into Supabase
  const { data: inserted, error: insertError } = await supabase
    .from("challenges")
    .insert({
      code: challengeCode,
      citizen_id: citizenId,
      title: data.title,
      description: data.description,
      category: data.category || "Other",
      district: data.district,
      village: data.villageLocality,
      affected_population: affectedCount,
      latitude: lat,
      longitude: lng,
      status: "submitted",
      validation_status: "pending",
      attachments: savedFiles.map((f) => f.url),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Database insert failed: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Insert records into challenge_media table if attachments exist
  if (savedFiles.length > 0 && inserted?.id) {
    try {
      const mediaRows = savedFiles.map((f) => ({
        challenge_id: inserted.id,
        challenge_code: challengeCode,
        name: f.fileName,
        url: f.url,
        storage_path: f.storagePath,
        media_type: "image",
        uploaded_by: citizenId,
      }));
      await supabase.from("challenge_media").insert(mediaRows);
    } catch {
      // Non-fatal: media already linked in challenges.attachments
    }
  }

  const problem = {
    id: inserted.id,
    challengeId: inserted.code,
    citizenId: inserted.citizen_id,
    title: inserted.title,
    description: inserted.description,
    category: inserted.category,
    district: inserted.district,
    villageLocality: inserted.village,
    peopleAffected: inserted.affected_population,
    latitude: inserted.latitude,
    longitude: inserted.longitude,
    status: inserted.status ? inserted.status.toUpperCase() : "SUBMITTED",
    createdAt: inserted.created_at,
    evidence: savedFiles.map((f, idx) => ({
      id: `${inserted.id}-${idx}`,
      fileUrl: f.url,
      fileType: f.fileType,
    })),
  };

  return NextResponse.json({ problem }, { status: 201 });
}

export async function GET() {
  const citizenId = await getCitizenId();

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("citizen_id", citizenId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const problems = (data || []).map((c) => ({
    id: c.id,
    challengeId: c.code,
    citizenId: c.citizen_id,
    title: c.title,
    description: c.description,
    category: c.category,
    district: c.district,
    villageLocality: c.village,
    peopleAffected: c.affected_population,
    latitude: c.latitude,
    longitude: c.longitude,
    status: c.status ? c.status.toUpperCase() : "SUBMITTED",
    createdAt: new Date(c.created_at),
    evidence: (c.attachments || []).map((url: string, idx: number) => ({
      id: `${c.id}-${idx}`,
      fileUrl: url,
      fileType: "image",
    })),
  }));

  return NextResponse.json({ problems });
}
