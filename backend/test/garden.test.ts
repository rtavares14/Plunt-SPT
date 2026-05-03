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
  email: string;
}

async function registerVerified(): Promise<VerifiedUser> {
  const email = `gu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const username = `gu${Math.random().toString(36).slice(2, 10)}`;
  const reg = await request(app).post('/api/auth/register').send({
    email,
    username,
    name: 'Garden User',
    password: 'correct-horse-battery-staple',
  });
  expect(reg.status).toBe(201);
  const userId: string = reg.body.user.id;
  // Garden routes gate on email verification — flip the flag directly.
  await getPrisma().user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  return { token: reg.body.token, userId, email };
}

describe('Garden authorization (cross-tenant)', () => {
  it('does not list another user\'s plants or planters', async () => {
    const a = await registerVerified();
    const b = await registerVerified();

    const ap = await request(app)
      .post('/api/planters')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: "A's planter", isIndoor: true });
    expect(ap.status).toBe(201);

    const apl = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: "A's plant", wateringIntervalDays: 7, sunlight: 'MEDIUM' });
    expect(apl.status).toBe(201);

    const bPlanters = await request(app)
      .get('/api/planters')
      .set('Authorization', `Bearer ${b.token}`);
    expect(bPlanters.status).toBe(200);
    expect(bPlanters.body.planters).toEqual([]);

    const bPlants = await request(app)
      .get('/api/plants')
      .set('Authorization', `Bearer ${b.token}`);
    expect(bPlants.status).toBe(200);
    expect(bPlants.body.plants).toEqual([]);
  });

  it('returns 404 when user B PATCHes or DELETEs user A\'s plant', async () => {
    const a = await registerVerified();
    const b = await registerVerified();

    const created = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Mine', wateringIntervalDays: 5, sunlight: 'HIGH' });
    expect(created.status).toBe(201);
    const id: string = created.body.plant.id;

    const patched = await request(app)
      .patch(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ name: 'Pwned' });
    expect(patched.status).toBe(404);

    const deleted = await request(app)
      .delete(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(deleted.status).toBe(404);

    // The plant is untouched.
    const stillThere = await getPrisma().plant.findUnique({ where: { id } });
    expect(stillThere?.name).toBe('Mine');
  });

  it('returns 404 when user B PATCHes or DELETEs user A\'s planter', async () => {
    const a = await registerVerified();
    const b = await registerVerified();

    const created = await request(app)
      .post('/api/planters')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'My pot', isIndoor: false });
    expect(created.status).toBe(201);
    const id: string = created.body.planter.id;

    const patched = await request(app)
      .patch(`/api/planters/${id}`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ name: 'Stolen' });
    expect(patched.status).toBe(404);

    const deleted = await request(app)
      .delete(`/api/planters/${id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(deleted.status).toBe(404);

    const stillThere = await getPrisma().planter.findUnique({ where: { id } });
    expect(stillThere?.name).toBe('My pot');
  });

  it('refuses to assign a plant into another user\'s planter', async () => {
    const a = await registerVerified();
    const b = await registerVerified();

    const aPlanter = await request(app)
      .post('/api/planters')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: "A's pot", isIndoor: true });
    expect(aPlanter.status).toBe(201);
    const planterId: string = aPlanter.body.planter.id;

    // Create attempt: B trying to attach a new plant to A's planter.
    const createRes = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ name: 'Bplant', planterId, wateringIntervalDays: 7, sunlight: 'LOW' });
    expect(createRes.status).toBe(400);

    // Update attempt: B re-assigns one of his own plants to A's planter.
    const bPlant = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ name: 'Bplant2', wateringIntervalDays: 7, sunlight: 'LOW' });
    expect(bPlant.status).toBe(201);
    const bPlantId: string = bPlant.body.plant.id;

    const reassign = await request(app)
      .patch(`/api/plants/${bPlantId}`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ planterId });
    expect(reassign.status).toBe(400);
  });
});

describe('Plant temperature validation', () => {
  it('rejects PATCH that would leave stored minTemp > stored maxTemp', async () => {
    const a = await registerVerified();
    const created = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        name: 'Tempy',
        wateringIntervalDays: 7,
        sunlight: 'MEDIUM',
        minTemp: 5,
        maxTemp: 20,
      });
    expect(created.status).toBe(201);
    const id: string = created.body.plant.id;

    // Send only minTemp — must be validated against the *stored* maxTemp.
    const bad = await request(app)
      .patch(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ minTemp: 30 });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/minTemp/i);

    const good = await request(app)
      .patch(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ minTemp: 10 });
    expect(good.status).toBe(200);
  });

  it('accepts plant creation with no temps supplied', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'NoTemps', sunlight: 'LOW' });
    expect(res.status).toBe(201);
    expect(res.body.plant.minTemp).toBeNull();
    expect(res.body.plant.maxTemp).toBeNull();
    expect(res.body.plant.wateringIntervalDays).toBe(7);
  });
});
