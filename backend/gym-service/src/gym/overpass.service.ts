import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

const OVERPASS_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

function bboxFromRadius(lat: number, lon: number, km: number) {
  const dLat = km / 111;
  const dLon = km / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map((v) => +v.toFixed(6));
}

function buildQuery(minLat: number, minLon: number, maxLat: number, maxLon: number) {
  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
  return `[out:json][timeout:25];(node["leisure"="fitness_centre"](${bbox});node["sport"="fitness"](${bbox});node["amenity"="gym"](${bbox});way["leisure"="fitness_centre"](${bbox});way["amenity"="gym"](${bbox}););out center;`;
}

function parseAmenities(tags: any) {
  const map: Record<string, string[]> = {
    shower: ['shower', 'showers'], locker: ['locker_room', 'lockers'],
    sauna: ['sauna'], pool: ['swimming_pool', 'pool'],
    parking: ['parking'], wifi: ['wifi', 'internet_access'],
  };
  return Object.entries(map)
    .filter(([, keys]) => keys.some((k) => tags[k] === 'yes' || tags[k] === 'true' || tags.amenity === k))
    .map(([label]) => label);
}

function parseElement(el: any) {
  const tags = el.tags || {};
  const name = tags.name || tags.brand || 'Unnamed Gym';
  const lat = el.type === 'node' ? el.lat : el.center?.lat;
  const lon = el.type === 'node' ? el.lon : el.center?.lon;
  if (!lat || !lon) return null;
  const addr = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || null;
  return {
    id: `osm_${el.type}_${el.id}`,
    name,
    latitude: lat,
    longitude: lon,
    address: addr,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    opening_hours: tags.opening_hours || null,
    amenities: parseAmenities(tags),
    osm_type: tags.leisure || tags.amenity || tags.sport || 'gym',
  };
}

function postRequest(url: string, body: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'User-Agent': 'WorkoutPartner/1.0 (fitness app)',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const mod = isHttps ? https : http;
    const req = mod.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Overpass returned ${res.statusCode}: ${raw.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON from Overpass')); }
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(new Error('Overpass request timeout')); });
    req.write(body);
    req.end();
  });
}

@Injectable()
export class OverpassService {
  async fetchGyms(lat?: number, lon?: number, radiusKm = 10, bbox?: number[]) {
    let coords: number[];
    if (bbox) {
      coords = bbox;
    } else if (lat != null && lon != null) {
      coords = bboxFromRadius(lat, lon, radiusKm);
    } else {
      throw new Error('Either lat/lon or bbox must be provided');
    }
    const [minLat, minLon, maxLat, maxLon] = coords;
    const query = buildQuery(minLat, minLon, maxLat, maxLon);
    const data = await postRequest(OVERPASS_URL, `data=${encodeURIComponent(query)}`);
    const seen = new Set<string>();
    const gyms: any[] = [];
    for (const el of data.elements || []) {
      const parsed = parseElement(el);
      if (parsed && !seen.has(parsed.id)) { seen.add(parsed.id); gyms.push(parsed); }
    }
    return gyms;
  }
}
