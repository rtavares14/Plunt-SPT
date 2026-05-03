import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../../context/useAuth';
import {
  createPlant,
  updatePlant,
  getSpeciesDetail,
  trefleLightToSunlight,
  type PlanterSummary,
  type PlantSummary,
  type SpeciesSearchResult,
  type Sunlight,
} from '../../../api/plants';
import PlanterDialog from '../PlanterDialog';
import WizardStepTracker from './WizardStepTracker';
import { WIZARD_STEPS } from './constants';
import IdentityStep from './IdentityStep';
import HomeStep from './HomeStep';
import CareStep from './CareStep';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface PlantWizardProps {
  open: boolean;
  onClose: () => void;
  onSaved: (plant: PlantSummary) => void;
  planters: PlanterSummary[];
  onPlanterCreated: (planter: PlanterSummary) => void;
  plant?: PlantSummary | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDay(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function PlantWizard({ open, onClose, onSaved, planters, onPlanterCreated, plant }: PlantWizardProps) {
  const { authFetch } = useAuth();
  const isEdit = !!plant;
  const [step, setStep] = useState(0);

  // Step 1 — Identity
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<SpeciesSearchResult | null>(null);
  const [speciesText, setSpeciesText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Step 2 — Home
  const [planterId, setPlanterId] = useState<string | null>(null);
  const [planterDialogOpen, setPlanterDialogOpen] = useState(false);

  // Step 3 — Care
  const [wateringIntervalDays, setWateringIntervalDays] = useState(7);
  const [sunlight, setSunlight] = useState<Sunlight>('MEDIUM');
  const [dateAcquired, setDateAcquired] = useState<string>(todayIso());
  const [lastWateredAt, setLastWateredAt] = useState<string>('');
  const [minTemp, setMinTemp] = useState<string>('');
  const [maxTemp, setMaxTemp] = useState<string>('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Reset all state ---- */
  const reset = () => {
    setStep(0);
    setName('');
    setSpecies(null);
    setSpeciesText('');
    setImageUrl('');
    setPlanterId(null);
    setPlanterDialogOpen(false);
    setWateringIntervalDays(7);
    setSunlight('MEDIUM');
    setDateAcquired(todayIso());
    setLastWateredAt('');
    setMinTemp('');
    setMaxTemp('');
    setError(null);
    setSubmitting(false);
  };

  /* ---- Prefill on open when editing ---- */
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError(null);
    setSubmitting(false);
    setSpecies(null);
    setPlanterDialogOpen(false);
    if (plant) {
      setName(plant.name);
      setSpeciesText(plant.species ?? '');
      setImageUrl(plant.images?.[0]?.url ?? '');
      setPlanterId(plant.planterId);
      setWateringIntervalDays(plant.wateringIntervalDays);
      setSunlight(plant.sunlight);
      setDateAcquired(toIsoDay(plant.dateAcquired));
      setLastWateredAt(toIsoDay(plant.lastWateredAt));
      setMinTemp(plant.minTemp != null ? String(plant.minTemp) : '');
      setMaxTemp(plant.maxTemp != null ? String(plant.maxTemp) : '');
    } else {
      setName('');
      setSpeciesText('');
      setImageUrl('');
      setPlanterId(null);
      setWateringIntervalDays(7);
      setSunlight('MEDIUM');
      setDateAcquired(todayIso());
      setLastWateredAt('');
      setMinTemp('');
      setMaxTemp('');
    }
  }, [open, plant]);

  /* ---- Auto-fill from species detail ---- */
  useEffect(() => {
    if (!species) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getSpeciesDetail(authFetch, species.id);
        if (cancelled || !detail) return;
        const inferred = trefleLightToSunlight(detail.light);
        if (inferred) setSunlight(inferred);
        if (detail.minTemp != null && minTemp === '') setMinTemp(String(detail.minTemp));
        if (detail.maxTemp != null && maxTemp === '') setMaxTemp(String(detail.maxTemp));
      } catch {
        /* soft-fail */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species, authFetch]);

  /* ---- Close handler ---- */
  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  /* ---- Submit handler ---- */
  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const trimmedImage = imageUrl.trim();
      const initialImage = plant?.images?.[0]?.url ?? '';
      const basePayload = {
        name: name.trim(),
        species: speciesText.trim() || null,
        planterId: planterId,
        wateringIntervalDays,
        sunlight,
        minTemp: minTemp === '' ? null : Number(minTemp),
        maxTemp: maxTemp === '' ? null : Number(maxTemp),
        lastWateredAt: lastWateredAt ? new Date(lastWateredAt).toISOString() : null,
        dateAcquired: dateAcquired ? new Date(dateAcquired).toISOString() : null,
      };
      const saved = isEdit
        ? await updatePlant(authFetch, plant!.id, {
            ...basePayload,
            ...(trimmedImage && trimmedImage !== initialImage ? { imageUrl: trimmedImage } : {}),
          })
        : await createPlant(authFetch, { ...basePayload, imageUrl: trimmedImage || null });
      onSaved(saved);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${isEdit ? 'update' : 'create'} plant`);
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvanceFromStep0 = name.trim().length > 0;

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
              <h2 className="font-display text-[2rem] leading-[1.05] text-green-main font-medium">
                {isEdit ? 'Edit plant' : 'A new plant'}
              </h2>
              <p className="font-body text-sm text-bark/80 mt-1.5">
                {isEdit
                  ? 'Three small steps to update its details.'
                  : 'Three small steps to add it to your garden.'}
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

        {/* Step tracker */}
        <Box className="px-7 pb-6">
          <WizardStepTracker activeStep={step} />
        </Box>

        {/* Step content */}
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
            <Alert severity="error" className="!mb-4 !rounded-xl">
              {error}
            </Alert>
          )}

          {step === 0 && (
            <IdentityStep
              name={name}
              onNameChange={setName}
              species={species}
              speciesText={speciesText}
              onSpeciesChange={(s, text) => {
                setSpecies(s);
                setSpeciesText(text);
              }}
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
            />
          )}

          {step === 1 && (
            <HomeStep
              plantName={name}
              planterId={planterId}
              onPlanterSelect={setPlanterId}
              planters={planters}
              onNewPlanterClick={() => setPlanterDialogOpen(true)}
            />
          )}

          {step === 2 && (
            <CareStep
              wateringIntervalDays={wateringIntervalDays}
              onWateringChange={setWateringIntervalDays}
              sunlight={sunlight}
              onSunlightChange={setSunlight}
              dateAcquired={dateAcquired}
              onDateAcquiredChange={setDateAcquired}
              lastWateredAt={lastWateredAt}
              onLastWateredChange={setLastWateredAt}
              minTemp={minTemp}
              onMinTempChange={setMinTemp}
              maxTemp={maxTemp}
              onMaxTempChange={setMaxTemp}
            />
          )}
        </DialogContent>

        {/* Navigation footer */}
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
            {step < WIZARD_STEPS.length - 1 ? (
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
                {submitting
                  ? isEdit
                    ? 'Saving…'
                    : 'Plunting…'
                  : isEdit
                    ? 'Save changes'
                    : 'Plunt it'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <PlanterDialog
        open={planterDialogOpen}
        onClose={() => setPlanterDialogOpen(false)}
        onSaved={(planter) => {
          onPlanterCreated(planter);
          setPlanterId(planter.id);
        }}
      />
    </>
  );
}

export default PlantWizard;
