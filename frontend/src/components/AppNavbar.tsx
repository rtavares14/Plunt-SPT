import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import YardIcon from '@mui/icons-material/Yard';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const navButtonClass =
  'hover:!bg-cream hover:!text-green-main !bg-green-second !text-cream disabled:!opacity-60 disabled:!text-cream';

function AppNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppBar position="fixed" className="!bg-green-second">
      <Toolbar className="flex justify-between">
        <Box className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <YardIcon className="text-cream" />
          <Typography variant="h6" component="span" className="!font-bold !text-cream">
            Plunt
          </Typography>
        </Box>

        <Box className="flex items-center gap-2">
          <IconButton
            disabled
            aria-label="Friends (coming soon)"
            className={navButtonClass}
          >
            <PeopleIcon />
          </IconButton>
          <IconButton
            disabled
            aria-label="Notifications (coming soon)"
            className={navButtonClass}
          >
            <NotificationsIcon />
          </IconButton>

          <IconButton
            disableRipple
            aria-label={user ? 'Profile' : 'Sign in'}
            onClick={() => navigate(user ? '/profile' : '/auth')}
            className="hover:!bg-transparent"
          >
            <AccountCircleIcon className="!text-cream hover:!text-green-main" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AppNavbar;
