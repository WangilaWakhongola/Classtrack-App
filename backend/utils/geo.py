import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in metres between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_within_radius(
    student_lat: float, student_lon: float,
    class_lat: float, class_lon: float,
    radius_m: float,
) -> tuple[bool, float]:
    dist = haversine_distance(student_lat, student_lon, class_lat, class_lon)
    return dist <= radius_m, round(dist, 1)
