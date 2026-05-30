import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';
import { apiUrl } from '../../lib/api';

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Box className="min-h-screen bg-cream-main flex items-center justify-center px-4">
        <Paper elevation={0} className="w-full max-w-[420px] p-8 rounded-2xl border border-olive-main/25 bg-cream-soft">
          <Alert severity="error">Missing reset token.</Alert>
        </Paper>
      </Box>
    );
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Reset failed');
        return;
      }
      setDone(true);
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex items-center justify-center px-4">
      <Paper
        elevation={0}
        className="w-full max-w-[420px] p-8 rounded-2xl border border-olive-main/25 bg-cream-soft"
      >
        <Box className="text-center mb-6">
          <LockResetIcon className="!text-olive-main !text-5xl" />
          <Typography variant="h5" className="!font-bold !text-olive-main !mt-2">
            Choose a new password
          </Typography>
        </Box>

        {done ? (
          <>
            <Alert severity="success">
              Your password has been reset. You've been signed out of all devices.
            </Alert>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 py-3 text-lg rounded font-semibold bg-olive-light text-cream-soft w-full flex items-center justify-center"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            {error && (
              <Alert severity="error" className="!mb-4" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-olive-main text-lg font-medium">New password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default ResetPasswordPage;
