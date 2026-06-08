import type { SxProps, Theme } from '@mui/material/styles';

// Shared MUI TextField override — olive border, olive-light on focus (mirrors login inputs).
// Hex values mirror the tailwind.config.js tokens (olive-main #405035, olive-light #5B6952);
// keep them in sync if those tokens change.
export const fieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(64,80,53,0.45)' },
    '&:hover fieldset': { borderColor: 'rgba(64,80,53,0.45)' },
    '&.Mui-focused fieldset': { borderColor: '#5B6952', borderWidth: '2px' },
    '&.Mui-disabled fieldset': { borderColor: 'rgba(64,80,53,0.2)' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(64,80,53,0.6)',
    '&.Mui-focused': { color: '#5B6952' },
    '&.Mui-disabled': { color: 'rgba(64,80,53,0.4)' },
  },
  '& .MuiInputBase-input': { color: '#405035' },
  '& .MuiFormHelperText-root': { color: 'rgba(64,80,53,0.55)' },
};
