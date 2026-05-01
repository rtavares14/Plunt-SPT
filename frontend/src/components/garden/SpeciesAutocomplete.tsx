import { useEffect, useMemo, useRef, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import { useAuth } from '../../context/useAuth';
import { searchSpecies, type SpeciesSearchResult } from '../../api/garden';

interface Props {
  value: SpeciesSearchResult | null;
  freeText: string;
  onChange: (value: SpeciesSearchResult | null, freeText: string) => void;
  disabled?: boolean;
}

function SpeciesAutocomplete({ value, freeText, onChange, disabled }: Props) {
  const { authFetch } = useAuth();
  const [input, setInput] = useState(freeText);
  const [options, setOptions] = useState<SpeciesSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [unconfigured, setUnconfigured] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Keep input in sync if parent resets freeText (e.g. wizard close).
  useEffect(() => {
    setInput(freeText);
  }, [freeText]);

  useEffect(() => {
    const term = input.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (term.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { results, configured } = await searchSpecies(authFetch, term);
        setUnconfigured(!configured);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [input, authFetch]);

  const helper = useMemo(() => {
    if (unconfigured) return 'Trefle is offline — type the species name manually.';
    if (input.length > 0 && input.length < 2) return 'Type at least 2 characters.';
    return 'Pick from the list to auto-fill care info, or type your own.';
  }, [unconfigured, input.length]);

  return (
    <Autocomplete<SpeciesSearchResult, false, false, true>
      freeSolo
      disabled={disabled}
      value={value}
      inputValue={input}
      onInputChange={(_, newInput) => {
        setInput(newInput);
        // Free-text typing — clear the structured selection but keep the text.
        if (value && newInput !== labelOf(value)) {
          onChange(null, newInput);
        } else if (!value) {
          onChange(null, newInput);
        }
      }}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          onChange(null, newValue);
        } else {
          onChange(newValue, newValue ? labelOf(newValue) : '');
        }
      }}
      options={options}
      filterOptions={(x) => x}
      loading={loading}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : labelOf(option)
      }
      isOptionEqualToValue={(o, v) =>
        typeof o !== 'string' && typeof v !== 'string' && o.id === v.id
      }
      renderOption={(props, option) => {
        if (typeof option === 'string') return null;
        return (
          <Box component="li" {...props} key={option.id} className="!gap-3">
            <Avatar
              src={option.imageUrl ?? undefined}
              variant="rounded"
              sx={{ width: 40, height: 40 }}
            >
              <LocalFloristIcon fontSize="small" />
            </Avatar>
            <Box className="flex flex-col">
              <span className="font-medium text-plunt-900">
                {option.commonName ?? option.scientificName}
              </span>
              <span className="text-xs text-gray-500 italic">
                {option.scientificName}
                {option.family ? ` • ${option.family}` : ''}
              </span>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => {
        const inputSlot = params.slotProps?.input as
          | { endAdornment?: React.ReactNode }
          | undefined;
        return (
          <TextField
            {...params}
            label="Species"
            placeholder="e.g. Monstera deliciosa"
            helperText={helper}
            slotProps={{
              ...params.slotProps,
              input: {
                ...(inputSlot ?? {}),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={18} /> : null}
                    {inputSlot?.endAdornment}
                  </>
                ),
              },
            }}
          />
        );
      }}
    />
  );
}

function labelOf(s: SpeciesSearchResult): string {
  return s.commonName ? `${s.commonName} (${s.scientificName})` : s.scientificName;
}

export default SpeciesAutocomplete;
