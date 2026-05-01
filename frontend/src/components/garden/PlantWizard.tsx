import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import { useAuth } from '../../context/useAuth';
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

const STEPS = ['Identity', 'Home', 'Care'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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

  // When user picks a structured species, fetch details and prefill.
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
        // soft-fail — Trefle hints are optional
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

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-green-main !pb-2">
          Add a plant
        </DialogTitle>
        <Box className="px-6">
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <DialogContent className="!flex !flex-col !gap-4 !pt-4">
          {error && <Alert severity="error">{error}</Alert>}

          {step === 0 && (
            <Box className="flex flex-col gap-4">
              <Box className="flex items-center gap-4">
                <Avatar
                  src={imageUrl || undefined}
                  variant="rounded"
                  sx={{ width: 96, height: 96, bgcolor: '#e7f3ec' }}
                >
                  <LocalFloristIcon sx={{ color: '#0f7033', fontSize: 40 }} />
                </Avatar>
                <Box className="flex-1">
                  <TextField
                    label="Nickname"
                    placeholder="Mr. Greenleaf"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    slotProps={{ htmlInput: { maxLength: 80 } }}
                  />
                </Box>
              </Box>

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
                placeholder="https://… (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                fullWidth
                helperText={
                  detailLoading
                    ? 'Pulling care hints from Trefle…'
                    : speciesDetail
                      ? `Auto-filled from ${speciesDetail.commonName ?? speciesDetail.scientificName}.`
                      : 'Paste an image URL — uploads coming soon.'
                }
              />
            </Box>
          )}

          {step === 1 && (
            <Box className="flex flex-col gap-3">
              <span className="text-sm text-gray-600">
                Where does {name.trim() || 'this plant'} live?
              </span>
              <Box className="flex flex-wrap gap-2">
                <Chip
                  label="No planter"
                  variant={planterId === null ? 'filled' : 'outlined'}
                  color={planterId === null ? 'primary' : 'default'}
                  onClick={() => setPlanterId(null)}
                  className="!h-9"
                />
                {planters.map((p) => (
                  <Chip
                    key={p.id}
                    icon={p.isIndoor ? <HomeIcon /> : <ParkIcon />}
                    label={p.name}
                    variant={planterId === p.id ? 'filled' : 'outlined'}
                    color={planterId === p.id ? 'primary' : 'default'}
                    onClick={() => setPlanterId(p.id)}
                    className="!h-9"
                  />
                ))}
                <Chip
                  icon={<AddIcon />}
                  label="New planter"
                  variant="outlined"
                  onClick={() => setPlanterDialogOpen(true)}
                  className="!h-9 !border-dashed"
                />
              </Box>
              {planters.length === 0 && (
                <Alert severity="info" className="!mt-2">
                  Planters help you group plants by spot. Skip for now or create one
                  with “New planter”.
                </Alert>
              )}
            </Box>
          )}

          {step === 2 && (
            <Box className="flex flex-col gap-5">
              <Box className="flex flex-col gap-2">
                <Box className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Watering</span>
                  <span className="text-xs text-gray-500">
                    every {wateringIntervalDays} day{wateringIntervalDays === 1 ? '' : 's'}
                  </span>
                </Box>
                <Slider
                  value={wateringIntervalDays}
                  onChange={(_, v) => setWateringIntervalDays(v as number)}
                  min={1}
                  max={30}
                  marks={[
                    { value: 1, label: '1d' },
                    { value: 7, label: '7d' },
                    { value: 14, label: '14d' },
                    { value: 30, label: '30d' },
                  ]}
                />
              </Box>

              <Box className="flex flex-col gap-2">
                <span className="text-sm font-medium">Sunlight</span>
                <ToggleButtonGroup
                  exclusive
                  value={sunlight}
                  onChange={(_, v: Sunlight | null) => v && setSunlight(v)}
                  fullWidth
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
              </Box>

              <Box className="grid grid-cols-2 gap-3">
                <TextField
                  label="Date acquired"
                  type="date"
                  value={dateAcquired}
                  onChange={(e) => setDateAcquired(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Last watered"
                  type="date"
                  value={lastWateredAt}
                  onChange={(e) => setLastWateredAt(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Optional"
                />
              </Box>

              <Divider />

              <Box>
                <Box
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowAdvanced((v) => !v)}
                >
                  <span className="text-sm font-medium text-gray-700">
                    Weather alerts (advanced)
                  </span>
                  <IconButton size="small">
                    <ExpandMoreIcon
                      style={{
                        transform: showAdvanced ? 'rotate(180deg)' : 'none',
                        transition: 'transform 200ms',
                      }}
                    />
                  </IconButton>
                </Box>
                <Collapse in={showAdvanced} unmountOnExit>
                  <Box className="grid grid-cols-2 gap-3 pt-3">
                    <TextField
                      label="Min temp °C"
                      type="number"
                      value={minTemp}
                      onChange={(e) => setMinTemp(e.target.value)}
                      slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                    />
                    <TextField
                      label="Max temp °C"
                      type="number"
                      value={maxTemp}
                      onChange={(e) => setMaxTemp(e.target.value)}
                      slotProps={{ htmlInput: { step: '0.5', min: -50, max: 60 } }}
                    />
                  </Box>
                  <p className="text-xs text-gray-500 mt-2">
                    We’ll warn you when local weather drifts outside this range.
                  </p>
                </Collapse>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="!px-6 !pb-4 !justify-between">
          <Button onClick={handleClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Box className="flex gap-2">
            {step > 0 && (
              <Button onClick={() => setStep(step - 1)} disabled={submitting}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !canAdvanceFromStep0}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
              >
                {submitting ? 'Saving…' : 'Add plant'}
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
