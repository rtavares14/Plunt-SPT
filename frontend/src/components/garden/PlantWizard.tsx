import { Fragment, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import SpaIcon from '@mui/icons-material/Spa';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../../context/useAuth';
import plantNames from '../../data/plantNames.json';
import {
  createPlant,
  getSpeciesDetail,
  trefleLightToSunlight,
  type PlanterSummary,
  type PlantSummary,
  type SpeciesDetail,
  type SpeciesSearchResult,
  type Sunlight,
} from '../../api/garden';
import SpeciesAutocomplete from './SpeciesAutocomplete';
import PlanterDialog from './PlanterDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (plant: PlantSummary) => void;
  planters: PlanterSummary[];
  onPlanterCreated: (planter: PlanterSummary) => void;
}

const STEPS = [
  { key: 'identity', label: 'Identity' },
  { key: 'home', label: 'Home' },
  { key: 'care', label: 'Care' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ──────────────── Growing plant icons, one per step ──────────────── */
const STEP_ICONS = [
  <SpaIcon sx={{ fontSize: 15 }} />,         // seedling
  <LocalFloristIcon sx={{ fontSize: 17 }} />, // medium plant
  <ParkIcon sx={{ fontSize: 20 }} />,         // tree
];

/* ──────────────── Step indicator: flex connectors between circles ──────────────── */
function StepTrack({ active }: { active: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {STEPS.map((s, i) => {
        const state: 'done' | 'current' | 'todo' =
          i < active ? 'done' : i === active ? 'current' : 'todo';
        return (
          <Fragment key={s.key}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 56,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  transition: 'all 300ms',
                  ...(state === 'done' && {
                    backgroundColor: '#14532d',
                    color: '#fbf6ec',
                  }),
                  ...(state === 'current' && {
                    backgroundColor: '#fbf6ec',
                    color: '#14532d',
                    border: '2px solid #14532d',
                  }),
                  ...(state === 'todo' && {
                    backgroundColor: '#fbf6ec',
                    color: 'rgba(20,83,45,0.3)',
                    border: '1px solid rgba(20,83,45,0.2)',
                  }),
                }}
              >
                {STEP_ICONS[i]}
              </Box>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: state === 'todo' ? 'rgba(20,83,45,0.35)' : '#14532d',
                  transition: 'color 300ms',
                }}
              >
                {s.label}
              </span>
            </Box>

            {/* connector only between steps — never past first/last circle */}
            {i < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  marginTop: '19px',
                  borderRadius: 1,
                  backgroundColor: i < active ? '#14532d' : 'rgba(20,83,45,0.18)',
                  transition: 'background-color 500ms',
                }}
              />
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}


/* ──────────────── Section card used by the Care step ──────────────── */
interface CareCardProps {
  icon: React.ReactNode;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}
function CareCard({ icon, label, hint, children }: CareCardProps) {
  return (
    <Box className="rounded-2xl border border-green-main/10 bg-white/70 backdrop-blur-sm p-5 overflow-hidden">
      <Box className="flex items-center justify-between gap-3 mb-3">
        <Box className="flex items-center gap-2.5">
          <Box className="flex items-center justify-center w-8 h-8 rounded-full bg-green-mist text-green-second">
            {icon}
          </Box>
          <span
            className="font-display text-lg text-green-main font-medium"
          >
            {label}
          </span>
        </Box>
        {hint && (
          <span className="font-body text-xs text-bark/70 tracking-wide">{hint}</span>
        )}
      </Box>
      {children}
    </Box>
  );
}

/* ──────────────── Planter tile for the Home step ──────────────── */
interface PlanterTileProps {
  selected?: boolean;
  dashed?: boolean;
  onClick: () => void;
  image?: string | null;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}
function PlanterTile({
  selected,
  dashed,
  onClick,
  image,
  icon,
  title,
  subtitle,
}: PlanterTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200',
        'bg-white focus:outline-none focus:ring-2 focus:ring-green-light/40',
        dashed
          ? 'border-2 border-dashed border-green-main/30 hover:border-green-second'
          : selected
            ? 'border-2 border-green-main'
            : 'border-2 border-green-main/10 hover:border-green-light hover:-translate-y-0.5',
      ].join(' ')}
    >
      <Box
        className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        sx={{
          background: image
            ? `center / cover no-repeat url("${image}")`
            : 'linear-gradient(135deg, #e7f3ec 0%, #d8ead8 100%)',
        }}
      >
        {!image && icon}
      </Box>
      <Box className="flex-1 min-w-0">
        <div
          className="font-display text-[1.05rem] text-green-main truncate leading-tight font-medium"
        >
          {title}
        </div>
        <div className="font-body text-[11px] uppercase tracking-[0.16em] text-bark/70 mt-0.5">
          {subtitle}
        </div>
      </Box>
      {selected && (
        <Box className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-main text-cream-mist flex items-center justify-center">
          <CheckIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
    </button>
  );
}

function PlantWizard({ open, onClose, onCreated, planters, onPlanterCreated }: Props) {
  const { authFetch } = useAuth();
  const [step, setStep] = useState(0);

  // Step 1 — identity
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<SpeciesSearchResult | null>(null);
  const [speciesText, setSpeciesText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [speciesDetail, setSpeciesDetail] = useState<SpeciesDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Step 2 — home
  const [planterId, setPlanterId] = useState<string | null>(null);
  const [planterDialogOpen, setPlanterDialogOpen] = useState(false);

  // Step 3 — care
  const [wateringIntervalDays, setWateringIntervalDays] = useState(7);
  const [sunlight, setSunlight] = useState<Sunlight>('MEDIUM');
  const [dateAcquired, setDateAcquired] = useState<string>(todayIso());
  const [lastWateredAt, setLastWateredAt] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minTemp, setMinTemp] = useState<string>('');
  const [maxTemp, setMaxTemp] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setName('');
    setSpecies(null);
    setSpeciesText('');
    setImageUrl('');
    setSpeciesDetail(null);
    setDetailLoading(false);
    setPlanterId(null);
    setPlanterDialogOpen(false);
    setWateringIntervalDays(7);
    setSunlight('MEDIUM');
    setDateAcquired(todayIso());
    setLastWateredAt('');
    setShowAdvanced(false);
    setMinTemp('');
    setMaxTemp('');
    setError(null);
    setSubmitting(false);
  };

  useEffect(() => {
    if (!species) {
      setSpeciesDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const detail = await getSpeciesDetail(authFetch, species.id);
        if (cancelled) return;
        setSpeciesDetail(detail);
        if (detail) {
          if (!imageUrl && detail.imageUrl) setImageUrl(detail.imageUrl);
          const inferred = trefleLightToSunlight(detail.light);
          if (inferred) setSunlight(inferred);
          if (detail.minTemp != null && minTemp === '') setMinTemp(String(detail.minTemp));
          if (detail.maxTemp != null && maxTemp === '') setMaxTemp(String(detail.maxTemp));
        }
      } catch {
        /* soft-fail */
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species, authFetch]);

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const canAdvanceFromStep0 = name.trim().length > 0;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        species: speciesText.trim() || null,
        planterId: planterId,
        wateringIntervalDays,
        sunlight,
        minTemp: minTemp === '' ? null : Number(minTemp),
        maxTemp: maxTemp === '' ? null : Number(maxTemp),
        lastWateredAt: lastWateredAt ? new Date(lastWateredAt).toISOString() : null,
        dateAcquired: dateAcquired ? new Date(dateAcquired).toISOString() : null,
        imageUrl: imageUrl.trim() || null,
      };
      const plant = await createPlant(authFetch, payload);
      onCreated(plant);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create plant');
    } finally {
      setSubmitting(false);
    }
  };

  const photoHelper = useMemo(() => {
    if (detailLoading) return 'Pulling care notes from Trefle…';
    if (speciesDetail) {
      return `Auto-filled from ${speciesDetail.commonName ?? speciesDetail.scientificName}`;
    }
    return 'Paste an image URL — uploads coming soon';
  }, [detailLoading, speciesDetail]);

  /* ──────────────── Field theme: organic, ink-on-paper ──────────────── */
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

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        disablePortal
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#fbf6ec',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow:
                '0 30px 60px -25px rgba(20, 83, 45, 0.35), 0 12px 24px -12px rgba(20, 83, 45, 0.18)',
              backgroundImage:
                'radial-gradient(circle at 0% 0%, rgba(20,83,45,0.05) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(90,74,54,0.04) 0%, transparent 50%)',
            },
          },
        }}
      >
        {/* Header */}
        <Box className="relative px-7 pt-6 pb-5">
          <Box className="flex items-start justify-between gap-4">
            <Box>
              <h2
                className="font-display text-[2rem] leading-[1.05] text-green-main font-medium"
              >
                A new plant
              </h2>
              <p className="font-body text-sm text-bark/80 mt-1.5">
                Three small steps to add it to your garden.
              </p>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={submitting}
              sx={{
                color: 'rgba(20,83,45,0.6)',
                '&:hover': { backgroundColor: 'rgba(20,83,45,0.06)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Custom Stepper */}
        <Box className="px-7 pb-6">
          <StepTrack active={step} />
        </Box>

        <DialogContent
          className="!px-7 !pt-2 !pb-6"
          sx={{
            '&.MuiDialogContent-root': {
              borderTop: '1px solid rgba(20,83,45,0.08)',
              paddingTop: '24px !important',
            },
          }}
        >
          {error && (
            <Alert
              severity="error"
              className="!mb-4 !rounded-xl"
              sx={{}}
            >
              {error}
            </Alert>
          )}

          {/* ──────────────── Step 1 — Identity ──────────────── */}
          {step === 0 && (
            <Box key="step-0" className="flex flex-col gap-5 animate-fade-up">
              <Box className="flex flex-col gap-4">
                <TextField
                  label="Nickname"
                  placeholder="e.g. Mr. Greenleaf"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                                const pick = plantNames[Math.floor(Math.random() * plantNames.length)];
                                setName(pick);
                              }}
                              sx={{
                                color: 'rgba(20,83,45,0.5)',
                                '&:hover': { color: '#14532d', backgroundColor: 'rgba(20,83,45,0.06)' },
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

                <SpeciesAutocomplete
                  value={species}
                  freeText={speciesText}
                  onChange={(s, text) => {
                    setSpecies(s);
                    setSpeciesText(text);
                  }}
                />

                <TextField
                  label="Photo URL"
                  placeholder="https://…"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  fullWidth
                  helperText={photoHelper}
                  sx={fieldSx}
                />
              </Box>
            </Box>
          )}

          {/* ──────────────── Step 2 — Home ──────────────── */}

          {step === 1 && (
            <Box key="step-1" className="flex flex-col gap-5 animate-fade-up">
              <Box className="flex flex-col gap-1">
                <h3
                  className="font-display text-2xl text-green-main leading-tight font-medium"
                >
                  Where does {name.trim() || 'this plant'} live?
                </h3>
                <p className="font-body text-sm text-bark/80">
                  Pick a planter, skip for now, or create a new one — you can
                  re-pot any time.
                </p>
              </Box>

              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PlanterTile
                  selected={planterId === null}
                  onClick={() => setPlanterId(null)}
                  icon={<LocalFloristIcon sx={{ color: '#0f7033' }} />}
                  title="No planter"
                  subtitle="Skip · decide later"
                />
                {planters.map((p) => (
                  <PlanterTile
                    key={p.id}
                    selected={planterId === p.id}
                    onClick={() => setPlanterId(p.id)}
                    image={p.imageUrl}
                    icon={
                      p.isIndoor ? (
                        <HomeIcon sx={{ color: '#0f7033' }} />
                      ) : (
                        <ParkIcon sx={{ color: '#0f7033' }} />
                      )
                    }
                    title={p.name}
                    subtitle={p.isIndoor ? 'Indoor' : 'Outdoor'}
                  />
                ))}
                <PlanterTile
                  dashed
                  onClick={() => setPlanterDialogOpen(true)}
                  icon={<AddIcon sx={{ color: '#0f7033' }} />}
                  title="New planter"
                  subtitle="Create one now"
                />
              </Box>

              {planters.length === 0 && (
                <Alert
                  severity="info"
                  icon={<LocalFloristIcon fontSize="small" />}
                  className="!rounded-xl !mt-1"
                  sx={{
                    backgroundColor: 'rgba(231, 243, 236, 0.7)',
                    color: '#14532d',
                    border: '1px solid rgba(20,83,45,0.12)',
                    '& .MuiAlert-icon': { color: '#0f7033' },
                  }}
                >
                  Planters help you group plants by spot. Skip for now or create one
                  with “New planter”.
                </Alert>
              )}
            </Box>
          )}

          {/* ──────────────── Step 3 — Care ──────────────── */}
          {step === 2 && (
            <Box key="step-2" className="flex flex-col gap-4 animate-fade-up">
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
                    onChange={(_, v) => setWateringIntervalDays(v as number)}
                    min={1}
                    max={30}
                    marks={[
                      { value: 7, label: '7d' },
                      { value: 14, label: '14d' },
                      { value: 30, label: '30d' },
                    ]}
                    sx={{
                      color: '#14532d',
                      '& .MuiSlider-track': {
                        backgroundColor: '#14532d',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(20,83,45,0.18)',
                      },
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

              <CareCard
                icon={<WbSunnyIcon sx={{ fontSize: 18 }} />}
                label="Sunlight"
              >
                <ToggleButtonGroup
                  exclusive
                  value={sunlight}
                  onChange={(_, v: Sunlight | null) => v && setSunlight(v)}
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

              <CareCard
                icon={<EventNoteIcon sx={{ fontSize: 18 }} />}
                label="Timeline"
              >
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Date acquired"
                    type="date"
                    value={dateAcquired}
                    onChange={(e) => setDateAcquired(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Last watered (optional)"
                    type="date"
                    value={lastWateredAt}
                    onChange={(e) => setLastWateredAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx}
                  />
                </Box>
              </CareCard>

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
                      <div
                        className="font-display text-lg text-green-main leading-none font-medium"
                      >
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
                        onChange={(e) => setMinTemp(e.target.value)}
                        slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                        sx={fieldSx}
                      />
                      <TextField
                        label="Max temp °C"
                        type="number"
                        value={maxTemp}
                        onChange={(e) => setMaxTemp(e.target.value)}
                        slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                        sx={fieldSx}
                      />
                    </Box>
                    <p className="font-body text-xs text-bark/75">
                      We’ll warn you when local weather drifts outside this range.
                    </p>
                  </Box>
                </Collapse>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          className="!px-7 !py-4 !justify-between"
          sx={{
            borderTop: '1px solid rgba(20,83,45,0.08)',
            backgroundColor: 'rgba(246, 239, 225, 0.6)',
          }}
        >
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              color: 'rgba(20,83,45,0.7)',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(20,83,45,0.06)' },
            }}
          >
            Cancel
          </Button>
          <Box className="flex gap-2">
            {step > 0 && (
              <Button
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                sx={{
                  textTransform: 'none',
                  color: '#14532d',
                  fontWeight: 500,
                  '&:hover': { backgroundColor: 'rgba(20,83,45,0.08)' },
                }}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !canAdvanceFromStep0}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  backgroundColor: '#14532d',
                  '&:hover': { backgroundColor: '#0f3d20' },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(20,83,45,0.18)',
                    color: 'rgba(255,255,255,0.7)',
                  },
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  backgroundColor: '#14532d',
                  '&:hover': { backgroundColor: '#0f3d20' },
                }}
              >
                {submitting ? 'Plunting…' : 'Plunt it'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <PlanterDialog
        open={planterDialogOpen}
        onClose={() => setPlanterDialogOpen(false)}
        onCreated={(planter) => {
          onPlanterCreated(planter);
          setPlanterId(planter.id);
        }}
      />
    </>
  );
}

export default PlantWizard;
