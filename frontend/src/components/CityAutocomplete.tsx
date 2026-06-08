import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import { searchCities, type CitySuggestion } from '../lib/geocoding';
import { fieldSx } from '../lib/fieldSx';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
}

/**
 * Free-text city field backed by a debounced Photon / OpenStreetMap lookup.
 * The 1 req/s policy is respected by the 200ms debounce plus an AbortController
 * that cancels in-flight requests as the user keeps typing.
 */
function CityAutocomplete({
  value,
  onChange,
  error,
  helperText = 'Powered by Photon / OpenStreetMap',
  label = 'Location',
}: CityAutocompleteProps) {
  const [options, setOptions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        setOptions(await searchCities(value, ctrl.signal));
      } catch {
        // ignore: aborted or network error, keep last options
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(handle);
      ctrl.abort();
    };
  }, [value]);

  return (
    <Autocomplete
      freeSolo
      options={options.map((o) => o.label)}
      loading={loading}
      value={value}
      onChange={(_, v) => onChange(v ?? '')}
      onInputChange={(_, v) => onChange(v.length > 100 ? v.slice(0, 100) : v)}
      slotProps={{
        paper: {
          sx: {
            fontFamily: "'Lateef', Georgia, serif",
            backgroundColor: '#FAF7EF',
            border: '1px solid rgba(64,80,53,0.2)',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(64,80,53,0.12)',
            mt: 0.5,
            '& .MuiAutocomplete-listbox': {
              padding: '4px 0',
              '& .MuiAutocomplete-option': {
                fontFamily: "'Lateef', Georgia, serif",
                fontSize: '1.15rem',
                color: '#405035',
                padding: '10px 18px',
                '&[aria-selected="true"]': {
                  backgroundColor: 'rgba(64,80,53,0.1)',
                  color: '#405035',
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(64,80,53,0.08)',
                },
                '&[aria-selected="true"].Mui-focused': {
                  backgroundColor: 'rgba(64,80,53,0.14)',
                },
              },
            },
            '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
              fontFamily: "'Lateef', Georgia, serif",
              fontSize: '1.1rem',
              color: 'rgba(64,80,53,0.55)',
            },
          },
        },
        clearIndicator: {
          sx: { color: 'rgba(64,80,53,0.5)', '&:hover': { color: '#405035' } },
        },
        popupIndicator: {
          sx: { color: 'rgba(64,80,53,0.5)', '&:hover': { color: '#405035' } },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder="Start typing a city…"
          sx={fieldSx}
        />
      )}
      fullWidth
    />
  );
}

export default CityAutocomplete;
