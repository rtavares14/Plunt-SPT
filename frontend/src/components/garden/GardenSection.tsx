import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { useAuth } from '../../context/useAuth';
import {
  listPlanters,
  listPlants,
  type PlanterSummary,
  type PlantSummary,
  type Sunlight,
} from '../../api/garden';
import PlantWizard from './PlantWizard';
import PlanterDialog from './PlanterDialog';

function sunlightIcon(s: Sunlight) {
  if (s === 'HIGH') return <WbSunnyIcon fontSize="inherit" />;
  if (s === 'LOW') return <NightsStayIcon fontSize="inherit" />;
  return <WbCloudyIcon fontSize="inherit" />;
}

function PlantCard({ plant }: { plant: PlantSummary }) {
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
    </Box>
  );
}

function PlanterCard({ planter }: { planter: PlanterSummary }) {
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
    </Box>
  );
}

function GardenSection() {
  const { authFetch } = useAuth();
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [planters, setPlanters] = useState<PlanterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [planterDialogOpen, setPlanterDialogOpen] = useState(false);

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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load garden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  return (
    <Box className="flex flex-col gap-4">
      {error && <Alert severity="error">{error}</Alert>}

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
            <PlanterCard key={p.id} planter={p} />
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
          No plants yet — start with “Add plant”.
        </Typography>
      ) : (
        <Box className="flex flex-col gap-2">
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </Box>
      )}

      <PlantWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        planters={planters}
        onCreated={(plant) => setPlants((prev) => [plant, ...prev])}
        onPlanterCreated={(planter) =>
          setPlanters((prev) => [planter, ...prev.filter((p) => p.id !== planter.id)])
        }
      />
      <PlanterDialog
        open={planterDialogOpen}
        onClose={() => setPlanterDialogOpen(false)}
        onCreated={(planter) =>
          setPlanters((prev) => [planter, ...prev.filter((p) => p.id !== planter.id)])
        }
      />
    </Box>
  );
}

export default GardenSection;
