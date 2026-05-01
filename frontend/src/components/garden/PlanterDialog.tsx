import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import { useAuth } from '../../context/useAuth';
import { createPlanter, type PlanterSummary } from '../../api/garden';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (planter: PlanterSummary) => void;
}

function PlanterDialog({ open, onClose, onCreated }: Props) {
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle className="!font-bold !text-green-main">New planter</DialogTitle>
      <DialogContent className="!flex !flex-col !gap-4 !pt-2">
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Name"
          placeholder="e.g. Living-room shelf"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        <TextField
          label="Description"
          placeholder="Optional — light conditions, location notes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <Box className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">Where is it?</span>
          <ToggleButtonGroup
            exclusive
            value={isIndoor ? 'indoor' : 'outdoor'}
            onChange={(_, v) => v && setIsIndoor(v === 'indoor')}
            fullWidth
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
          helperText="Optional. Paste an image URL — uploads coming soon."
        />
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!canSubmit}
        >
          {submitting ? 'Saving…' : 'Create planter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PlanterDialog;
