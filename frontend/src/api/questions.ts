type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type NoteColor = 'YELLOW' | 'PINK' | 'BLUE' | 'GREEN';

export interface QuestionSummary {
  id: string;
  authorId: string;
  title: string | null;
  body: string;
  color: NoteColor;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // ignore body parse errors
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function listQuestions(fetcher: Fetcher): Promise<QuestionSummary[]> {
  const res = await fetcher('/api/questions');
  const data = await parse<{ questions: QuestionSummary[] }>(res);
  return data.questions;
}

export interface CreateQuestionInput {
  body: string;
  title?: string | null;
  color?: NoteColor;
}

export async function createQuestion(
  fetcher: Fetcher,
  input: CreateQuestionInput,
): Promise<QuestionSummary> {
  const res = await fetcher('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parse<{ question: QuestionSummary }>(res);
  return data.question;
}

export async function deleteQuestion(fetcher: Fetcher, id: string): Promise<void> {
  const res = await fetcher(`/api/questions/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

// Tailwind background token per note color, shared by the create page and card.
export const NOTE_BG: Record<NoteColor, string> = {
  YELLOW: 'bg-note-yellow',
  PINK: 'bg-note-pink',
  BLUE: 'bg-note-blue',
  GREEN: 'bg-note-green',
};

export const NOTE_COLORS: NoteColor[] = ['YELLOW', 'PINK', 'BLUE', 'GREEN'];
