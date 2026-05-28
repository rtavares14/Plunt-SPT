import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
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
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
              className="!mt-6 !py-3 !text-lg !rounded !normal-case !font-semibold !bg-olive-light !shadow-none"
            >
              Sign in
            </Button>
          </>
        ) : (
          <>
            {error && (
              <Alert severity="error" className="!mb-4" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-3">
              <TextField
                label="New password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="new-password"
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
                disabled={loading}
                fullWidth
                className="!mt-2 !py-3 !text-lg !rounded !normal-case !font-semibold !bg-olive-light !shadow-none"
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset password'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default ResetPasswordPage;
