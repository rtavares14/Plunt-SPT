import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import HomeIcon from '@mui/icons-material/Home';
import ParkIcon from '@mui/icons-material/Park';
import AddIcon from '@mui/icons-material/Add';
import type { PlanterSummary } from '../../../api/plants';
import PlanterSelectionTile from './PlanterSelectionTile';

interface HomeStepProps {
  plantName: string;
  planterId: string | null;
  onPlanterSelect: (id: string | null) => void;
  planters: PlanterSummary[];
  onNewPlanterClick: () => void;
}

function HomeStep({
  plantName,
  planterId,
  onPlanterSelect,
  planters,
  onNewPlanterClick,
}: HomeStepProps) {
  return (
    <Box key="step-home" className="flex flex-col gap-5 animate-fade-up">
      <Box className="flex flex-col gap-1">
        <h3 className="font-display text-2xl text-green-main leading-tight font-medium">
          Where does {plantName.trim() || 'this plant'} live?
        </h3>
        <p className="font-body text-sm text-bark/80">
          Pick a planter, skip for now, or create a new one — you can re-pot any time.
        </p>
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlanterSelectionTile
          selected={planterId === null}
          onClick={() => onPlanterSelect(null)}
          icon={<LocalFloristIcon sx={{ color: '#0f7033' }} />}
          title="No planter"
          subtitle="Skip · decide later"
        />
        {planters.map((p) => (
          <PlanterSelectionTile
            key={p.id}
            selected={planterId === p.id}
            onClick={() => onPlanterSelect(p.id)}
            image={p.imageUrl}
            icon={
              p.isIndoor ? (
                <HomeIcon sx={{ color: '#0f7033' }} />
              ) : (
                <ParkIcon sx={{ color: '#0f7033' }} />
              )
            }
            title={p.name}
            subtitle={p.isIndoor ? 'Indoor' : 'Outdoor'}
          />
        ))}
        <PlanterSelectionTile
          dashed
          onClick={onNewPlanterClick}
          icon={<AddIcon sx={{ color: '#0f7033' }} />}
          title="New planter"
          subtitle="Create one now"
        />
      </Box>

      {planters.length === 0 && (
        <Alert
          severity="info"
          icon={<LocalFloristIcon fontSize="small" />}
          className="!rounded-xl !mt-1"
          sx={{
            backgroundColor: 'rgba(231, 243, 236, 0.7)',
            color: '#14532d',
            border: '1px solid rgba(20,83,45,0.12)',
            '& .MuiAlert-icon': { color: '#0f7033' },
          }}
        >
          Planters help you group plants by spot. Skip for now or create one with "New
          planter".
        </Alert>
      )}
    </Box>
  );
}

export default HomeStep;
