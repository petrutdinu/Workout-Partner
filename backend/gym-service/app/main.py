from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from app.overpass_client import fetch_gyms
from app.cache import gym_cache

app = FastAPI(
    title="Workout Partner - Gym Service",
    description="Fitness location discovery via OpenStreetMap Overpass API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    gym_cache.connect()


@app.get("/api/v1/gyms")
async def get_gyms(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius_km: float = Query(10.0, le=50.0),
    bbox: Optional[str] = Query(None, description="minLon,minLat,maxLon,maxLat"),
    force_refresh: bool = Query(False),
):
    params = {"lat": lat, "lon": lon, "radius_km": radius_km, "bbox": bbox}

    if not force_refresh:
        cached = gym_cache.get(params)
        if cached is not None:
            return {"gyms": cached, "count": len(cached), "cached": True}

    try:
        parsed_bbox = None
        if bbox:
            parts = [float(x) for x in bbox.split(",")]
            if len(parts) != 4:
                raise HTTPException(status_code=400, detail="bbox must be minLon,minLat,maxLon,maxLat")
            parsed_bbox = (parts[1], parts[0], parts[3], parts[2])  # reorder to (minLat,minLon,maxLat,maxLon)

        gyms = await fetch_gyms(lat=lat, lon=lon, radius_km=radius_km, bbox=parsed_bbox)
        gym_cache.set(params, gyms)
        return {"gyms": gyms, "count": len(gyms), "cached": False}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Overpass API unavailable: {str(e)}")


@app.post("/api/v1/gyms/cache/invalidate")
def invalidate_cache():
    deleted = gym_cache.invalidate_all()
    return {"deleted_keys": deleted, "status": "cache cleared"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "gym-service"}


@app.get("/")
def root():
    return {"service": "gym-service", "version": "1.0.0"}
