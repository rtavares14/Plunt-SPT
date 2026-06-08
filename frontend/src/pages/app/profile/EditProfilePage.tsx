import { useEffect, useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/useAuth';
import EditableImage from '../../../components/EditableImage';
import CityAutocomplete from '../../../components/CityAutocomplete';
import { fieldSx } from '../../../lib/fieldSx';

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
  const { user, setUser, authFetch } = useAuth();

  const [form, setForm] = useState<FormState | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  useEffect(() => {
    if (user && !form) {
      setForm(fromUser(user));
      setAvatarUrl(user.avatarUrl ?? null);
      setBannerUrl(user.bannerUrl ?? null);
    }
  }, [user, form]);

  if (!user || !form) {
    return (
      <Box className="flex-1 flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  const updateField = (key: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setCity = (city: string) => {
    setForm((prev) => (prev ? { ...prev, city } : prev));
    setFieldErrors((prev) => ({ ...prev, city: undefined }));
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
          avatarUrl,
          bannerUrl,
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
        <EditableImage
          variant="banner"
          value={bannerUrl}
          onChange={setBannerUrl}
          onError={setError}
          onUploadingChange={setUploading}
          className="h-40 sm:h-52"
        />

        <div className="relative pt-16 sm:pt-20 px-6 sm:px-10 pb-6">
          <div className="absolute -top-12 left-6 sm:-top-14 sm:left-10">
            <EditableImage
              variant="avatar"
              value={avatarUrl}
              onChange={setAvatarUrl}
              onError={setError}
              onUploadingChange={setUploading}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28"
            />
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
              sx={fieldSx}
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={updateField('username')}
              error={Boolean(fieldErrors.username)}
              helperText={fieldErrors.username ?? 'Letters, numbers, underscore. 3–20 characters.'}
              slotProps={{ htmlInput: { maxLength: 20 } }}
              fullWidth
              sx={fieldSx}
            />
            <CityAutocomplete
              value={form.city}
              onChange={setCity}
              error={Boolean(fieldErrors.city)}
              helperText={fieldErrors.city ?? 'Powered by Photon / OpenStreetMap'}
            />
            <TextField
              label="Email"
              value={user.email}
              disabled
              helperText="Contact support to change your email."
              fullWidth
              sx={fieldSx}
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
              sx={fieldSx}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <Button
              onClick={() => navigate('/profile')}
              disabled={saving || uploading}
              className="!text-olive-main !text-lg !normal-case !px-5"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || uploading}
              className="!bg-olive-main !text-cream-soft !text-lg !normal-case !rounded-lg !px-6 hover:!bg-olive-light"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EditProfilePage;
