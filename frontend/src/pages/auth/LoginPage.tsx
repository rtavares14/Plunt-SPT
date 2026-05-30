import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import AppleIcon from '@mui/icons-material/Apple';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';
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
                logo_alignment="center"
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-olive-main text-lg font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border border-olive-main rounded px-3 py-2.5 text-olive-main bg-cream-soft text-lg outline-none hover:border-[1.5px] focus:border-2 focus:border-olive-light placeholder:text-olive-main/40"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-olive-main text-lg font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-olive-main rounded px-3 py-2.5 pr-10 text-olive-main bg-cream-soft text-lg outline-none hover:border-[1.5px] focus:border-2 focus:border-olive-light placeholder:text-olive-main/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-olive-light hover:text-olive-main"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-3 text-lg rounded font-semibold bg-olive-light text-cream-soft w-full flex items-center justify-center disabled:opacity-60"
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
            </button>
          </form>

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
