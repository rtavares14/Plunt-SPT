import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { Link as RouterLink } from 'react-router-dom';
import { apiUrl } from '../../lib/api';
import AuthHero from '../../components/AuthHero';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong');
        return;
      }
      setSent(true);
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
              Forgot your password?
            </Typography>
            <Typography variant="body1" className="!text-olive-light !mt-1">
              We'll email you a link to set a new one
            </Typography>
          </Box>

          {sent ? (
            <>
              <Alert severity="success">
                If an account exists for that email, we've sent a reset link. Check your inbox.
              </Alert>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                className="!mt-6 !py-3 !text-lg !rounded !normal-case !font-semibold !bg-olive-light !shadow-none"
              >
                Back to sign in
              </Button>
            </>
          ) : (
            <>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 text-lg rounded normal-case font-semibold bg-olive-light text-cream-soft shadow-none w-full flex items-center justify-center disabled:opacity-60"
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Send reset link'}
                </button>
              </form>

              <Typography
                variant="body2"
                className="!text-center !mt-5 !text-olive-main !font-semibold"
              >
                Remembered it?{' '}
                <Box
                  component={RouterLink}
                  to="/login"
                  className="text-olive-main font-bold no-underline hover:underline"
                >
                  Sign in
                </Box>
              </Typography>
            </>
          )}
        </Box>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
