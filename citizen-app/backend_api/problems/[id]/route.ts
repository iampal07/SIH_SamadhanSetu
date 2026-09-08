import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { getCitizenId } from "@/lib/citizen";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const citizenId = await getCitizenId();
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase.from("challenges").select("*");
  if (isUuid) {
    query = query.eq("id", id);
  } else {
    query = query.eq("code", id);
  }

  const { data: challenge, error } = await query.eq("citizen_id", citizenId).maybeSingle();

  if (error || !challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: media } = await supabase
    .from("challenge_media")
    .select("*")
    .or(`challenge_id.eq.${challenge.id},challenge_code.eq.${challenge.code}`);

  const evidence =
    media && media.length > 0
      ? media.map((m) => ({
          id: m.id,
          fileUrl: m.url,
          fileType: m.media_type || "image",
        }))
      : (challenge.attachments || []).map((url: string, idx: number) => ({
          id: `${challenge.id}-${idx}`,
          fileUrl: url,
          fileType: "image",
        }));

  const problem = {
    id: challenge.id,
    challengeId: challenge.code,
    citizenId: challenge.citizen_id,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    district: challenge.district,
    villageLocality: challenge.village,
    peopleAffected: challenge.affected_population,
    latitude: challenge.latitude,
    longitude: challenge.longitude,
    status: challenge.status ? challenge.status.toUpperCase() : "SUBMITTED",
    createdAt: new Date(challenge.created_at),
    evidence,
  };

  return NextResponse.json({ problem });
}
