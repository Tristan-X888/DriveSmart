// src/MapView.jsx
import React, { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Marker, Popup, ScaleControl, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons in Leaflet when bundling
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

const COLORS = {
  route: "#7c3aed",      // violet
  fuel: "#0ea5e9",       // sky
  pickup: "#22c55e",     // green
  dropoff: "#ef4444",    // red
  current: "#6b7280",    // gray
};

function FitToRoute({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords?.length > 1) {
      const latlngs = coords.map(([lon, lat]) => [lat, lon]);
      map.fitBounds(latlngs, { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
}

export default function MapView({ route, waypoints, stops }) {
  // Normalize line to Leaflet [lat,lng]
  const lineLatLngs = useMemo(() => {
    const raw = route?.geometry?.coordinates || [];
    return raw.map(([lon, lat]) => [lat, lon]);
  }, [route]);

  const fuelPoints = useMemo(() => {
    const f = stops?.fueling || [];
    return f.map(([lon, lat]) => [lat, lon]);
  }, [stops]);

  const hasData = lineLatLngs?.length > 1;

  // Choose a center fallback (CONUS midpoint) if no data yet
  const defaultCenter = [39.5, -98.35];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={hasData ? lineLatLngs[0] : defaultCenter}
        zoom={hasData ? 6 : 4}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* Clean, high-contrast basemap */}
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Auto-zoom to route bounds */}
        {hasData && <FitToRoute coords={route.geometry.coordinates} />}

        {/* Route polyline */}
        {hasData && (
          <Polyline positions={lineLatLngs} pathOptions={{ color: COLORS.route, weight: 5, opacity: 0.9 }} />
        )}

        {/* Waypoints */}
        {waypoints?.current && (
          <Marker position={[waypoints.current[1], waypoints.current[0]]} icon={pin(COLORS.current)}>
            <Popup>
              <b>Current</b>
            </Popup>
          </Marker>
        )}
        {waypoints?.pickup && (
          <Marker position={[waypoints.pickup[1], waypoints.pickup[0]]} icon={pin(COLORS.pickup)}>
            <Popup>
              <b>Pickup</b>
            </Popup>
          </Marker>
        )}
        {waypoints?.dropoff && (
          <Marker position={[waypoints.dropoff[1], waypoints.dropoff[0]]} icon={pin(COLORS.dropoff)}>
            <Popup>
              <b>Drop-off</b>
            </Popup>
          </Marker>
        )}

        {/* Fuel stops */}
        {fuelPoints.map((p, i) => (
          <Marker key={i} position={p} icon={dot(COLORS.fuel)}>
            <Popup>
              <b>Fuel Stop</b>
              <div className="text-xs text-muted-foreground">#{i + 1} (approx. every 1,000 mi)</div>
            </Popup>
          </Marker>
        ))}

        <ScaleControl imperial={true} metric={true} position="bottomleft" />
      </MapContainer>
    </div>
  );
}

/** Small colored dot for fuels */
function dot(color) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:inline-block;width:12px;height:12px;border-radius:9999px;
      background:${color};box-shadow:0 0 0 2px rgba(0,0,0,.2);
    "></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

/** Pin icon with colored accent ring */
function pin(color) {
  // Use default icon but overlay ring color via CSS filter? Easier: use a divIcon
  return L.divIcon({
    className: "shadow",
    html: `
      <div style="transform: translate(-50%,-100%);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,.35));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}
