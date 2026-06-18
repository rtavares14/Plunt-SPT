import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../src/app';
import { getPrisma } from '../src/lib/prisma';

let app: Express;

beforeAll(() => {
  app = createApp();
});

interface VerifiedUser {
  token: string;
  userId: string;
}

async function registerVerified(): Promise<VerifiedUser> {
  const email = `qu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const username = `qu${Math.random().toString(36).slice(2, 10)}`;
  const reg = await request(app).post('/api/auth/register').send({
    email,
    username,
    name: 'Question User',
    password: 'correct-horse-battery-staple',
  });
  expect(reg.status).toBe(201);
  const userId: string = reg.body.user.id;
  await getPrisma().user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  return { token: reg.body.token, userId };
}

describe('Question creation', () => {
  it('persists title, body, and color when all are supplied', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ title: 'Curling leaves', body: 'Why are the edges browning?', color: 'PINK' });

    expect(res.status).toBe(201);
    const q = res.body.question;
    expect(q.id).toBeTruthy();
    expect(q.authorId).toBe(a.userId);
    expect(q.title).toBe('Curling leaves');
    expect(q.body).toBe('Why are the edges browning?');
    expect(q.color).toBe('PINK');
    expect(q.resolved).toBe(false);
  });

  it('defaults color to YELLOW and resolved to false', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Just a question' });

    expect(res.status).toBe(201);
    expect(res.body.question.title).toBeNull();
    expect(res.body.question.color).toBe('YELLOW');
    expect(res.body.question.resolved).toBe(false);
  });

  it('rejects a question with no body', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ title: 'No body' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/question is required/i);
  });

  it('rejects a body longer than 280 characters', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'x'.repeat(281) });
    expect(res.status).toBe(400);
  });

  it('rejects a title longer than 80 characters', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Short body', title: 'x'.repeat(81) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('rejects an invalid color', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Bad color', color: 'PURPLE' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/color/i);
  });
});

describe('Question listing and ownership', () => {
  it('lists only the author\'s questions, newest first', async () => {
    const a = await registerVerified();
    const b = await registerVerified();

    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'A first' });
    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'A second' });
    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ body: "B's question" });

    const aList = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${a.token}`);
    expect(aList.status).toBe(200);
    expect(aList.body.questions).toHaveLength(2);
    expect(aList.body.questions[0].body).toBe('A second');

    const bList = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${b.token}`);
    expect(bList.body.questions).toHaveLength(1);
    expect(bList.body.questions[0].body).toBe("B's question");
  });
});

describe('Question update and delete', () => {
  it('updates body, color, and the resolved flag', async () => {
    const a = await registerVerified();
    const created = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Original', color: 'YELLOW' });
    const id: string = created.body.question.id;

    const updated = await request(app)
      .patch(`/api/questions/${id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Edited', color: 'GREEN', resolved: true });
    expect(updated.status).toBe(200);
    expect(updated.body.question.body).toBe('Edited');
    expect(updated.body.question.color).toBe('GREEN');
    expect(updated.body.question.resolved).toBe(true);
  });

  it('rejects a non-boolean resolved value', async () => {
    const a = await registerVerified();
    const created = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Original' });
    const res = await request(app)
      .patch(`/api/questions/${created.body.question.id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ resolved: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resolved/i);
  });

  it('does not let a user update or delete another user\'s question', async () => {
    const a = await registerVerified();
    const b = await registerVerified();
    const created = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: "A's private question" });
    const id: string = created.body.question.id;

    const patch = await request(app)
      .patch(`/api/questions/${id}`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ resolved: true });
    expect(patch.status).toBe(404);

    const del = await request(app)
      .delete(`/api/questions/${id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(del.status).toBe(404);
  });

  it('deletes the author\'s own question', async () => {
    const a = await registerVerified();
    const created = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ body: 'Delete me' });
    const id: string = created.body.question.id;

    const del = await request(app)
      .delete(`/api/questions/${id}`)
      .set('Authorization', `Bearer ${a.token}`);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${a.token}`);
    expect(list.body.questions).toHaveLength(0);
  });
});
