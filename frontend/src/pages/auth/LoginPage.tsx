import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AppleIcon from '@mui/icons-material/Apple';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { apiUrl } from '../../lib/api';
import AuthHero from '../../components/AuthHero';

const APPLE_SIGNIN_ENABLED = import.meta.env.VITE_APPLE_SIGNIN_ENABLED === 'true';

function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/feed');
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      login(data.token, data.user);
      navigate('/feed');
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (resp: CredentialResponse) => {
    if (!resp.credential) {
      setError('Google sign-in failed');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: resp.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google sign-in failed');
        return;
      }
      login(data.token, data.user);
      navigate('/feed');
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="font-lateef min-h-screen flex bg-cream-main">
      <AuthHero />

      <section className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
        <Box className="w-full max-w-[440px] rounded-2xl border border-olive-main/25 bg-cream-soft px-8 py-10 shadow-sm">
          <Box className="text-center mb-6">
            <Typography
              variant="h3"
              className="!font-bold !text-olive-main"
              sx={{ fontSize: '2.25rem' }}
            >
              Welcome back
            </Typography>
            <Typography variant="body1" className="!text-olive-light !mt-1">
              Log in to your small garden
            </Typography>
          </Box>

          <Box className="flex flex-col gap-3 mb-2">
            <Tooltip
              title={
                APPLE_SIGNIN_ENABLED
                  ? ''
                  : 'Apple sign-in coming soon, requires a paid Apple Developer account'
              }
            >
              <span>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={!APPLE_SIGNIN_ENABLED}
                  startIcon={<AppleIcon />}
                  sx={{
                    borderColor: 'rgba(64, 80, 53, 0.35)',
                    color: 'rgba(64, 80, 53, 0.55)',
                    backgroundColor: '#FAF7EF',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '1rem',
                    py: 1.25,
                    '&:hover': {
                      borderColor: '#405035',
                      backgroundColor: '#ECE7DC',
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(64, 80, 53, 0.25)',
                      color: 'rgba(64, 80, 53, 0.45)',
                    },
                  }}
                >
                  Continue with Apple
                </Button>
              </span>
            </Tooltip>

            <Box
              className="flex justify-center"
              sx={{ '& > div': { width: '100%' }, '& iframe': { margin: '0 auto !important' } }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="376"
              />
            </Box>
          </Box>

          <Divider className="!my-4">
            <Typography variant="body2" className="!text-olive-light !px-2">
              or
            </Typography>
          </Divider>

          {error && (
            <Alert severity="error" className="!mb-4" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              slotProps={{ inputLabel: { shrink: true, sx: { fontSize: '1.15rem' } } }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              slotProps={{
                inputLabel: { shrink: true, sx: { fontSize: '1.15rem' } },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.4,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: 1,
                backgroundColor: '#5B6952',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#405035', boxShadow: 'none' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            component={RouterLink}
            to="/forgot-password"
            className="!block !text-center !text-olive-light !mt-4 hover:underline"
            sx={{ textDecoration: 'none' }}
          >
            Forgot password?
          </Typography>

          <Typography variant="body2" className="!text-center !mt-3 !text-olive-main !font-semibold">
            Don't have an account?{' '}
            <Box
              component={RouterLink}
              to="/signup"
              className="text-olive-main font-bold hover:underline"
              sx={{ textDecoration: 'none' }}
            >
              Sign up here
            </Box>
          </Typography>
        </Box>
      </section>
    </main>
  );
}

export default LoginPage;
