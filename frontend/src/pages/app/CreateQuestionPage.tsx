import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAuth } from '../../context/useAuth';
import {
  createQuestion,
  NOTE_BG,
  NOTE_COLORS,
  type NoteColor,
} from '../../api/questions';

function CreateQuestionPage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState<NoteColor>('YELLOW');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function submit() {
    if (!body.trim()) {
      setError('Write your question on the note first.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createQuestion(authFetch, {
        body: body.trim(),
        title: title.trim() || null,
        color,
      });
      navigate('/profile', { state: { tab: 'qa' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your question');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14">
      <header className="text-center mb-8 max-w-xl">
        <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !italic !leading-tight">
          Pin up a question
        </Typography>
        <p className="text-olive-light text-xl mt-1">
          Brown leaves, mystery bug, slow growth? Jot it down and your friends can help.
        </p>
      </header>

      {error ? (
        <Alert severity="error" className="!mb-6 !rounded-lg w-full max-w-md">
          {error}
        </Alert>
      ) : null}

      {/* The post-it */}
      <div
        className={`relative w-full max-w-md min-h-[20rem] p-6 pt-9 rounded-sm shadow-xl -rotate-1 ${NOTE_BG[color]}`}
      >
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-cream-soft/60 border border-olive-main/10 rotate-1" />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 80))}
          placeholder="Title (optional)"
          className="w-full bg-transparent text-olive-main text-2xl font-semibold placeholder:text-olive-main/40 focus:outline-none mb-3"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 280))}
          placeholder="Why are my Monstera's leaves curling at the edges?"
          rows={7}
          className="w-full bg-transparent text-olive-main text-xl leading-snug placeholder:text-olive-main/40 focus:outline-none resize-none"
        />
        <span className="absolute bottom-3 right-4 text-olive-main/50 text-sm tabular-nums">
          {body.length}/280
        </span>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-3 mt-6">
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${c.toLowerCase()} note`}
            onClick={() => setColor(c)}
            className={`w-9 h-9 rounded-full ${NOTE_BG[c]} border border-olive-main/15 transition-transform hover:scale-110 ${
              color === c ? 'ring-2 ring-olive-main ring-offset-2 ring-offset-cream-main' : ''
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-8">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profile', { state: { tab: 'qa' } })}
          disabled={submitting}
          className="!text-olive-main !text-lg !normal-case hover:!bg-olive-main/5"
        >
          Back
        </Button>
        <Button
          onClick={submit}
          disabled={submitting}
          className="!bg-olive-main !text-cream-soft !text-lg !normal-case !rounded-lg !px-6 !py-2.5 hover:!bg-olive-light disabled:!opacity-60"
        >
          {submitting ? 'Pinning…' : 'Pin it up'}
        </Button>
      </div>
    </main>
  );
}

export default CreateQuestionPage;
