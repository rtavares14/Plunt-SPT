import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import YardIcon from '@mui/icons-material/Yard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import { apiUrl } from '../lib/api';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; alreadyRegistered: boolean }
  | { kind: 'error'; message: string };

function errorMessage(status: number, serverMessage?: string): string {
  if (status === 400) return serverMessage ?? "That email doesn't look right.";
  if (status === 429) return 'Too many tries. Give it a minute and try again.';
  if (status >= 500) return 'Our server is having a moment. Please try again later.';
  return serverMessage ?? "Something didn't work. Please try again.";
}

function LandingPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: 'submitting' });

    try {
      const response = await fetch(apiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({ kind: 'error', message: errorMessage(response.status, data?.error) });
        return;
      }

      setStatus({ kind: 'success', alreadyRegistered: Boolean(data?.alreadyRegistered) });
      setEmail('');
    } catch {
      setStatus({
        kind: 'error',
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  const isSubmitting = status.kind === 'submitting';
  const isSuccess = status.kind === 'success';
  const hasAlert = isSuccess || status.kind === 'error';

  return (
    <main className="font-lateef min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <section className="bg-olive-main flex flex-col p-8 sm:p-12 lg:p-16 min-h-[60vh] lg:min-h-screen lg:w-3/5">
        <div className="flex items-center justify-between gap-3 mb-10 lg:mb-0">
          <div className="inline-flex items-center gap-2 bg-olive-light rounded-lg px-5 py-2.5">
            <YardIcon className="text-cream-main" sx={{ fontSize: 28 }} />
            <span className="text-cream-main text-3xl leading-none font-medium">myPlunt</span>
          </div>
          <Link
            to="/auth"
            className="text-cream-main text-xl border border-cream-main/60 rounded-md px-4 py-2 hover:bg-cream-main/10 focus:outline-none focus:ring-2 focus:ring-cream-main/40 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-4xl">
          <h1 className="text-cream-main text-[3.5rem] sm:text-[4.25rem] lg:text-[5.75rem] leading-[1.05] mb-8 font-medium">
            Because plants thrive
            <br />
            with company.
          </h1>
          <p className="text-cream-main text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] leading-relaxed max-w-2xl">
            The right place to connect plant lovers everywhere.
            <br />
            Just you, your loved plants and a little help from
            someone to keep them alive and thriving.
          </p>
        </div>
      </section>

      {/* Right panel 40% */}
      <section className="bg-cream-main flex flex-col justify-center p-8 sm:p-12 lg:p-16 min-h-[40vh] lg:min-h-screen lg:w-2/5">
        {/* Top half heading, form, hr anchored to bottom on lg so they don't move when the box grows */}
        <div>
          <div className="w-full lg:max-w-xl mx-auto">
            <p className="text-olive-main text-4xl sm:text-5xl font-semibold mb-3">Coming soon</p>
            <h2 className="text-olive-light text-2xl sm:text-3xl font-bold leading-snug mb-7">
              We're launching soon (I hope....). Join the waitlist to be the first to know.
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                aria-label="Email address"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status.kind !== 'submitting' && status.kind !== 'idle') {
                    setStatus({ kind: 'idle' });
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-md bg-cream-soft border border-olive-main text-olive-light text-xl placeholder:text-olive-opac focus:outline-none focus:ring-2 focus:ring-olive-main/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting || email.trim().length === 0}
                className="bg-olive-main text-cream-main px-6 py-3 rounded-md text-xl font-semibold whitespace-nowrap hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-olive-main/40 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining…' : 'Join waitlist'}
              </button>
            </form>

            <p className="text-olive-light text-base mt-3">
              We only use your email to tell you when Plunt is live.
              <Link to="/privacy" className="underline hover:opacity-80">
                Read our privacy policy
              </Link>
              .
            </p>

            <hr className="my-9 border-t border-olive-main w-[90%] mx-auto lg:w-auto lg:-mx-10" />
          </div>
        </div>

        {/* Bottom half estimated launch box anchored to top on lg so it grows down into its own space */}
        <div>
          <div className="w-full lg:max-w-xl mx-auto">
            <div className="rounded-xl border border-olive-main p-5 bg-cream-soft">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-olive-opac rounded-md p-2 inline-flex">
                  <CalendarMonthIcon className="text-olive-main" sx={{ fontSize: 22 }} />
                </span>
                <span className="text-olive-main text-2xl font-bold">
                  Estimated launch Winter 2026
                </span>
              </div>
              <p className="text-olive-light text-2xl leading-relaxed mb-4">
                We're getting there. Early access goes to the waitlist first, you'll be the
                first to hear.
              </p>

              <div
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${hasAlert ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-4" role="alert">
                    {isSuccess && (
                      <div className="bg-olive-opac rounded-md px-4 py-3 flex items-center gap-2">
                        <CheckIcon className="text-olive-main" sx={{ fontSize: 20 }} />
                        <span className="text-olive-main text-2xl font-medium">
                          {status.alreadyRegistered
                            ? "You're already on the list. We'll email you the moment we go live."
                            : "You're on the list. We'll email you the moment we go live."}
                        </span>
                      </div>
                    )}

                    {status.kind === 'error' && (
                      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-2xl">
                        {status.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
