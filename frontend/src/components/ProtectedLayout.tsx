import { useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import NavBar from './NavBar';

// Wraps every authenticated route: redirects to login when signed out and
// renders the shared NavBar once so each page only owns its own content.
function ProtectedLayout() {
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
      <Outlet />
    </Box>
  );
}

export default ProtectedLayout;
