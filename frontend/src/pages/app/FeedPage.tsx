import { useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import NavBar from '../../components/NavBar';

function FeedPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <Box className="min-h-screen bg-cream-main flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex flex-col">
      <NavBar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Typography className="!text-olive-main !text-5xl sm:!text-6xl !font-semibold !mb-3">
          Welcome, {user.name}.
        </Typography>
        <Typography className="!text-olive-light !text-2xl sm:!text-3xl !max-w-2xl">
          Your feed will live here. Plant updates, watering reminders from friends, and what your
          garden is up to.
        </Typography>
      </main>
    </Box>
  );
}

export default FeedPage;
