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
        <Box className="w-full max-w-[440px] rounded-2xl border border-olive-main/25 bg-cream-soft px-6 py-10 sm:px-8 shadow-sm">
          <Box className="text-center mb-6">
            <Typography
              variant="h3"
              className="!text-4xl !font-bold !text-olive-main"
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
                  className="!py-2.5 !text-base !normal-case !font-medium !border-olive-main/35 !text-olive-main/55 !bg-cream-soft disabled:!border-olive-main/25 disabled:!text-olive-main/45"
                >
                  Continue with Apple
                </Button>
              </span>
            </Tooltip>

            <div className="google-login-wrapper flex justify-center w-full overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            </div>
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
              slotProps={{ inputLabel: { shrink: true, className: 'text-lg' } }}
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
                inputLabel: { shrink: true, className: 'text-lg' },
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
              className="!mt-2 !py-3 !text-lg !rounded !normal-case !font-semibold !bg-olive-light !shadow-none"
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            component={RouterLink}
            to="/forgot-password"
            className="!block !text-center !text-olive-light !mt-4 !no-underline hover:!underline"
          >
            Forgot password?
          </Typography>

          <Typography variant="body2" className="!text-center !mt-3 !text-olive-main !font-semibold">
            Don't have an account?{' '}
            <Box
              component={RouterLink}
              to="/signup"
              className="text-olive-main font-bold no-underline hover:underline"
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
