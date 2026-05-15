import math
import httpx
from typing import List, Optional
from app.config import OVERPASS_API_URL


def _bbox_from_radius(lat: float, lon: float, radius_km: float) -> tuple:
    """Convert center + radius to (min_lat, min_lon, max_lat, max_lon)."""
    delta_lat = radius_km / 111.0
    delta_lon = radius_km / (111.0 * math.cos(math.radians(lat)))
    return (
        round(lat - delta_lat, 6),
        round(lon - delta_lon, 6),
        round(lat + delta_lat, 6),
        round(lon + delta_lon, 6),
    )


def _build_query(min_lat: float, min_lon: float, max_lat: float, max_lon: float) -> str:
    bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"
    return f"""
[out:json][timeout:25];
(
  node["leisure"="fitness_centre"]({bbox});
  node["sport"="fitness"]({bbox});
  node["amenity"="gym"]({bbox});
  way["leisure"="fitness_centre"]({bbox});
  way["amenity"="gym"]({bbox});
);
out center;
"""


def _parse_amenities(tags: dict) -> List[str]:
    amenities = []
    mapping = {
        "shower": ["shower", "showers"],
        "locker": ["locker_room", "lockers"],
        "sauna": ["sauna"],
        "pool": ["swimming_pool", "pool"],
        "parking": ["parking"],
        "wifi": ["wifi", "internet_access"],
    }
    for label, keys in mapping.items():
        for key in keys:
            if tags.get(key) in ("yes", "true") or tags.get("amenity") == key:
                amenities.append(label)
                break
    return amenities


def _parse_element(element: dict) -> Optional[dict]:
    tags = element.get("tags", {})
    name = tags.get("name") or tags.get("brand") or "Unnamed Gym"

    if element["type"] == "node":
        lat = element.get("lat")
        lon = element.get("lon")
    else:
        center = element.get("center", {})
        lat = center.get("lat")
        lon = center.get("lon")

    if not lat or not lon:
        return None

    address_parts = [
        tags.get("addr:street"),
        tags.get("addr:housenumber"),
        tags.get("addr:city"),
    ]
    address = ", ".join(p for p in address_parts if p) or None

    return {
        "id": f"osm_{element['type']}_{element['id']}",
        "name": name,
        "latitude": lat,
        "longitude": lon,
        "address": address,
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "website": tags.get("website") or tags.get("contact:website"),
        "opening_hours": tags.get("opening_hours"),
        "amenities": _parse_amenities(tags),
        "osm_type": tags.get("leisure") or tags.get("amenity") or tags.get("sport", "gym"),
    }


async def fetch_gyms(
    lat: float = None, lon: float = None, radius_km: float = 10.0,
    bbox: tuple = None
) -> List[dict]:
    if bbox:
        min_lat, min_lon, max_lat, max_lon = bbox
    elif lat is not None and lon is not None:
        min_lat, min_lon, max_lat, max_lon = _bbox_from_radius(lat, lon, radius_km)
    else:
        raise ValueError("Either lat/lon or bbox must be provided")

    query = _build_query(min_lat, min_lon, max_lat, max_lon)

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OVERPASS_API_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    gyms = []
    seen = set()
    for element in data.get("elements", []):
        parsed = _parse_element(element)
        if parsed and parsed["id"] not in seen:
            seen.add(parsed["id"])
            gyms.append(parsed)

    return gyms
