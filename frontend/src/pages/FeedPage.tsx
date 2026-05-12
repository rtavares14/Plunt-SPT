import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import YardIcon from '@mui/icons-material/Yard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function FeedPage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <Box className="min-h-screen bg-cream-main flex items-center justify-center">
        <CircularProgress sx={{ color: '#405035' }} />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 border-b border-olive-main/20">
        <div className="inline-flex items-center gap-2">
          <YardIcon className="!text-olive-main" sx={{ fontSize: 28 }} />
          <span className="text-olive-main text-3xl leading-none font-medium">myPlunt</span>
        </div>
        <Button
          onClick={handleLogout}
          sx={{
            textTransform: 'none',
            color: '#405035',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'rgba(64, 80, 53, 0.08)' },
          }}
        >
          Sign out
        </Button>
      </header>

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
