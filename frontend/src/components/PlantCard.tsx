import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import type { PlantSummary } from '../api/plants';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Human label for when a plant is next due for water, derived from the last
 * watering (falling back to when it was acquired) plus its interval.
 */
function wateringLabel(plant: PlantSummary): string {
  const base = plant.lastWateredAt ?? plant.dateAcquired;
  const due = new Date(base).getTime() + plant.wateringIntervalDays * DAY_MS;
  const days = Math.ceil((due - Date.now()) / DAY_MS);
  if (days <= 0) return 'Needs water now';
  if (days === 1) return 'Water tomorrow';
  return `Water in ${days} days`;
}

interface PlantCardProps {
  plant: PlantSummary;
  onClick?: () => void;
  onDelete?: (plant: PlantSummary) => void;
}

function PlantCard({ plant, onClick, onDelete }: PlantCardProps) {
  const image = plant.images?.[0]?.url ?? null;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col text-left rounded-2xl border border-olive-main/15 bg-cream-soft overflow-hidden shadow-sm transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onDelete ? (
        <IconButton
          aria-label="Delete plant"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(plant);
          }}
          className="!absolute !top-2 !right-2 !z-10 !bg-cream-soft/80 !text-accent-clay hover:!bg-cream-soft"
          size="small"
        >
          <DeleteOutlineIcon className="!text-xl" />
        </IconButton>
      ) : null}
      <div
        className={`h-32 sm:h-36 w-full ${image ? '' : 'bg-stripes-olive'}`}
        style={
          image
            ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      />
      <div className="px-4 py-3 flex flex-col flex-1">
        <Typography className="!text-olive-main !text-xl sm:!text-2xl !font-semibold !leading-tight truncate">
          {plant.name}
        </Typography>
        {plant.notes ? (
          <p className="text-olive-light text-base leading-snug mt-1 line-clamp-2">
            {plant.notes}
          </p>
        ) : null}
        <div className="flex items-center justify-between text-olive-light mt-auto pt-3">
          <div className="flex items-center gap-4">
            <WaterDropOutlinedIcon className="!text-xl" />
            <RepeatIcon className="!text-xl" />
          </div>
          <span className="text-base sm:text-lg leading-tight">
            {wateringLabel(plant)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlantCard;
