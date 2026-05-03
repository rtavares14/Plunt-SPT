import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useAuth } from '../../context/useAuth';
import {
  listPlanters,
  listPlants,
  deletePlant,
  deletePlanter,
  type PlanterSummary,
  type PlantSummary,
  type Sunlight,
} from '../../api/plants';
import PlantWizard from './PlantWizard';
import PlanterDialog from './PlanterDialog';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function sunlightIcon(s: Sunlight) {
  if (s === 'HIGH') return <WbSunnyIcon fontSize="inherit" />;
  if (s === 'LOW') return <NightsStayIcon fontSize="inherit" />;
  return <WbCloudyIcon fontSize="inherit" />;
}

/* ------------------------------------------------------------------ */
/*  Cards                                                              */
/* ------------------------------------------------------------------ */

function PlantCard({
  plant,
  onEdit,
  onDelete,
}: {
  plant: PlantSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const photo = plant.images?.[0]?.url ?? null;
  return (
    <Box className="flex items-center gap-3 p-3 rounded-xl border border-plunt-200 bg-white">
      <Avatar
        src={photo ?? undefined}
        variant="rounded"
        sx={{ width: 56, height: 56, bgcolor: '#e7f3ec' }}
      >
        <LocalFloristIcon sx={{ color: '#0f7033' }} />
      </Avatar>
      <Box className="flex-1 min-w-0">
        <Typography className="!font-semibold !text-plunt-900 truncate">
          {plant.name}
        </Typography>
        {plant.species && (
          <Typography variant="caption" className="!italic !text-gray-500 block truncate">
            {plant.species}
          </Typography>
        )}
        <Box className="flex items-center gap-2 mt-1 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <WaterDropIcon fontSize="inherit" />
            {plant.wateringIntervalDays}d
          </span>
          <span className="inline-flex items-center gap-1">
            {sunlightIcon(plant.sunlight)}
            {plant.sunlight.toLowerCase()}
          </span>
          {plant.planter && (
            <span className="inline-flex items-center gap-1">
              {plant.planter.isIndoor ? (
                <HomeIcon fontSize="inherit" />
              ) : (
                <ParkIcon fontSize="inherit" />
              )}
              {plant.planter.name}
            </span>
          )}
        </Box>
      </Box>
      <IconButton
        size="small"
        onClick={onEdit}
        aria-label={`Edit ${plant.name}`}
        sx={{
          color: '#14532d',
          flexShrink: 0,
          '&:hover': { color: '#0f3d20', backgroundColor: 'rgba(20,83,45,0.08)' },
        }}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        aria-label={`Delete ${plant.name}`}
        sx={{
          color: '#b91c1c',
          flexShrink: 0,
          '&:hover': { color: '#991b1b', backgroundColor: 'rgba(185,28,28,0.08)' },
        }}
      >
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function PlanterCard({
  planter,
  onEdit,
  onDelete,
}: {
  planter: PlanterSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Box className="flex items-center gap-3 p-3 rounded-xl border border-plunt-200 bg-white">
      <Avatar
        src={planter.imageUrl ?? undefined}
        variant="rounded"
        sx={{ width: 48, height: 48, bgcolor: '#e7f3ec' }}
      >
        {planter.isIndoor ? (
          <HomeIcon sx={{ color: '#0f7033' }} />
        ) : (
          <ParkIcon sx={{ color: '#0f7033' }} />
        )}
      </Avatar>
      <Box className="flex-1 min-w-0">
        <Typography className="!font-semibold !text-plunt-900 truncate">
          {planter.name}
        </Typography>
        <Box className="flex items-center gap-2 mt-1">
          <Chip
            size="small"
            label={planter.isIndoor ? 'Indoor' : 'Outdoor'}
            variant="outlined"
          />
          {planter._count && (
            <Typography variant="caption" className="!text-gray-500">
              {planter._count.plants} plant{planter._count.plants === 1 ? '' : 's'}
            </Typography>
          )}
        </Box>
      </Box>
      <IconButton
        size="small"
        onClick={onEdit}
        aria-label={`Edit ${planter.name}`}
        sx={{
          color: '#14532d',
          flexShrink: 0,
          '&:hover': { color: '#0f3d20', backgroundColor: 'rgba(20,83,45,0.08)' },
        }}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        aria-label={`Delete ${planter.name}`}
        sx={{
          color: '#b91c1c',
          flexShrink: 0,
          '&:hover': { color: '#991b1b', backgroundColor: 'rgba(185,28,28,0.08)' },
        }}
      >
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirmation dialog                                                */
/* ------------------------------------------------------------------ */

type PendingDelete =
  | { kind: 'plant'; id: string; name: string }
  | { kind: 'planter'; id: string; name: string; plantCount: number };

function DeleteConfirmDialog({
  pending,
  onConfirm,
  onCancel,
  deleting,
}: {
  pending: PendingDelete;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  const body =
    pending.kind === 'planter' && pending.plantCount > 0
      ? `${pending.plantCount} plant${pending.plantCount === 1 ? '' : 's'} inside will be kept but unassigned from this planter.`
      : 'This cannot be undone.';

  return (
    <Dialog
      open
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            backgroundColor: '#fbf6ec',
            boxShadow: '0 20px 50px -20px rgba(20,83,45,0.3)',
          },
        },
      }}
    >
      <DialogContent className="!pt-6 !pb-2 !px-7">
        <div className="font-body text-[11px] uppercase tracking-[0.2em] text-bark/60 mb-1">
          {pending.kind === 'plant' ? 'Remove plant' : 'Remove planter'}
        </div>
        <h2 className="font-display text-[1.5rem] leading-tight text-green-main font-medium">
          Delete "{pending.name}"?
        </h2>
        <p className="font-body text-sm text-bark/80 mt-2">{body}</p>
      </DialogContent>
      <DialogActions
        className="!px-7 !py-4 !gap-2 !justify-end"
        sx={{
          borderTop: '1px solid rgba(20,83,45,0.08)',
          mt: 2,
          backgroundColor: 'rgba(246,239,225,0.6)',
        }}
      >
        <Button
          onClick={onCancel}
          disabled={deleting}
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
          onClick={onConfirm}
          disabled={deleting}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: '12px',
            backgroundColor: '#b91c1c',
            '&:hover': { backgroundColor: '#991b1b' },
            '&.Mui-disabled': { backgroundColor: 'rgba(185,28,28,0.3)', color: '#fff' },
          }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

function GardenOverview() {
  const { authFetch } = useAuth();
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [planters, setPlanters] = useState<PlanterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [planterDialogOpen, setPlanterDialogOpen] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingPlant, setEditingPlant] = useState<PlantSummary | null>(null);
  const [editingPlanter, setEditingPlanter] = useState<PlanterSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plantList, planterList] = await Promise.all([
          listPlants(authFetch),
          listPlanters(authFetch),
        ]);
        if (cancelled) return;
        setPlants(plantList);
        setPlanters(planterList);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load garden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authFetch]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (pendingDelete.kind === 'plant') {
        await deletePlant(authFetch, pendingDelete.id);
        setPlants((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      } else {
        await deletePlanter(authFetch, pendingDelete.id);
        setPlanters((prev) => prev.filter((p) => p.id !== pendingDelete.id));
        // Plants keep existing but lose their planter reference (SetNull in DB).
        setPlants((prev) =>
          prev.map((p) =>
            p.planterId === pendingDelete.id ? { ...p, planterId: null, planter: null } : p
          )
        );
      }
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box className="flex flex-col gap-4">
      {error && <Alert severity="error">{error}</Alert>}
      {deleteError && (
        <Alert severity="error" onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      <Box className="flex items-center justify-between">
        <Typography variant="subtitle2" className="!font-bold !text-gray-700">
          Planters
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setPlanterDialogOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          New planter
        </Button>
      </Box>

      {loading ? (
        <Box className="flex justify-center py-4">
          <CircularProgress size={20} />
        </Box>
      ) : planters.length === 0 ? (
        <Typography variant="body2" className="!text-gray-500 !italic">
          No planters yet.
        </Typography>
      ) : (
        <Box className="flex flex-col gap-2">
          {planters.map((p) => (
            <PlanterCard
              key={p.id}
              planter={p}
              onEdit={() => setEditingPlanter(p)}
              onDelete={() =>
                setPendingDelete({
                  kind: 'planter',
                  id: p.id,
                  name: p.name,
                  plantCount: p._count?.plants ?? 0,
                })
              }
            />
          ))}
        </Box>
      )}

      <Box className="flex items-center justify-between mt-2">
        <Typography variant="subtitle2" className="!font-bold !text-gray-700">
          Plants
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setWizardOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Add plant
        </Button>
      </Box>

      {loading ? null : plants.length === 0 ? (
        <Typography variant="body2" className="!text-gray-500 !italic">
          No plants yet, start with "Add plant".
        </Typography>
      ) : (
        <Box className="flex flex-col gap-2">
          {plants.map((p) => (
            <PlantCard
              key={p.id}
              plant={p}
              onEdit={() => setEditingPlant(p)}
              onDelete={() =>
                setPendingDelete({ kind: 'plant', id: p.id, name: p.name })
              }
            />
          ))}
        </Box>
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          pending={pendingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setPendingDelete(null)}
          deleting={deleting}
        />
      )}

      <PlantWizard
        open={wizardOpen || !!editingPlant}
        plant={editingPlant}
        onClose={() => {
          setWizardOpen(false);
          setEditingPlant(null);
        }}
        planters={planters}
        onSaved={(plant) =>
          setPlants((prev) => {
            const idx = prev.findIndex((p) => p.id === plant.id);
            if (idx === -1) return [plant, ...prev];
            const next = [...prev];
            next[idx] = plant;
            return next;
          })
        }
        onPlanterCreated={(planter) =>
          setPlanters((prev) => [planter, ...prev.filter((p) => p.id !== planter.id)])
        }
      />
      <PlanterDialog
        open={planterDialogOpen || !!editingPlanter}
        planter={editingPlanter}
        onClose={() => {
          setPlanterDialogOpen(false);
          setEditingPlanter(null);
        }}
        onSaved={(planter) =>
          setPlanters((prev) => {
            const idx = prev.findIndex((p) => p.id === planter.id);
            if (idx === -1) return [planter, ...prev];
            const next = [...prev];
            next[idx] = { ...prev[idx], ...planter };
            return next;
          })
        }
      />
    </Box>
  );
}

export default GardenOverview;
