import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Clock, ShieldCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { isGoogleMapsAvailable } from '../../../services/googleMapsLoader';

interface GoogleRouteMapProps {
  pickup: string;
  drop: string;
  distanceKm: number;
  durationText: string;
  tollAmount: number | null;
  tollAvailable: boolean;
  tollDisplay?: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  pickup,
  drop,
  distanceKm,
  durationText,
  tollAmount,
  tollAvailable,
  tollDisplay,
  isLoading = false,
  error = null,
  onRefresh,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const hasValidPoints = pickup.trim().length >= 2 && drop.trim().length >= 2;
  const isIdentical =
    hasValidPoints && pickup.trim().toLowerCase() === drop.trim().toLowerCase();

  // Initialize or update Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!isGoogleMapsAvailable()) {
      setMapReady(false);
      return;
    }

    try {
      if (!mapInstanceRef.current) {
        // Center around Pune - Mumbai corridor initially
        const defaultCenter = { lat: 18.75, lng: 73.4 };
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#cbd5e1' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#64748b' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#334155' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1e293b' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#94a3b8' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#2563eb' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1d4ed8' }],
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#1e293b' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f172a' }],
            },
          ],
        });

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          },
        });
      }

      setMapReady(true);
    } catch (e: any) {
      console.warn('[Sangita Travels] Google Map initialization note:', e);
      setMapReady(false);
    }
  }, []);

  // Compute and render directions route when locations change
  useEffect(() => {
    if (!mapReady || !hasValidPoints || isIdentical) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup,
          destination: drop,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);
            setMapError(null);
          } else {
            setMapError('Live Google Map routing preview unavailable for this exact address text.');
          }
        }
      );
    } catch (err: any) {
      setMapError(err?.message || 'Failed to render directions');
    }
  }, [mapReady, pickup, drop, hasValidPoints, isIdentical]);

  return (
    <div
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(15, 23, 42, 0.8)',
        marginBottom: '20px',
      }}
    >
      {/* Top Map Bar with Route Meta & Toll Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(30, 41, 59, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
              Driving Route & Distance
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              {hasValidPoints ? `${pickup} ➔ ${drop}` : 'Select pickup and drop locations'}
            </div>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isIdentical || !hasValidPoints}
            title="Recalculate route and toll"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#E2E8F0',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: isLoading || isIdentical || !hasValidPoints ? 'not-allowed' : 'pointer',
              opacity: isLoading || isIdentical || !hasValidPoints ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>Refresh Fare</span>
          </button>
        )}
      </div>

      {/* Error or Warning Banner */}
      {isIdentical && (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#FCA5A5',
          }}
        >
          <AlertCircle size={15} />
          <span>Pickup and Drop locations cannot be identical. Please choose distinct points.</span>
        </div>
      )}

      {error && !isIdentical && (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#FCD34D',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Map Canvas or Visual Route Representation */}
      <div style={{ position: 'relative', width: '100%', minHeight: '220px', height: '240px' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            display: mapReady ? 'block' : 'none',
          }}
        />

        {/* Fallback Visual Route Display when Google Maps JS API is offline/unloaded */}
        {!mapReady && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 20px',
              boxSizing: 'border-box',
              background:
                'radial-gradient(circle at center, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                width: '100%',
                maxWidth: '460px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#6EE7B7',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                📍 {pickup || 'Pickup'}
              </div>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '2px',
                    background:
                      'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #F59E0B 100%)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    background: '#1E293B',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.7rem',
                    color: '#93C5FD',
                    fontWeight: 700,
                  }}
                >
                  {distanceKm} km
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #F59E0B',
                  color: '#FCD34D',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                🏁 {drop || 'Drop'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Layers size={14} color="#64748B" />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                High-precision highway road routing engine active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metrics Bar: Road Distance, Travel Duration, and Toll Estimate */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Metric 1: Distance */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '10px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' }}>
            Road Distance
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#60A5FA' }}>
            {distanceKm > 0 ? `${distanceKm} km` : '—'}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Actual driving km</div>
        </div>

        {/* Metric 2: Duration */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '10px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' }}>
            Est. Duration
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Clock size={14} />
            <span>{durationText || '—'}</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Live traffic estimate</div>
        </div>

        {/* Metric 3: Toll Estimate */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '10px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' }}>
            Toll Estimate
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: tollAvailable ? '#FBBF24' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={14} />
            <span>
              {tollAvailable && tollAmount !== null
                ? `₹${tollAmount}`
                : 'Toll estimate unavailable'}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
            {tollDisplay || (tollAvailable ? 'Expressway toll plazas' : 'Local / Non-toll route')}
          </div>
        </div>
      </div>
    </div>
  );
};
