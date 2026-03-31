/**
 * Haversine formula to calculate distance between two coordinates in meters
 */
export function getDistanceMeters(coord1, coord2) {
  const R = 6371000; // Earth's radius in meters
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within a geofence radius
 */
export function isWithinGeofence(userCoord, classroomCoord, radiusMeters) {
  const distance = getDistanceMeters(userCoord, classroomCoord);
  return distance <= radiusMeters;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
