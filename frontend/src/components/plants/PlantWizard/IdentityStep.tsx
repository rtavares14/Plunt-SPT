import { useMemo } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import plantNames from '../../../data/plantNames.json';
import type { SpeciesDetail, SpeciesSearchResult } from '../../../api/plants';
import SpeciesSearchInput from '../SpeciesSearchInput';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    '& fieldset': { borderColor: 'rgba(20,83,45,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(20,83,45,0.45)' },
    '&.Mui-focused fieldset': { borderColor: '#14532d', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(20,83,45,0.7)',
    '&.Mui-focused': { color: '#14532d' },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(90,74,54,0.85)',
    marginLeft: '4px',
  },
} as const;

interface IdentityStepProps {
  name: string;
  onNameChange: (value: string) => void;
  species: SpeciesSearchResult | null;
  speciesText: string;
  onSpeciesChange: (species: SpeciesSearchResult | null, text: string) => void;
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
  detailLoading: boolean;
  speciesDetail: SpeciesDetail | null;
}

function IdentityStep({
  name,
  onNameChange,
  species,
  speciesText,
  onSpeciesChange,
  imageUrl,
  onImageUrlChange,
  detailLoading,
  speciesDetail,
}: IdentityStepProps) {
  const photoHelper = useMemo(() => {
    if (detailLoading) return 'Pulling care notes from Trefle…';
    if (speciesDetail) {
      return `Auto-filled from ${speciesDetail.commonName ?? speciesDetail.scientificName}`;
    }
    return 'Paste an image URL — uploads coming soon';
  }, [detailLoading, speciesDetail]);

  return (
    <Box key="step-identity" className="flex flex-col gap-5 animate-fade-up">
      <Box className="flex flex-col gap-4">
        <TextField
          label="Nickname"
          placeholder="e.g. Mr. Greenleaf"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{
            htmlInput: { maxLength: 80 },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Generate a name" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const pick =
                          plantNames[Math.floor(Math.random() * plantNames.length)];
                        onNameChange(pick);
                      }}
                      sx={{
                        color: 'rgba(20,83,45,0.5)',
                        '&:hover': {
                          color: '#14532d',
                          backgroundColor: 'rgba(20,83,45,0.06)',
                        },
                      }}
                    >
                      <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
          sx={fieldSx}
        />

        <SpeciesSearchInput
          value={species}
          freeText={speciesText}
          onChange={(s, text) => {
            onSpeciesChange(s, text);
          }}
        />

        <TextField
          label="Photo URL"
          placeholder="https://…"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          fullWidth
          helperText={photoHelper}
          sx={fieldSx}
        />
      </Box>
    </Box>
  );
}

export default IdentityStep;
