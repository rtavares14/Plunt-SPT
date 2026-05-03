import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import CloseIcon from '@mui/icons-material/Close';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { useAuth } from '../../context/useAuth';
import { createPlanter, type PlanterSummary } from '../../api/plants';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (planter: PlanterSummary) => void;
}

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

function CreatePlanterForm({ open, onClose, onCreated }: Props) {
  const { authFetch } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isIndoor, setIsIndoor] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setIsIndoor(true);
    setImageUrl('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const planter = await createPlanter(authFetch, {
        name: name.trim(),
        description: description.trim() || null,
        isIndoor,
        imageUrl: imageUrl.trim() || null,
      });
      onCreated(planter);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create planter');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
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
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow:
              '0 30px 60px -25px rgba(20, 83, 45, 0.35), 0 12px 24px -12px rgba(20, 83, 45, 0.18)',
          },
        },
      }}
    >
      {/* Header */}
      <Box className="flex justify-end px-4 pt-3">
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

      <Box className="px-7 pt-2 pb-2">
        <div className="font-body text-[11px] uppercase tracking-[0.28em] text-bark/70">
          New planter
        </div>
        <h2 className="font-display text-[1.75rem] leading-tight text-green-main mt-1 font-medium">
          A home for your plant
        </h2>
      </Box>

      <DialogContent
        className="!px-7 !pb-2 !flex !flex-col !gap-4"
        sx={{ '&.MuiDialogContent-root': { paddingTop: '16px !important' } }}
      >
        {error && (
          <Alert severity="error" className="!rounded-xl">
            {error}
          </Alert>
        )}

        <TextField
          label="Name"
          placeholder="e.g. Living room shelf"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 80 } }}
          sx={fieldSx}
        />

        <TextField
          label="Description"
          placeholder="Light conditions, location notes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          sx={fieldSx}
        />

        <Box className="flex flex-col gap-2">
          <span className="font-display text-base text-green-main font-medium">
            Where does it live?
          </span>
          <ToggleButtonGroup
            exclusive
            value={isIndoor ? 'indoor' : 'outdoor'}
            onChange={(_, v) => v && setIsIndoor(v === 'indoor')}
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
            <ToggleButton value="indoor" className="!gap-2">
              <HomeIcon fontSize="small" />
              Indoor
            </ToggleButton>
            <ToggleButton value="outdoor" className="!gap-2">
              <ParkIcon fontSize="small" />
              Outdoor
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          label="Photo URL"
          placeholder="https://…"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <Box className="flex items-center justify-center mr-2 text-green-main/60">
                  <ImageOutlinedIcon fontSize="small" />
                </Box>
              ),
            },
          }}
          helperText="Optional · uploads coming soon"
          sx={fieldSx}
        />
      </DialogContent>

      <DialogActions
        className="!px-7 !py-4 !justify-end !gap-2"
        sx={{
          borderTop: '1px solid rgba(20,83,45,0.08)',
          backgroundColor: 'rgba(246, 239, 225, 0.6)',
          mt: 2,
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
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
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
          {submitting ? 'Planting…' : 'Create planter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreatePlanterForm;
