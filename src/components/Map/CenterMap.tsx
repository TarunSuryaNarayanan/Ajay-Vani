import React, { useEffect, useRef } from 'react';
import { SkillingCenter } from '../../types';
import { MapPinIcon, PhoneIcon } from '../Icons';

declare global {
  interface Window {
    L: any;
  }
}

interface CenterMapProps {
  centers: SkillingCenter[];
  selectedCenterId?: string;
  onSelectCenter: (center: SkillingCenter) => void;
  /** Live beneficiary GPS, when the user has granted location access. */
  userLocation?: { lat: number; lon: number } | null;
  /** Called when the user taps "My Location" — lets the screen re-prompt. */
  onRecenter?: () => void;
}

export const CenterMap: React.FC<CenterMapProps> = ({
  centers,
  selectedCenterId,
  onSelectCenter,
  userLocation,
  onRecenter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!mapContainerRef.current || !centers.length) return;

    // Default center focus (e.g., first center or average lat/lng)
    const validCenters = centers.filter(c => c.latitude && c.longitude);
    if (!validCenters.length) return;

    const defaultLat = validCenters[0].latitude;
    const defaultLng = validCenters[0].longitude;

    // Hoisted so the cleanup below can tear the user marker down too.
    let userMarker: any = null;

    if (window.L && !mapInstanceRef.current) {
      try {
        const map = window.L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: 12,
          zoomControl: true,
        });

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      } catch (e) {
        console.warn('Leaflet map initialization skipped/failed:', e);
      }
    }

    if (mapInstanceRef.current && window.L) {
      const map = mapInstanceRef.current;
      
      // Clear existing markers
      Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m));
      markersRef.current = {};

      const customIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #009378; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const activeIcon = window.L.divIcon({
        className: 'custom-map-pin-active',
        html: `<div style="background-color: #FC8A15; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

const bounds: any[] = [];

      // Beneficiary's live location, when known. Rendered as a blue dot so the
      // user can see which centres are actually nearby rather than trusting the
      // hardcoded demo distances.
      if (userLocation && window.L) {
        const userIcon = window.L.divIcon({
          className: 'user-location-pin',
          html: `<div style="background-color: #1557A8; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 0 3px rgba(21,87,168,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">👤</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 22],
          popupAnchor: [0, -22],
        });
        userMarker = window.L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div style="font-family: sans-serif; font-size: 12px; padding: 4px;"><strong>आप यहाँ</strong><br/>आपका वर्तमान स्थान</div>');
        bounds.push([userLocation.lat, userLocation.lon]);
      }

      validCenters.forEach((center) => {
        const isSelected = center.id === selectedCenterId;
        const marker = window.L.marker([center.latitude, center.longitude], {
          icon: isSelected ? activeIcon : customIcon,
        }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <div style="font-weight: bold; font-size: 13px; color: #14231F; margin-bottom: 4px;">
              ${center.nameHi || center.name}
            </div>
            <div style="font-size: 11px; color: #54655F; margin-bottom: 6px;">
              📍 ${center.addressHi || center.address} (${center.distanceKm} किमी)
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #009378; margin-bottom: 8px;">
              🎓 ${center.courseNameHi || center.courseName}
            </div>
            <div style="display: flex; gap: 6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}" target="_blank" rel="noopener noreferrer" style="background: #009378; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center; flex: 1;">
                नेविगेट करें
              </a>
              <a href="tel:${center.coordinatorPhone.replace(/\s+/g, '')}" style="background: #14231F; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center;">
                कॉल
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectCenter) onSelectCenter(center);
        });

        markersRef.current[center.id] = marker;
        bounds.push([center.latitude, center.longitude]);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [30, 30] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    }

    return () => {
      // Drop the user-location marker too — it is not in markersRef.
      if (userMarker) userMarker.remove();
      if (mapInstanceRef.current) {
        Object.values(markersRef.current).forEach((m: any) => mapInstanceRef.current.removeLayer(m));
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centers, selectedCenterId, userLocation]);

  return (
    <div className="w-full space-y-2">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-56 rounded-lg border border-line bg-surface relative z-0 overflow-hidden shadow-inner" 
        style={{ minHeight: '220px' }}
      >
        {!window.L && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-emerald-50 text-center text-xs text-ink-muted">
            <MapPinIcon size={24} color="#009378" />
            <span className="font-semibold text-ink mt-2">पीएम-अजय केंद्र लाइव लोकेशन नक्शा</span>
            <span className="mt-1">वास्तविक केंद्र GPS: {centers.map(c => c.nameHi || c.name).join(', ')}</span>
          </div>
        )}
        {window.L && userLocation && onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            className="absolute bottom-3 right-3 z-[1000] w-10 h-10 rounded-full bg-surface border border-line shadow flex items-center justify-center"
            aria-label="अपना स्थान केंद्रित करें"
            title="अपना स्थान केंद्रित करें"
          >
            <MapPinIcon size={18} color="#1557A8" />
          </button>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {centers.map((center) => (
          <div
            key={center.id}
            onClick={() => onSelectCenter && onSelectCenter(center)}
            className={`shrink-0 border rounded-lg p-2.5 cursor-pointer transition-all ${
              selectedCenterId === center.id
                ? 'bg-trust/10 border-trust text-trust font-semibold shadow-sm'
                : 'bg-white border-line text-ink hover:border-trust/40'
            }`}
            style={{ width: '210px' }}
          >
            <div className="flex items-center justify-between text-xs font-bold truncate">
              <span className="truncate">{center.nameHi || center.name}</span>
              <span className="text-[10px] bg-trust/15 text-trust px-1.5 py-0.5 rounded ml-1 shrink-0">
                {center.distanceKm} किमी
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate mt-0.5">
              {center.addressHi || center.address}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <a
                href={center.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-trust font-bold hover:underline flex items-center space-x-1"
              >
                <MapPinIcon size={12} color="#009378" />
                <span>नक्शे में देखें</span>
              </a>
              <a
                href={`tel:${center.coordinatorPhone.replace(/\s+/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="text-ink font-semibold hover:underline flex items-center space-x-1"
              >
                <PhoneIcon size={12} color="#14231F" />
                <span>कॉल</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
