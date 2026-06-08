import { useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import { useAuth } from '../context/useAuth';
import { uploadImage, type UploadKind } from '../api/uploads';

type Variant = 'avatar' | 'banner';

interface EditableImageProps {
  /** Layout: a clipped circle (avatar) or a wide rectangle (banner). */
  variant: Variant;
  /** Cloudinary folder kind. Defaults to the variant for avatar/banner. */
  kind?: UploadKind;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Surfaces upload failures to the parent (e.g. a page-level Alert). */
  onError?: (message: string) => void;
  /** Lets the parent disable Save while a Cloudinary upload is in flight. */
  onUploadingChange?: (uploading: boolean) => void;
  alt?: string;
  /** Sizing / positioning for the image container. */
  className?: string;
}

const menuItemSx = {
  borderRadius: '7px',
  px: 1.25,
  py: 0.6,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
} as const;

const menuLabelStyle = {
  fontFamily: "'Lateef', Georgia, serif",
  fontSize: '0.875rem',
  fontWeight: 500,
} as const;

/**
 * Editable image with an in-place camera button that opens a photo-options menu
 * (Upload / Choose from library / Remove). Handles the hidden file input and the
 * Cloudinary upload internally, then reports the resulting URL via `onChange`.
 * Reused anywhere a user replaces a picture (profile avatar/banner, plant photos…).
 */
function EditableImage({
  variant,
  kind,
  value,
  onChange,
  onError,
  onUploadingChange,
  alt = '',
  className = '',
}: EditableImageProps) {
  const { authFetch } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const isAvatar = variant === 'avatar';
  const uploadKind: UploadKind = kind ?? variant;

  const openMenu = (e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  // `capture` opens the device camera; removing it opens the gallery/file dialog.
  // Desktop falls back to the file dialog either way.
  const openPicker = (source: 'camera' | 'library') => {
    const input = inputRef.current;
    closeMenu();
    if (!input) return;
    if (source === 'camera') input.setAttribute('capture', isAvatar ? 'user' : 'environment');
    else input.removeAttribute('capture');
    input.click();
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadImage(authFetch, uploadKind, file);
      onChange(url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const onRemove = () => {
    onChange(null);
    closeMenu();
  };

  const cameraButton = isAvatar ? (
    <button
      type="button"
      onClick={openMenu}
      disabled={uploading}
      aria-label="Profile picture options"
      aria-haspopup="menu"
      className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-olive-light/80 text-cream-soft flex items-center justify-center ring-2 ring-cream-soft shadow-md hover:bg-olive-light transition-colors disabled:opacity-60"
    >
      <PhotoCameraOutlinedIcon className="!text-[14px] sm:!text-[16px]" />
    </button>
  ) : (
    <button
      type="button"
      onClick={openMenu}
      disabled={uploading}
      aria-label="Banner image options"
      aria-haspopup="menu"
      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-olive-light/80 text-cream-soft flex items-center justify-center shadow-md hover:bg-olive-light transition-colors disabled:opacity-60"
    >
      <PhotoCameraOutlinedIcon className="!text-[16px] sm:!text-[18px]" />
    </button>
  );

  const bannerStyle = value
    ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <div
      className={`relative ${isAvatar ? '' : value ? '' : 'bg-stripes-olive'} ${className}`}
      style={isAvatar ? undefined : bannerStyle}
    >
      {isAvatar ? (
        <div
          className={`w-full h-full rounded-full ring-4 ring-cream-soft overflow-hidden ${value ? 'bg-cream-main' : 'bg-stripes-olive'}`}
        >
          {value ? <img src={value} alt={alt} className="w-full h-full object-cover" /> : null}
        </div>
      ) : null}

      {cameraButton}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
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
          sx={{ ...menuItemSx, mb: 0.1, '&:hover': { backgroundColor: 'rgba(64,80,53,0.08)' } }}
        >
          <FileUploadOutlinedIcon sx={{ fontSize: 16, color: '#405035', flexShrink: 0 }} />
          <span style={{ ...menuLabelStyle, color: '#405035' }}>Upload photo</span>
        </MenuItem>

        <MenuItem
          onClick={() => openPicker('library')}
          sx={{ ...menuItemSx, mb: 0.1, '&:hover': { backgroundColor: 'rgba(64,80,53,0.08)' } }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 16, color: '#405035', flexShrink: 0 }} />
          <span style={{ ...menuLabelStyle, color: '#405035' }}>Choose from library</span>
        </MenuItem>

        {value ? <Divider sx={{ borderColor: 'rgba(64,80,53,0.15)', my: 0.4, mx: 0.75 }} /> : null}

        {value ? (
          <MenuItem
            onClick={onRemove}
            sx={{ ...menuItemSx, '&:hover': { backgroundColor: 'rgba(184,92,74,0.07)' } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16, color: '#B85C4A', flexShrink: 0 }} />
            <span style={{ ...menuLabelStyle, color: '#B85C4A' }}>Remove photo</span>
          </MenuItem>
        ) : null}
      </Menu>
    </div>
  );
}

export default EditableImage;
