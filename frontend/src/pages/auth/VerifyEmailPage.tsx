import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import { useAuth } from '../../context/useAuth';
import { apiUrl } from '../../lib/api';

type Status = 'pending' | 'success' | 'error';

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'error');
  const [error, setError] = useState(token ? '' : 'Missing verification token');
  const didRun = useRef(false);

  useEffect(() => {
    // One-shot tokens must only be consumed once, regardless of StrictMode double-invocation.
    if (didRun.current) return;
    didRun.current = true;

    if (!token) return;

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/verify-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token! }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Verification failed');
          setStatus('error');
          return;
        }
        setStatus('success');
        refreshUser().catch(() => {
          // user may not be signed in on this device
        });
      } catch {
        setError('Unable to connect to server');
        setStatus('error');
      }
    })();
  }, [token, refreshUser]);

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex items-center justify-center px-4">
      <Paper
        elevation={0}
        className="w-full max-w-[420px] p-8 rounded-2xl border border-olive-main/25 bg-cream-soft text-center"
      >
        {status === 'pending' && (
          <>
            <CircularProgress size={40} />
            <Typography variant="h6" className="!mt-4 !font-bold !text-olive-main">
              Verifying your email…
            </Typography>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircleIcon className="!text-olive-main !text-5xl" />
            <Typography variant="h5" className="!mt-2 !font-bold !text-olive-main">
              Email verified
            </Typography>
            <Typography variant="body2" className="!text-olive-light !mt-2">
              {user
                ? "You're all set. Welcome to Plunt."
                : 'Your email is confirmed. Sign in to continue.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(user ? '/' : '/login')}
              className="!mt-6 !py-2.5 !px-6 !text-base !rounded !normal-case !font-semibold !bg-olive-light !shadow-none"
            >
              {user ? 'Go to your plants' : 'Sign in'}
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <ErrorOutlineIcon className="!text-accent-red !text-5xl" />
            <Typography variant="h5" className="!mt-2 !font-bold !text-olive-main">
              Verification failed
            </Typography>
            <Typography variant="body2" className="!text-olive-light !mt-2">
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              className="!mt-6 !py-2.5 !px-6 !text-base !rounded !normal-case !border-olive-main/35 !text-olive-main/55 !bg-cream-soft"
            >
              Back to sign in
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default VerifyEmailPage;
