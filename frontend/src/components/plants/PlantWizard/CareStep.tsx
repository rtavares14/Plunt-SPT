import { useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Sunlight } from '../../../api/plants';
import CareCard from './CareCard';

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

interface CareStepProps {
  wateringIntervalDays: number;
  onWateringChange: (days: number) => void;
  sunlight: Sunlight;
  onSunlightChange: (value: Sunlight) => void;
  dateAcquired: string;
  onDateAcquiredChange: (value: string) => void;
  lastWateredAt: string;
  onLastWateredChange: (value: string) => void;
  minTemp: string;
  onMinTempChange: (value: string) => void;
  maxTemp: string;
  onMaxTempChange: (value: string) => void;
}

function CareStep({
  wateringIntervalDays,
  onWateringChange,
  sunlight,
  onSunlightChange,
  dateAcquired,
  onDateAcquiredChange,
  lastWateredAt,
  onLastWateredChange,
  minTemp,
  onMinTempChange,
  maxTemp,
  onMaxTempChange,
}: CareStepProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Box key="step-care" className="flex flex-col gap-4 animate-fade-up">
      {/* Watering interval */}
      <CareCard
        icon={<WaterDropIcon sx={{ fontSize: 18 }} />}
        label="Watering"
        hint={
          <>
            every{' '}
            <span className="font-display text-green-main text-base">
              {wateringIntervalDays}
            </span>{' '}
            day{wateringIntervalDays === 1 ? '' : 's'}
          </>
        }
      >
        <Box sx={{ pt: 0.5, px: 3 }}>
          <Slider
            value={wateringIntervalDays}
            onChange={(_, v) => onWateringChange(v as number)}
            min={1}
            max={30}
            marks={[
              { value: 7, label: '7d' },
              { value: 14, label: '14d' },
              { value: 30, label: '30d' },
            ]}
            sx={{
              color: '#14532d',
              '& .MuiSlider-track': { backgroundColor: '#14532d' },
              '& .MuiSlider-rail': { backgroundColor: 'rgba(20,83,45,0.18)' },
              '& .MuiSlider-thumb': {
                backgroundColor: '#14532d',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(20,83,45,0.16)',
                },
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#14532d',
                width: 6,
                height: 6,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              },
              '& .MuiSlider-markLabel': {
                fontSize: 12,
                color: 'rgba(20,83,45,0.7)',
              },
            }}
          />
        </Box>
      </CareCard>

      {/* Sunlight preference */}
      <CareCard
        icon={<WbSunnyIcon sx={{ fontSize: 18 }} />}
        label="Sunlight"
      >
        <ToggleButtonGroup
          exclusive
          value={sunlight}
          onChange={(_, v: Sunlight | null) => v && onSunlightChange(v)}
          fullWidth
          sx={{
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid rgba(20,83,45,0.18) !important',
              borderRadius: '12px !important',
              textTransform: 'none',
              fontWeight: 500,
              color: '#14532d',
              paddingY: '10px',
              backgroundColor: '#ffffff',
              '&.Mui-selected': {
                backgroundColor: '#14532d',
                color: '#fbf6ec',
                '&:hover': { backgroundColor: '#0f3d20' },
              },
            },
          }}
        >
          <ToggleButton value="LOW" className="!gap-2">
            <NightsStayIcon fontSize="small" />
            Low
          </ToggleButton>
          <ToggleButton value="MEDIUM" className="!gap-2">
            <WbCloudyIcon fontSize="small" />
            Medium
          </ToggleButton>
          <ToggleButton value="HIGH" className="!gap-2">
            <WbSunnyIcon fontSize="small" />
            High
          </ToggleButton>
        </ToggleButtonGroup>
      </CareCard>

      {/* Timeline dates */}
      <CareCard
        icon={<EventNoteIcon sx={{ fontSize: 18 }} />}
        label="Timeline"
      >
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Date acquired"
            type="date"
            value={dateAcquired}
            onChange={(e) => onDateAcquiredChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
          <TextField
            label="Last watered (optional)"
            type="date"
            value={lastWateredAt}
            onChange={(e) => onLastWateredChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
        </Box>
      </CareCard>

      {/* Advanced — Weather alerts */}
      <Box className="rounded-2xl border border-green-main/10 bg-white/70 backdrop-blur-sm">
        <Box
          className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <Box className="flex items-center gap-2.5">
            <Box className="flex items-center justify-center w-8 h-8 rounded-full bg-green-mist text-green-second">
              <ThermostatIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <div className="font-display text-lg text-green-main leading-none font-medium">
                Weather alerts
              </div>
              <div className="font-body text-[11px] uppercase tracking-[0.16em] text-bark/70 mt-1">
                advanced · optional
              </div>
            </Box>
          </Box>
          <IconButton
            size="small"
            sx={{
              color: '#14532d',
              transform: showAdvanced ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Collapse in={showAdvanced} unmountOnExit>
          <Box className="px-5 pb-5 pt-1 flex flex-col gap-3">
            <Box className="grid grid-cols-2 gap-3">
              <TextField
                label="Min temp °C"
                type="number"
                value={minTemp}
                onChange={(e) => onMinTempChange(e.target.value)}
                slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                sx={fieldSx}
              />
              <TextField
                label="Max temp °C"
                type="number"
                value={maxTemp}
                onChange={(e) => onMaxTempChange(e.target.value)}
                slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                sx={fieldSx}
              />
            </Box>
            <p className="font-body text-xs text-bark/75">
              We'll warn you when local weather drifts outside this range.
            </p>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default CareStep;
