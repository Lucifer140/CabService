import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { loadGoogleMaps, isGoogleMapsAvailable } from '../../../services/googleMapsLoader';

export interface LocationSelection {
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

interface PlacesAutocompleteInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string, selection?: LocationSelection) => void;
  placeholder?: string;
  required?: boolean;
  accentColor?: string;
  suggestedLocations?: string[];
  disabled?: boolean;
}

export const PlacesAutocompleteInput: React.FC<PlacesAutocompleteInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter city, airport, or landmark',
  required = false,
  accentColor = '#3B82F6',
  suggestedLocations = [],
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check if API already ready
    if (isGoogleMapsAvailable()) {
      setIsApiReady(true);
      return;
    }

    setIsLoadingApi(true);
    loadGoogleMaps().then((loaded) => {
      if (isMounted) {
        setIsApiReady(loaded);
        setIsLoadingApi(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isApiReady || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    try {
      if (!autocompleteRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && (place.formatted_address || place.name)) {
            const chosenAddress = place.formatted_address || place.name;
            const selection: LocationSelection = {
              address: chosenAddress,
              placeId: place.place_id,
              lat: place.geometry?.location?.lat ? place.geometry.location.lat() : undefined,
              lng: place.geometry?.location?.lng ? place.geometry.location.lng() : undefined,
            };
            onChange(chosenAddress, selection);
          }
        });
      }
    } catch (e) {
      console.warn('[Sangita Travels] Places Autocomplete setup notice:', e);
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isApiReady, onChange]);

  const handleClear = () => {
    onChange('', { address: '' });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const datalistId = `suggestions-${id}`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#94A3B8',
          marginBottom: '6px',
          fontWeight: 600,
        }}
      >
        <span>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </span>
        {isApiReady && (
          <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 500 }}>
            ● Live Google Places
          </span>
        )}
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            color: accentColor,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <input
          ref={inputRef}
          id={id}
          type="text"
          list={!isApiReady ? datalistId : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '11px 36px 11px 38px',
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = accentColor;
            e.target.style.boxShadow = `0 0 0 2px ${accentColor}33`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.target.style.boxShadow = 'none';
          }}
        />

        {isLoadingApi && (
          <Loader2
            size={16}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '12px',
              color: '#64748B',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}

        {!isLoadingApi && value && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear location"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {!isApiReady && suggestedLocations.length > 0 && (
        <datalist id={datalistId}>
          {suggestedLocations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
      )}
    </div>
  );
};
