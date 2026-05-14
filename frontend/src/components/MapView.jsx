import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { formatXOF, BACKEND_URL } from '@/lib/api';

const resolveImg = (u) => (!u ? '' : u.startsWith('http') ? u : `${BACKEND_URL}${u}`);

const makeIcon = (price) => L.divIcon({
  className: 'ts-marker-wrap',
  html: `<div class="ts-marker"><span class="ts-marker__dot"></span>${price}</div>`,
  iconSize: [90, 32],
  iconAnchor: [45, 16],
});

const FitBounds = ({ items }) => {
  const map = useMap();
  useEffect(() => {
    if (!items?.length) return;
    const bounds = L.latLngBounds(items.map((i) => [i.lat, i.lng]));
    map.fitBounds(bounds.pad(0.2), { animate: true });
  }, [items, map]);
  return null;
};

export const MapView = ({ items, type = 'property', height }) => {
  const center = items?.length ? [items[0].lat, items[0].lng] : [14.7167, -17.4677];
  return (
    <div data-testid="listings-map" className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: height || 600 }}>
      <MapContainer center={center} zoom={6} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {items?.map((it) => (
          <Marker key={it.id} position={[it.lat, it.lng]} icon={makeIcon(formatXOF(type === 'property' ? it.price_per_night : it.price))}>
            <Popup>
              <div style={{ minWidth: 220 }}>
                {it.images?.[0] && <img src={resolveImg(it.images[0])} alt={it.title} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10 }} />}
                <div style={{ marginTop: 8, fontFamily: 'var(--font-body)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{it.title}</div>
                  <div style={{ color: '#6a6a6a', fontSize: 12, marginTop: 2 }}>{it.city}</div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    <strong>{formatXOF(type === 'property' ? it.price_per_night : it.price)}</strong> {type === 'property' ? '/ nuit' : '/ pers.'}
                  </div>
                  <Link to={`/${type === 'property' ? 'stays' : 'experiences'}/${it.id}`} style={{ color: '#C86B4A', fontWeight: 600, fontSize: 12, display: 'inline-block', marginTop: 6 }}>Voir le détail →</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds items={items} />
      </MapContainer>
    </div>
  );
};
