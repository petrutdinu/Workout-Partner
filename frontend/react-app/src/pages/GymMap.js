import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gymApi } from '../api';
import './GymMap.css';

const DEFAULT_LAT = 44.4268;
const DEFAULT_LON = 26.1025;

const GymMap = () => {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLon, setUserLon] = useState(DEFAULT_LON);
  const [radius, setRadius] = useState(5);
  const [amenityFilter, setAmenityFilter] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);

  const AMENITIES = ['shower', 'locker', 'sauna', 'pool', 'parking', 'wifi'];

  const fetchGyms = useCallback(async (lat, lon, r) => {
    setLoading(true);
    setError(null);
    try {
      const res = await gymApi.getGyms({ lat, lon, radius_km: r });
      setGyms(res.data?.gyms || []);
    } catch {
      setError('Failed to load gyms. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
          fetchGyms(pos.coords.latitude, pos.coords.longitude, radius);
        },
        () => fetchGyms(DEFAULT_LAT, DEFAULT_LON, radius)
      );
    } else {
      fetchGyms(DEFAULT_LAT, DEFAULT_LON, radius);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    window.require([
      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "esri/geometry/Point",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/PopupTemplate",
      "esri/config"
    ], function(Map, MapView, Graphic, GraphicsLayer, Point, SimpleMarkerSymbol, PopupTemplate, esriConfig) {
      esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEDyoqfyn9dogHaWz0zQJ-0c81EREEr8Jp1QLAdA93kiqiec1csn-FkGhOLr_tERl150CcEMrVxbrZtnP-_2dvMiegxQ-omWZMjYf1EvlYo1YFH3hV8no7eo-qp-2jKrnZ27uhFAcUl_QbI3dwjtQXcINrGBF6BnQAFS8Uatk1Iw6Ctg5VXWJbRPk5JgyYifdIIDNT6B3BPyxuqf1SM68Ks.AT1_ILPDxAPZ";

      const graphicsLayer = new GraphicsLayer();
      layerRef.current = graphicsLayer;

      const map = new Map({ basemap: 'arcgis-navigation', layers: [graphicsLayer] });
      const view = new MapView({
        container: mapRef.current,
        map,
        center: [DEFAULT_LON, DEFAULT_LAT],
        zoom: 13
      });

      mapInstance.current = { map, view, Graphic, Point, SimpleMarkerSymbol, PopupTemplate };

      view.on('click', (event) => {
        view.hitTest(event).then((response) => {
          const hit = response.results.find(r => r.graphic?.attributes?.gymId);
          if (!hit) setSelectedGym(null);
        });
      });
    });

    return () => {
      if (mapInstance.current?.view) {
        mapInstance.current.view.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current || !mapInstance.current) return;
    const { Graphic, Point, SimpleMarkerSymbol, PopupTemplate, view } = mapInstance.current;
    if (!Graphic) return;

    layerRef.current.removeAll();

    const filtered = amenityFilter.length > 0
      ? gyms.filter(g => amenityFilter.every(a => g.amenities?.includes(a)))
      : gyms;

    filtered.forEach(gym => {
      const point = new Point({ longitude: gym.longitude, latitude: gym.latitude });

      const symbol = new SimpleMarkerSymbol({
        color: [229, 57, 53, 1],
        outline: { color: [255, 255, 255], width: 2 },
        size: '12px',
        style: 'circle'
      });

      const amenityList = gym.amenities?.length > 0
        ? gym.amenities.map(a => `<span class="popup-amenity">${a}</span>`).join(' ')
        : 'None listed';

      const popupTemplate = new PopupTemplate({
        title: gym.name,
        content: `
          ${gym.address ? `<p><strong>Address:</strong> ${gym.address}</p>` : ''}
          ${gym.opening_hours ? `<p><strong>Hours:</strong> ${gym.opening_hours}</p>` : ''}
          ${gym.phone ? `<p><strong>Phone:</strong> ${gym.phone}</p>` : ''}
          ${gym.website ? `<p><a href="${gym.website}" target="_blank" rel="noopener">Visit website</a></p>` : ''}
          <p><strong>Amenities:</strong> ${amenityList}</p>
        `
      });

      const graphic = new Graphic({
        geometry: point,
        symbol,
        attributes: { gymId: gym.id, name: gym.name },
        popupTemplate
      });

      layerRef.current.add(graphic);
    });

    if (filtered.length > 0 && mapInstance.current?.view) {
      view.goTo({ center: [userLon, userLat], zoom: 13 });
    }
  }, [gyms, amenityFilter, userLat, userLon]);

  const handleSearch = () => {
    fetchGyms(userLat, userLon, radius);
  };

  const toggleAmenity = (a) => {
    setAmenityFilter(f => f.includes(a) ? f.filter(x => x !== a) : [...f, a]);
  };

  const filteredGyms = amenityFilter.length > 0
    ? gyms.filter(g => amenityFilter.every(a => g.amenities?.includes(a)))
    : gyms;

  return (
    <div className="gym-map-page">
      <div className="gym-sidebar">
        <h2>Gyms Near You</h2>

        <div className="gym-controls">
          <div className="form-group">
            <label>Search Radius: {radius} km</label>
            <input type="range" min="1" max="20" value={radius}
              onChange={e => setRadius(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="amenity-filters">
          <label>Filter by amenities:</label>
          <div className="chip-group">
            {AMENITIES.map(a => (
              <button key={a} type="button"
                className={`chip ${amenityFilter.includes(a) ? 'active' : ''}`}
                onClick={() => toggleAmenity(a)}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="gym-count">
          {filteredGyms.length} gym{filteredGyms.length !== 1 ? 's' : ''} found
          {amenityFilter.length > 0 && ` (filtered)`}
        </div>

        <div className="gym-list">
          {filteredGyms.map(g => (
            <div
              key={g.id}
              className={`gym-item ${selectedGym?.id === g.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedGym(g);
                if (mapInstance.current?.view) {
                  mapInstance.current.view.goTo({ center: [g.longitude, g.latitude], zoom: 16 });
                }
              }}>
              <h4>{g.name}</h4>
              {g.address && <p className="gym-address">{g.address}</p>}
              {g.amenities?.length > 0 && (
                <div className="gym-amenities">
                  {g.amenities.slice(0, 4).map(a => <span key={a} className="amenity-tag">{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gym-map-container">
        <div ref={mapRef} className="arcgis-map" />
      </div>

      {selectedGym && (
        <div className="gym-detail-panel">
          <div className="panel-header">
            <h3>{selectedGym.name}</h3>
            <button className="btn-close" onClick={() => setSelectedGym(null)}>×</button>
          </div>
          <div className="panel-body">
            {selectedGym.address && <p><strong>Address:</strong> {selectedGym.address}</p>}
            {selectedGym.opening_hours && <p><strong>Hours:</strong> {selectedGym.opening_hours}</p>}
            {selectedGym.phone && <p><strong>Phone:</strong> {selectedGym.phone}</p>}
            {selectedGym.website && (
              <p><a href={selectedGym.website} target="_blank" rel="noopener noreferrer">Visit website →</a></p>
            )}
            {selectedGym.amenities?.length > 0 && (
              <div>
                <strong>Amenities:</strong>
                <div className="gym-amenities" style={{ marginTop: '0.5rem' }}>
                  {selectedGym.amenities.map(a => <span key={a} className="amenity-tag">{a}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GymMap;
