import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/useAuth';
import { uploadImage, type UploadKind } from '../../api/uploads';

interface Props {
  kind: UploadKind;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

function ImageUploadField({ kind, value, onChange, label = 'Photo' }: Props) {
  const { authFetch } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 10 MB or smaller');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(authFetch, kind, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box className="flex flex-col gap-1.5">
      <span className="font-body text-[11px] uppercase tracking-[0.16em] text-bark/70">
        {label}
      </span>

      <Box className="flex items-center gap-3">
        <Box
          onClick={pick}
          role="button"
          aria-label={value ? 'Change photo' : 'Upload photo'}
          className="relative flex items-center justify-center w-20 h-20 rounded-2xl border border-dashed cursor-pointer overflow-hidden shrink-0"
          sx={{
            borderColor: 'rgba(20,83,45,0.25)',
            backgroundColor: '#ffffff',
            transition: 'background-color 150ms, border-color 150ms',
            '&:hover': {
              borderColor: 'rgba(20,83,45,0.5)',
              backgroundColor: 'rgba(20,83,45,0.04)',
            },
          }}
        >
          {value ? (
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOutlinedIcon
              sx={{ color: 'rgba(20,83,45,0.45)', fontSize: 26 }}
            />
          )}
          {uploading && (
            <Box
              className="absolute inset-0 flex items-center justify-center"
              sx={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
            >
              <CircularProgress size={20} sx={{ color: '#14532d' }} />
            </Box>
          )}
        </Box>

        <Box className="flex flex-col gap-1 min-w-0">
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="self-start font-body text-sm font-medium text-green-main hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="self-start font-body text-xs text-bark/70 hover:text-bark inline-flex items-center gap-1"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
              Remove
            </button>
          )}
          {!value && !uploading && (
            <span className="font-body text-xs text-bark/70">JPG or PNG · up to 10 MB</span>
          )}
          {error && (
            <span className="font-body text-xs text-red-700">{error}</span>
          )}
        </Box>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void handleFile(f);
        }}
      />
    </Box>
  );
}

export default ImageUploadField;
