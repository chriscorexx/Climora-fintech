import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MSMEProfile } from '../../types';
import { useTheme } from './ThemeProvider';

interface LocationMapProps {
  profile: MSMEProfile | null | undefined;
  className?: string;
}

const CARTO_LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const CARTO_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const LocationMap: React.FC<LocationMapProps> = ({ profile, className = '' }) => {
  const { resolvedTheme } = useTheme();

  const latitude = profile?.location?.latitude;
  const longitude = profile?.location?.longitude;
  const hasValidCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  if (!profile || !hasValidCoords) return null;

  return (
    <div
      className={`rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-fin-border">
        <div>
          <h3 className="text-sm font-bold text-fin-text tracking-tight">
            Enterprise Geospatial Location
          </h3>
          <p className="text-xs text-fin-muted">
            {profile.location.address || `${profile.location.city}, ${profile.location.state}`}
          </p>
        </div>
        <span className="text-[10px] font-mono text-fin-muted tabular-nums">
          {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
        </span>
      </div>
      <div className="pt-4 h-64 rounded-xl overflow-hidden border border-fin-border">
        <MapContainer
          center={[latitude!, longitude!]}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          aria-label={`Map showing ${profile.name} location`}
        >
          <TileLayer
            url={resolvedTheme === 'dark' ? CARTO_DARK_TILES : CARTO_LIGHT_TILES}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <CircleMarker
            center={[latitude!, longitude!]}
            radius={9}
            pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.65, weight: 2 }}
          >
            <Popup>
              <span className="text-xs font-semibold">{profile.name}</span>
              <br />
              <span className="text-[11px]">
                {profile.location.city}, {profile.location.state}
              </span>
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>
    </div>
  );
};
