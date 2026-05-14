import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import YardIcon from '@mui/icons-material/Yard';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AppleIcon from '@mui/icons-material/Apple';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiUrl } from '../lib/api';

const APPLE_SIGNIN_ENABLED = import.meta.env.VITE_APPLE_SIGNIN_ENABLED === 'true';

type AuthMode = 'login' | 'signup';

function AuthPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — go home
  useEffect(() => {
    if (user) navigate('/feed');
  }, [user, navigate]);

  if (user) return null;

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { email, name, username, password };

    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
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
    <Box className="font-lateef min-h-screen bg-gradient-to-br from-cream-soft via-cream-main to-cream-soft flex items-center justify-center px-4 py-8">
      <Paper
        elevation={0}
        className="w-full max-w-[420px] p-8 rounded-2xl border border-olive-main/20 bg-cream-soft"
      >
        {/* Branding */}
        <Box className="text-center mb-6">
          <YardIcon sx={{ fontSize: 48 }} className="!text-olive-main mb-2" />
          <Typography variant="h4" className="!font-bold !text-olive-main">
            {mode === 'login' ? 'Welcome back' : 'Join Plunt'}
          </Typography>
          <Typography variant="body2" className="!text-olive-light !mt-1">
            {mode === 'login'
              ? 'Sign in to your plant community'
              : 'Create your account and start sharing'}
          </Typography>
        </Box>

        {/* Social buttons */}
        <Box className="flex flex-col gap-3 mb-4 items-stretch">
          <Box className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="356"
            />
          </Box>
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
                  borderColor: 'rgba(64, 80, 53, 0.3)',
                  color: '#405035',
                  textTransform: 'none',
                  fontWeight: 500,
                  py: 1.2,
                  '&:hover': { borderColor: '#405035', backgroundColor: '#ECE7DC' },
                }}
              >
                Continue with Apple
              </Button>
            </span>
          </Tooltip>
        </Box>

        <Divider className="!my-4">
          <Typography variant="body2" className="!text-olive-light !px-2">
            or
          </Typography>
        </Divider>

        {/* Email/password form */}
        {error && (
          <Alert severity="error" className="!mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="name"
              />
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="username"
              />
            </>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="email"
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              backgroundColor: '#405035',
              '&:hover': { backgroundColor: '#5B6952' },
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>

          {mode === 'login' && (
            <Typography
              variant="body2"
              component={RouterLink}
              to="/forgot-password"
              className="!text-center !text-olive-light !mt-1 hover:underline"
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Typography>
          )}
        </Box>

        {/* Toggle mode */}
        <Typography variant="body2" className="!text-center !mt-5 !text-olive-light">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Box
            component="span"
            onClick={toggleMode}
            className="text-olive-main font-semibold cursor-pointer hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}

export default AuthPage;
