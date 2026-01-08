import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icon issue in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Attraction {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  visit_date: string | null;
  visit_time: string | null;
  image: string | null;
}

interface MapViewProps {
  attractions: Attraction[];
}

function MapView({ attractions }: MapViewProps) {
  // Calculate center of map (average of all attraction coordinates)
  const calculateCenter = (): [number, number] => {
    if (attractions.length === 0) {
      return [0, 0]; // Default center
    }
    const avgLat = attractions.reduce((sum, att) => sum + att.latitude, 0) / attractions.length;
    const avgLng = attractions.reduce((sum, att) => sum + att.longitude, 0) / attractions.length;
    return [avgLat, avgLng];
  };

  const center = calculateCenter();

  if (attractions.length === 0) {
    return (
      <div className="map-placeholder">
        <p>Add attractions to see them on the map</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={attractions.length === 1 ? 13 : 10}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {attractions.map((attraction) => (
          <Marker
            key={attraction.id}
            position={[attraction.latitude, attraction.longitude]}
          >
            <Popup>
              <div className="marker-popup">
                {attraction.image && (
                  <img src={attraction.image} alt={attraction.name} className="popup-image" />
                )}
                <h4>{attraction.name}</h4>
                {attraction.description && <p>{attraction.description}</p>}
                {attraction.address && <p className="address">📍 {attraction.address}</p>}
                {(attraction.visit_date || attraction.visit_time) && (
                  <p className="visit-time">
                    🕐 {attraction.visit_date || ''} {attraction.visit_time || ''}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;


