import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { useAuth } from '../../context/useAuth';
import { uploadImage } from '../../api/uploads';
import { createPlanter } from '../../api/plants';
import { fieldSx } from '../../lib/fieldSx';

interface Step {
  key: 'photo' | 'details';
  label: string;
}

const STEPS: Step[] = [
  { key: 'photo', label: 'Photo' },
  { key: 'details', label: 'Details' },
];

function CreatePlanterPage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isIndoor, setIsIndoor] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canAdvance = step.key !== 'details' || name.trim().length > 0;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(authFetch, 'planter', file);
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
      setError('Give your planter a name first.');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    if (stepIndex === 0) {
      navigate('/profile', { state: { tab: 'planters' } });
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    if (!name.trim()) {
      setError('Give your planter a name first.');
      setStepIndex(1);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPlanter(authFetch, {
        name: name.trim(),
        description: description.trim() || null,
        isIndoor,
        imageUrl: imageUrl ?? null,
      });
      navigate('/profile', { state: { tab: 'planters' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the planter');
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
              <div className="space-y-6">
                <header>
                  <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
                    Picture the spot
                  </Typography>
                  <p className="text-olive-light text-xl mt-1">
                    A photo of the pot, shelf, or corner your plants call home.
                  </p>
                </header>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
                    onClick={() => setImageUrl(null)}
                    className="!text-accent-clay !text-lg !normal-case hover:!bg-accent-clay/5"
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
            ) : null}

            {step.key === 'details' ? (
              <div className="space-y-6">
                <header>
                  <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
                    Name your planter
                  </Typography>
                  <p className="text-olive-light text-xl mt-1">
                    Group plants by where they live, like the kitchen window or the balcony.
                  </p>
                </header>

                <label className="block">
                  <span className="block text-olive-main text-lg font-semibold mb-1.5">Name</span>
                  <TextField
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    placeholder="Kitchen window"
                    fullWidth
                    sx={fieldSx}
                  />
                </label>

                <label className="block">
                  <span className="block text-olive-main text-lg font-semibold mb-1.5">
                    Description
                  </span>
                  <TextField
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="South-facing, gets afternoon sun…"
                    fullWidth
                    multiline
                    minRows={2}
                    sx={fieldSx}
                  />
                </label>

                <div>
                  <span className="block text-olive-main text-lg font-semibold mb-1.5">
                    Where is it?
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: true, label: 'Indoor' },
                      { value: false, label: 'Outdoor' },
                    ].map((opt) => {
                      const selected = isIndoor === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setIsIndoor(opt.value)}
                          className={`rounded-lg border px-4 py-3 text-lg transition-colors ${
                            selected
                              ? 'border-olive-main bg-olive-main text-cream-soft'
                              : 'border-olive-main/30 text-olive-main hover:border-olive-light'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                  {submitting ? 'Creating…' : 'Create planter'}
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
                  &lt;photo: your planter&gt;
                </span>
              ) : null}
            </div>
            <p className="text-center text-accent-clay text-xl mt-4 italic">
              {name.trim() || 'your planter'} · {isIndoor ? 'indoor' : 'outdoor'}
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

export default CreatePlanterPage;
