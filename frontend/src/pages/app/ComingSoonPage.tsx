import Typography from '@mui/material/Typography';

// Lightweight placeholder for authenticated pages that don't have their own
// screen yet, so the NavBar links resolve to a real route instead of dead-ending.
function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <Typography className="!text-olive-main !text-5xl sm:!text-6xl !font-semibold !mb-3">
        {title}
      </Typography>
      <Typography className="!text-olive-light !text-2xl sm:!text-3xl !max-w-2xl">
        {description}
      </Typography>
    </main>
  );
}

export default ComingSoonPage;
