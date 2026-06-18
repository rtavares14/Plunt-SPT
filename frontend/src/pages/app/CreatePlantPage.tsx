import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { useAuth } from '../../context/useAuth';
import { uploadImage } from '../../api/uploads';
import { createPlant, listPlanters, type Sunlight, type PlanterSummary } from '../../api/plants';
import { fieldSx } from '../../lib/fieldSx';

interface Step {
  key: 'photo' | 'species' | 'location';
  label: string;
}

const STEPS: Step[] = [
  { key: 'photo', label: 'Photo' },
  { key: 'species', label: 'Species' },
  { key: 'location', label: 'Location' },
];

const LIGHT_OPTIONS: { value: Sunlight; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

function CreatePlantPage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [sunlight, setSunlight] = useState<Sunlight>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [planterId, setPlanterId] = useState('');
  const [planters, setPlanters] = useState<PlanterSummary[]>([]);
  const [wateringIntervalDays, setWateringIntervalDays] = useState('7');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listPlanters(authFetch);
        if (!cancelled) setPlanters(list);
      } catch {
        // ignore: planter assignment just stays unavailable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (!user) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canAdvance = step.key !== 'species' || name.trim().length > 0;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(authFetch, 'plant', file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function next() {
    setError(null);
    if (!canAdvance) {
      setError('Give your plant a name first.');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    if (stepIndex === 0) {
      navigate('/profile');
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    if (!name.trim()) {
      setError('Give your plant a name first.');
      setStepIndex(1);
      return;
    }
    const interval = Number(wateringIntervalDays);
    if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
      setError('Watering interval must be between 1 and 365 days.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPlant(authFetch, {
        name: name.trim(),
        species: species.trim() || null,
        notes: notes.trim() || null,
        planterId: planterId || null,
        sunlight,
        wateringIntervalDays: interval,
        imageUrl: imageUrl ?? null,
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the plant');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Step progress bar */}
      <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-4 border-b border-olive-main/15 bg-cream-soft">
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-3 sm:gap-5 flex-none">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                      current || done
                        ? 'bg-olive-main text-cream-soft'
                        : 'bg-olive-main/15 text-olive-light'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-lg sm:text-xl whitespace-nowrap ${
                      current ? 'text-olive-main font-semibold' : 'text-olive-light'
                    }`}
                  >
                    {s.label}
                  </span>
                </span>
                {i < STEPS.length - 1 ? (
                  <span className="hidden sm:block w-10 h-px bg-olive-main/25" />
                ) : null}
              </div>
            );
          })}
        </div>
        <span className="text-olive-light text-lg sm:text-xl whitespace-nowrap tabular-nums">
          {String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
        </span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Journal panel */}
        <section className="lg:w-[52%] xl:w-[48%] bg-journal border-r border-olive-main/15 px-6 sm:px-12 py-8 sm:py-12">
          <div className="max-w-xl mx-auto">
            {error ? (
              <Alert severity="error" className="!mb-6 !rounded-lg">
                {error}
              </Alert>
            ) : null}

            {step.key === 'photo' ? (
              <PhotoStep
                imageUrl={imageUrl}
                uploading={uploading}
                onPick={() => fileInputRef.current?.click()}
                onClear={() => setImageUrl(null)}
              />
            ) : null}

            {step.key === 'species' ? (
              <div className="space-y-6">
                <header>
                  <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
                    Identify your plant
                  </Typography>
                  <p className="text-olive-light text-xl mt-1">
                    The more we know, the better we'll remind you.
                  </p>
                </header>

                <Field label="Common name">
                  <TextField
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 50))}
                    placeholder="Vera the slow Monstera"
                    fullWidth
                    sx={fieldSx}
                  />
                </Field>

                <Field label="Scientific name">
                  <TextField
                    value={species}
                    onChange={(e) => setSpecies(e.target.value.slice(0, 70))}
                    placeholder="Monstera deliciosa"
                    fullWidth
                    sx={fieldSx}
                  />
                </Field>

                <Field label="Light">
                  <TextField
                    select
                    value={sunlight}
                    onChange={(e) => setSunlight(e.target.value as Sunlight)}
                    fullWidth
                    sx={fieldSx}
                  >
                    {LIGHT_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Field>

                <Field label="Notes">
                  <TextField
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                    placeholder="Found at a flea market in Alfama…"
                    fullWidth
                    multiline
                    minRows={2}
                    sx={fieldSx}
                  />
                </Field>
              </div>
            ) : null}

            {step.key === 'location' ? (
              <div className="space-y-6">
                <header>
                  <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
                    Where does it live?
                  </Typography>
                  <p className="text-olive-light text-xl mt-1">
                    Set a planter and a watering schedule.
                  </p>
                </header>

                <Field label="Water every (days)">
                  <TextField
                    type="number"
                    value={wateringIntervalDays}
                    onChange={(e) => setWateringIntervalDays(e.target.value)}
                    slotProps={{ htmlInput: { min: 1, max: 365 } }}
                    fullWidth
                    sx={fieldSx}
                  />
                </Field>

                <Field label="Planter">
                  <TextField
                    select
                    value={planterId}
                    onChange={(e) => setPlanterId(e.target.value)}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{ select: { displayEmpty: true } }}
                    helperText={
                      planters.length === 0
                        ? 'Create a planter first to group plants by where they live.'
                        : undefined
                    }
                  >
                    <MenuItem value="">No planter</MenuItem>
                    {planters.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} ({p.isIndoor ? 'Indoor' : 'Outdoor'})
                      </MenuItem>
                    ))}
                  </TextField>
                </Field>
              </div>
            ) : null}

            <div className="flex items-center justify-between mt-10">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={back}
                disabled={submitting}
                className="!text-olive-main !text-lg !normal-case hover:!bg-olive-main/5"
              >
                Back
              </Button>
              {isLast ? (
                <Button
                  onClick={submit}
                  disabled={submitting || uploading}
                  className="!bg-olive-main !text-cream-soft !text-lg !normal-case !rounded-lg !px-6 !py-2.5 hover:!bg-olive-light disabled:!opacity-60"
                >
                  {submitting ? 'Planting…' : 'Plant it'}
                </Button>
              ) : (
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={next}
                  className="!bg-olive-main !text-cream-soft !text-lg !normal-case !rounded-lg !px-6 !py-2.5 hover:!bg-olive-light"
                >
                  Next: {STEPS[stepIndex + 1].label}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Polaroid preview */}
        <section className="flex-1 flex items-center justify-center px-6 py-10 sm:py-16">
          <div className="rotate-1 bg-cream-soft p-4 pb-6 rounded-sm shadow-lg border border-olive-main/10 w-full max-w-md">
            <div
              className={`relative aspect-[4/5] w-full flex items-center justify-center ${
                imageUrl ? '' : 'bg-stripes-olive'
              }`}
              style={
                imageUrl
                  ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            >
              {!imageUrl ? (
                <span className="font-mono text-sm text-cream-soft bg-olive-main/80 px-3 py-1.5 rounded">
                  &lt;photo: your plant&gt;
                </span>
              ) : null}
            </div>
            <p className="text-center text-accent-clay text-xl mt-4 italic">
              {name.trim() || 'your plant'} · day 1
            </p>
          </div>
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-olive-main text-lg font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function PhotoStep({
  imageUrl,
  uploading,
  onPick,
  onClear,
}: {
  imageUrl: string | null;
  uploading: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-6">
      <header>
        <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
          Snap your plant
        </Typography>
        <p className="text-olive-light text-xl mt-1">
          A photo makes it feel real. You can always add one later.
        </p>
      </header>

      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="w-full rounded-2xl border-2 border-dashed border-olive-main/30 bg-cream-soft/60 py-14 flex flex-col items-center justify-center gap-3 text-olive-light hover:border-olive-light hover:bg-cream-soft transition-colors disabled:opacity-60"
      >
        {uploading ? (
          <CircularProgress size={32} className="!text-olive-main" />
        ) : (
          <CloudUploadOutlinedIcon className="!text-5xl !text-olive-main" />
        )}
        <span className="text-xl">
          {uploading ? 'Uploading…' : imageUrl ? 'Replace photo' : 'Upload a photo'}
        </span>
      </button>

      {imageUrl ? (
        <Button
          onClick={onClear}
          className="!text-accent-clay !text-lg !normal-case hover:!bg-accent-clay/5"
        >
          Remove photo
        </Button>
      ) : null}
    </div>
  );
}

export default CreatePlantPage;
