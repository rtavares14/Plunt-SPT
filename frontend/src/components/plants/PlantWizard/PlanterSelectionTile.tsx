import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';

interface PlanterSelectionTileProps {
  selected?: boolean;
  dashed?: boolean;
  onClick: () => void;
  image?: string | null;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function PlanterSelectionTile({
  selected,
  dashed,
  onClick,
  image,
  icon,
  title,
  subtitle,
}: PlanterSelectionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200',
        'bg-white focus:outline-none focus:ring-2 focus:ring-green-light/40',
        dashed
          ? 'border-2 border-dashed border-green-main/30 hover:border-green-second'
          : selected
            ? 'border-2 border-green-main'
            : 'border-2 border-green-main/10 hover:border-green-light hover:-translate-y-0.5',
      ].join(' ')}
    >
      <Box
        className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        sx={{
          background: image
            ? `center / cover no-repeat url("${image}")`
            : 'linear-gradient(135deg, #e7f3ec 0%, #d8ead8 100%)',
        }}
      >
        {!image && icon}
      </Box>
      <Box className="flex-1 min-w-0">
        <div className="font-display text-[1.05rem] text-green-main truncate leading-tight font-medium">
          {title}
        </div>
        <div className="font-body text-[11px] uppercase tracking-[0.16em] text-bark/70 mt-0.5">
          {subtitle}
        </div>
      </Box>
      {selected && (
        <Box className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-main text-cream-mist flex items-center justify-center">
          <CheckIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
    </button>
  );
}

export default PlanterSelectionTile;
