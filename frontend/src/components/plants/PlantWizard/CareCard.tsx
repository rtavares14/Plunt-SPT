import Box from '@mui/material/Box';

interface Props {
  icon: React.ReactNode;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

function CareCard({ icon, label, hint, children }: Props) {
  return (
    <Box className="rounded-2xl border border-green-main/10 bg-white/70 backdrop-blur-sm p-5 overflow-hidden">
      <Box className="flex items-center justify-between gap-3 mb-3">
        <Box className="flex items-center gap-2.5">
          <Box className="flex items-center justify-center w-8 h-8 rounded-full bg-green-mist text-green-second">
            {icon}
          </Box>
          <span className="font-display text-lg text-green-main font-medium">{label}</span>
        </Box>
        {hint && (
          <span className="font-body text-xs text-bark/70 tracking-wide">{hint}</span>
        )}
      </Box>
      {children}
    </Box>
  );
}

export default CareCard;
