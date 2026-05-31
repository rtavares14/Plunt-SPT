import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import NavBar from '../../components/NavBar';
import { uploadImage } from '../../api/uploads';
import { searchCities, type CitySuggestion } from '../../lib/geocoding';

type Field = 'name' | 'username' | 'bio' | 'city';

interface FormState {
  name: string;
  username: string;
  bio: string;
  city: string;
}

function fromUser(user: { name: string; username: string; bio?: string | null; city?: string | null }): FormState {
  return {
    name: user.name,
    username: user.username,
    bio: user.bio ?? '',
    city: user.city ?? '',
  };
}

function EditProfilePage() {
  const navigate = useNavigate();
  const { user, loading, setUser, authFetch } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [cityOptions, setCityOptions] = useState<CitySuggestion[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user && !form) {
      setForm(fromUser(user));
      setAvatarUrl(user.avatarUrl ?? null);
      setBannerUrl(user.bannerUrl ?? null);
    }
  }, [user, form]);

  // Debounced city lookup against Nominatim. The 1 req/s policy is well respected
  // by the 350ms debounce + AbortController cancelling in-flight requests as the
  // user keeps typing.
  const cityQuery = form?.city ?? '';
  useEffect(() => {
    if (cityQuery.trim().length < 2) {
      setCityOptions([]);
      setCityLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setCityLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const results = await searchCities(cityQuery, ctrl.signal);
        setCityOptions(results);
      } catch {
        // ignore: aborted or network error — keep last options
      } finally {
        setCityLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(handle);
      ctrl.abort();
    };
  }, [cityQuery]);

  if (loading || !user || !form) {
    return (
      <Box className="min-h-screen bg-cream-main flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  const updateField = (key: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const pickFile = async (kind: 'avatar' | 'banner', file: File) => {
    setUploading(kind);
    setError(null);
    try {
      const url = await uploadImage(authFetch, kind, file);
      if (kind === 'avatar') setAvatarUrl(url);
      else setBannerUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(null);
    }
  };

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void pickFile('avatar', file);
  };

  const onBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void pickFile('banner', file);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          bio: form.bio,
          city: form.city,
          avatarUrl: avatarUrl,
          bannerUrl: bannerUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.errors && typeof data.errors === 'object') {
          setFieldErrors(data.errors);
        }
        setError(data?.error ?? `Could not save (${res.status})`);
        return;
      }
      if (data.user) setUser(data.user);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex flex-col">
      <NavBar />

      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/profile')}
            className="!text-olive-main !text-lg !normal-case"
          >
            Back
          </Button>
          <Typography className="!text-olive-main !text-3xl sm:!text-4xl !font-semibold">
            Edit profile
          </Typography>
          <span className="w-20" aria-hidden />
        </div>

        {error ? (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        ) : null}

        <section className="relative rounded-xl overflow-hidden border border-olive-main/15 bg-cream-soft">
          <div
            className={`relative h-40 sm:h-52 ${bannerUrl ? '' : 'bg-stripes-olive'}`}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            <Button
              startIcon={<PhotoCameraOutlinedIcon />}
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading === 'banner'}
              className="!absolute !top-3 !right-3 sm:!top-4 sm:!right-4 !bg-olive-light/80 !text-cream-soft !text-base !normal-case !rounded-md !px-3 !py-1.5 hover:!bg-olive-light"
            >
              {uploading === 'banner' ? 'Uploading…' : bannerUrl ? 'Change banner' : 'Add banner'}
            </Button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onBannerChange}
            />
          </div>

          <div className="relative pt-16 sm:pt-20 px-6 sm:px-10 pb-6">
            <div className="absolute -top-12 left-6 sm:-top-14 sm:left-10">
              <div
                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-cream-soft overflow-hidden ${avatarUrl ? '' : 'bg-stripes-olive'}`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : null}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === 'avatar'}
                  aria-label="Change avatar"
                  className="absolute inset-0 flex items-center justify-center bg-olive-main/40 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <PhotoCameraOutlinedIcon className="!text-cream-soft" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </div>
              {uploading === 'avatar' ? (
                <Typography className="!text-olive-light !text-sm !mt-1">Uploading…</Typography>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <TextField
                label="Name"
                value={form.name}
                onChange={updateField('name')}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name ?? ' '}
                slotProps={{ htmlInput: { maxLength: 80 } }}
                fullWidth
              />
              <TextField
                label="Username"
                value={form.username}
                onChange={updateField('username')}
                error={Boolean(fieldErrors.username)}
                helperText={fieldErrors.username ?? 'Letters, numbers, underscore. 3–20 characters.'}
                slotProps={{ htmlInput: { maxLength: 20 } }}
                fullWidth
              />
              <Autocomplete
                freeSolo
                options={cityOptions.map((o) => o.label)}
                loading={cityLoading}
                value={form.city}
                onChange={(_, v) => {
                  setForm((prev) => (prev ? { ...prev, city: v ?? '' } : prev));
                  setFieldErrors((prev) => ({ ...prev, city: undefined }));
                }}
                onInputChange={(_, v) => {
                  const capped = v.length > 100 ? v.slice(0, 100) : v;
                  setForm((prev) => (prev ? { ...prev, city: capped } : prev));
                  setFieldErrors((prev) => ({ ...prev, city: undefined }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    error={Boolean(fieldErrors.city)}
                    helperText={fieldErrors.city ?? 'Powered by Photon / OpenStreetMap'}
                    placeholder="Start typing a city…"
                  />
                )}
                fullWidth
              />
              <TextField
                label="Email"
                value={user.email}
                disabled
                helperText="Contact support to change your email."
                fullWidth
              />
              <TextField
                label="Bio"
                value={form.bio}
                onChange={updateField('bio')}
                error={Boolean(fieldErrors.bio)}
                helperText={fieldErrors.bio ?? `${form.bio.length} / 500`}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                multiline
                minRows={3}
                placeholder="Tell people about your garden."
                className="sm:col-span-2"
                fullWidth
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <Button
                onClick={() => navigate('/profile')}
                disabled={saving || uploading !== null}
                className="!text-olive-main !text-lg !normal-case !px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || uploading !== null}
                className="!bg-olive-main !text-cream-soft !text-lg !normal-case !rounded-lg !px-6 hover:!bg-olive-light"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </Box>
  );
}

export default EditProfilePage;
