import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import type { PlanterSummary } from '../api/plants';

interface PlanterCardProps {
  planter: PlanterSummary;
  onClick?: () => void;
  onDelete?: (planter: PlanterSummary) => void;
}

function PlanterCard({ planter, onClick, onDelete }: PlanterCardProps) {
  const image = planter.imageUrl;
  const plantCount = planter._count?.plants ?? 0;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col text-left rounded-2xl border border-olive-main/15 bg-cream-soft overflow-hidden shadow-sm transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onDelete ? (
        <IconButton
          aria-label="Delete planter"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(planter);
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
          {planter.name}
        </Typography>
        {planter.description ? (
          <p className="text-olive-light text-base leading-snug mt-1 line-clamp-2">
            {planter.description}
          </p>
        ) : null}
        <div className="flex items-center gap-4 text-olive-light mt-auto pt-3 text-base">
          <span className="flex items-center gap-1">
            {planter.isIndoor ? (
              <HomeOutlinedIcon className="!text-xl" />
            ) : (
              <WbSunnyOutlinedIcon className="!text-xl" />
            )}
            {planter.isIndoor ? 'Indoor' : 'Outdoor'}
          </span>
          <span className="flex items-center gap-1">
            <GrassOutlinedIcon className="!text-xl" />
            {plantCount} {plantCount === 1 ? 'plant' : 'plants'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlanterCard;
