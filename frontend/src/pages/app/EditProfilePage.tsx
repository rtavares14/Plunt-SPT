import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
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

// Shared MUI TextField override — olive border, olive-light on focus (mirrors login inputs)
const fieldSx = {
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

function EditProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, authFetch } = useAuth();
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
  const [imageMenuKind, setImageMenuKind] = useState<'avatar' | 'banner' | null>(null);
  const [imageMenuAnchor, setImageMenuAnchor] = useState<HTMLElement | null>(null);

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
        // ignore: aborted or network error, keep last options
      } finally {
        setCityLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(handle);
      ctrl.abort();
    };
  }, [cityQuery]);

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

  const openImageMenu = (kind: 'avatar' | 'banner') => (e: React.MouseEvent<HTMLElement>) => {
    setImageMenuKind(kind);
    setImageMenuAnchor(e.currentTarget);
  };
  const closeImageMenu = () => {
    setImageMenuAnchor(null);
    setImageMenuKind(null);
  };

  // One hidden input per image. `capture` opens the device camera, no `capture`
  // opens the gallery/file dialog. On desktop both fall back to the file dialog.
  const openPicker = (source: 'camera' | 'library') => {
    const ref = imageMenuKind === 'banner' ? bannerInputRef : avatarInputRef;
    const input = ref.current;
    closeImageMenu();
    if (!input) return;
    if (source === 'camera') input.setAttribute('capture', imageMenuKind === 'banner' ? 'environment' : 'user');
    else input.removeAttribute('capture');
    input.click();
  };
  const onMenuRemove = () => {
    if (imageMenuKind === 'banner') setBannerUrl(null);
    else setAvatarUrl(null);
    closeImageMenu();
  };
  const menuHasImage = imageMenuKind === 'banner' ? Boolean(bannerUrl) : Boolean(avatarUrl);

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
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <button
              type="button"
              onClick={openImageMenu('banner')}
              disabled={uploading === 'banner'}
              aria-label="Banner image options"
              aria-haspopup="menu"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-olive-light/80 text-cream-soft flex items-center justify-center shadow-md hover:bg-olive-light transition-colors disabled:opacity-60"
            >
              <PhotoCameraOutlinedIcon className="!text-[16px] sm:!text-[18px]" />
            </button>
          </div>
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
            <div className="relative">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-cream-soft overflow-hidden ${avatarUrl ? 'bg-cream-main' : 'bg-stripes-olive'}`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : null}
              </div>
              {/* Always-visible camera badge sits outside the clipped circle so
                    the affordance is discoverable on mobile (no hover) and at a
                    glance on desktop. Tapping it opens the photo options menu. */}
              <button
                type="button"
                onClick={openImageMenu('avatar')}
                disabled={uploading === 'avatar'}
                aria-label="Profile picture options"
                aria-haspopup="menu"
                className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-olive-light/80 text-cream-soft flex items-center justify-center ring-2 ring-cream-soft shadow-md hover:bg-olive-light transition-colors disabled:opacity-60"
              >
                <PhotoCameraOutlinedIcon className="!text-[14px] sm:!text-[16px]" />
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
              <Typography className="!text-olive-light !text-sm !mt-2">Uploading…</Typography>
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
              slotProps={{
                paper: {
                  sx: {
                    fontFamily: "'Lateef', Georgia, serif",
                    backgroundColor: '#FAF7EF',
                    border: '1px solid rgba(64,80,53,0.2)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(64,80,53,0.12)',
                    mt: 0.5,
                    '& .MuiAutocomplete-listbox': {
                      padding: '4px 0',
                      '& .MuiAutocomplete-option': {
                        fontFamily: "'Lateef', Georgia, serif",
                        fontSize: '1.15rem',
                        color: '#405035',
                        padding: '10px 18px',
                        '&[aria-selected="true"]': {
                          backgroundColor: 'rgba(64,80,53,0.1)',
                          color: '#405035',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(64,80,53,0.08)',
                        },
                        '&[aria-selected="true"].Mui-focused': {
                          backgroundColor: 'rgba(64,80,53,0.14)',
                        },
                      },
                    },
                    '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
                      fontFamily: "'Lateef', Georgia, serif",
                      fontSize: '1.1rem',
                      color: 'rgba(64,80,53,0.55)',
                    },
                  },
                },
                clearIndicator: {
                  sx: { color: 'rgba(64,80,53,0.5)', '&:hover': { color: '#405035' } },
                },
                popupIndicator: {
                  sx: { color: 'rgba(64,80,53,0.5)', '&:hover': { color: '#405035' } },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  error={Boolean(fieldErrors.city)}
                  helperText={fieldErrors.city ?? 'Powered by Photon / OpenStreetMap'}
                  placeholder="Start typing a city…"
                  sx={fieldSx}
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

      <Menu
        anchorEl={imageMenuAnchor}
        open={Boolean(imageMenuAnchor)}
        onClose={closeImageMenu}
        disablePortal
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { className: '!bg-cream-soft !rounded-xl !shadow-lg', sx: { py: 0, minWidth: 160 } },
          list: { sx: { py: '3px', px: '3px' } },
        }}
      >
        <MenuItem
          onClick={() => openPicker('camera')}
          sx={{ borderRadius: '7px', px: 1.25, py: 0.6, mb: 0.1, minHeight: 0, display: 'flex', alignItems: 'center', gap: '6px', '&:hover': { backgroundColor: 'rgba(64,80,53,0.08)' } }}
        >
          <FileUploadOutlinedIcon sx={{ fontSize: 16, color: '#405035', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Lateef', Georgia, serif", fontSize: '0.875rem', fontWeight: 500, color: '#405035' }}>Upload photo</span>
        </MenuItem>

        <MenuItem
          onClick={() => openPicker('library')}
          sx={{ borderRadius: '7px', px: 1.25, py: 0.6, mb: 0.1, minHeight: 0, display: 'flex', alignItems: 'center', gap: '6px', '&:hover': { backgroundColor: 'rgba(64,80,53,0.08)' } }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 16, color: '#405035', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Lateef', Georgia, serif", fontSize: '0.875rem', fontWeight: 500, color: '#405035' }}>Choose from library</span>
        </MenuItem>

        {menuHasImage ? <Divider sx={{ borderColor: 'rgba(64,80,53,0.15)', my: 0.4, mx: 0.75 }} /> : null}

        {menuHasImage ? (
          <MenuItem
            onClick={onMenuRemove}
            sx={{ borderRadius: '7px', px: 1.25, py: 0.6, minHeight: 0, display: 'flex', alignItems: 'center', gap: '6px', '&:hover': { backgroundColor: 'rgba(184,92,74,0.07)' } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16, color: '#B85C4A', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Lateef', Georgia, serif", fontSize: '0.875rem', fontWeight: 500, color: '#B85C4A' }}>Remove photo</span>
          </MenuItem>
        ) : null}
      </Menu>
    </main>
  );
}

export default EditProfilePage;
