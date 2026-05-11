import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function PrivacyPage() {
  return (
    <main className="font-lateef bg-olive-main min-h-screen">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
        <div className="rounded-xl border border-olive-main bg-cream-soft p-8 sm:p-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-olive-main hover:opacity-80 mb-8"
          >
            <ArrowBackIcon sx={{ fontSize: 22 }} />
            <span className="text-xl font-medium">Back to home</span>
          </Link>

          <h1 className="text-olive-main text-5xl sm:text-6xl font-bold mb-6">
            Privacy policy
          </h1>
          <p className="text-olive-light text-xl mb-10">
            Last updated: 11 May 2026
          </p>

          <section className="space-y-8 text-olive-main text-xl leading-relaxed">
            <div>
              <h2 className="text-3xl font-bold mb-3">What we collect</h2>
              <p>
                When you join the waitlist, we collect only one thing: the email address
                you type in. We don't ask for your name, location, or anything else.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-3">Why we collect it</h2>
              <p>
                We use your email to send you <strong>four messages</strong>{' '}
                about Plunt's status:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Confirmation of your waitlist signup,</li>
                <li>When the beta opens,</li>
                <li>Approximately two weeks before launch,</li>
                <li>On launch day.</li>
              </ul>
              <p className="mt-3">
                We do not send newsletters, marketing, or any other communications.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-3">Who can see it</h2>
              <p>
                Your email is stored in our database and is processed
                through{' '}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:opacity-80"
                >
                  Resend
                </a>
                , the service we use to deliver waitlist communications. We
                don't sell, share, or hand your data to anyone else, ever.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-3">How long we keep it</h2>
              <p>
                We retain your email until the launch day message has been sent, after
                which it is removed from the waitlist. You may request earlier removal
                at any time by contacting us.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-3">Your rights</h2>
              <p>
                You can ask us to delete your email at any time, or ask us what we have
                stored about you. Just email{' '}
                <a
                  href="mailto:support@myplunt.com"
                  className="underline hover:opacity-80"
                >
                  support@myplunt.com
                </a>{' '}
                and we'll take care of it.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-3">Questions?</h2>
              <p>
                Email us at{' '}
                <a
                  href="mailto:support@myplunt.com"
                  className="underline hover:opacity-80"
                >
                  support@myplunt.com
                </a>
                . We read everything.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPage;
