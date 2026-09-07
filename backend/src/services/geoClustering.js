const db = require("../db");

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in kilometers. */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Finds existing (non-duplicate) complaints within `radiusKm` of the given
 * point. This is the cheap pre-filter that runs BEFORE any Gemini call —
 * we only ever ask Gemini to compare text within a geo-cluster, never
 * across the whole database.
 *
 * A bounding-box query narrows the rows fetched from Supabase before the
 * precise haversine check, which matters once the complaints table grows
 * large.
 */
async function findNearbyComplaints(latitude, longitude, radiusKm, excludeId = null) {
  if (latitude == null || longitude == null) return [];

  // Rough bounding box: 1 degree latitude ~= 111km. Pad generously.
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(toRad(latitude)) || 1);

  let query = db
    .from("complaints")
    .select("id, raw_text, english_text, category, latitude, longitude, duplicate_count")
    .gte("latitude", latitude - latDelta)
    .lte("latitude", latitude + latDelta)
    .gte("longitude", longitude - lonDelta)
    .lte("longitude", longitude + lonDelta)
    .is("duplicate_of", null)
    .neq("status", "failed");

  if (excludeId != null) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).filter(
    (row) =>
      row.latitude != null &&
      row.longitude != null &&
      haversineDistanceKm(latitude, longitude, row.latitude, row.longitude) <= radiusKm
  );
}

module.exports = { haversineDistanceKm, findNearbyComplaints };
