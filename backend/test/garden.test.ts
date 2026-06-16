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

describe('Plant notes/city fields', () => {
  it('persists notes and city on creation and on update', async () => {
    const a = await registerVerified();

    const created = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        name: 'Vera the slow Monstera',
        species: 'Monstera deliciosa',
        notes: 'Found at a flea market in Alfama',
        city: 'Lisbon',
        sunlight: 'MEDIUM',
      });
    expect(created.status).toBe(201);
    expect(created.body.plant.notes).toBe('Found at a flea market in Alfama');
    expect(created.body.plant.city).toBe('Lisbon');

    const id: string = created.body.plant.id;
    const updated = await request(app)
      .patch(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ city: 'Porto', notes: null });
    expect(updated.status).toBe(200);
    expect(updated.body.plant.city).toBe('Porto');
    expect(updated.body.plant.notes).toBeNull();
  });
});

describe('Plant creation (all fields and defaults)', () => {
  it('persists every field when all are supplied', async () => {
    const a = await registerVerified();

    const planterRes = await request(app)
      .post('/api/planters')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Kitchen window', isIndoor: true });
    expect(planterRes.status).toBe(201);
    const planterId: string = planterRes.body.planter.id;

    const lastWateredAt = '2026-06-01T00:00:00.000Z';
    const dateAcquired = '2026-05-15T00:00:00.000Z';

    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        name: 'Vera the slow Monstera',
        species: 'Monstera deliciosa',
        notes: 'Found at a flea market in Alfama',
        city: 'Lisbon, Portugal',
        sunlight: 'HIGH',
        wateringIntervalDays: 10,
        minTemp: 12,
        maxTemp: 30,
        lastWateredAt,
        dateAcquired,
        planterId,
        imageUrl: 'https://example.com/vera.jpg',
      });

    expect(res.status).toBe(201);
    const plant = res.body.plant;
    expect(plant.id).toBeTruthy();
    expect(plant.ownerId).toBe(a.userId);
    expect(plant.name).toBe('Vera the slow Monstera');
    expect(plant.species).toBe('Monstera deliciosa');
    expect(plant.notes).toBe('Found at a flea market in Alfama');
    expect(plant.city).toBe('Lisbon, Portugal');
    expect(plant.sunlight).toBe('HIGH');
    expect(plant.wateringIntervalDays).toBe(10);
    expect(plant.minTemp).toBe(12);
    expect(plant.maxTemp).toBe(30);
    expect(plant.isDead).toBe(false);
    expect(new Date(plant.lastWateredAt).toISOString()).toBe(lastWateredAt);
    expect(new Date(plant.dateAcquired).toISOString()).toBe(dateAcquired);
    expect(plant.planterId).toBe(planterId);
    expect(plant.planter).toMatchObject({ id: planterId, name: 'Kitchen window', isIndoor: true });
    expect(plant.images).toHaveLength(1);
    expect(plant.images[0].url).toBe('https://example.com/vera.jpg');
  });

  it('applies defaults when only the required name is supplied', async () => {
    const a = await registerVerified();

    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Just a name' });

    expect(res.status).toBe(201);
    const plant = res.body.plant;
    expect(plant.name).toBe('Just a name');
    expect(plant.species).toBeNull();
    expect(plant.notes).toBeNull();
    expect(plant.city).toBeNull();
    expect(plant.sunlight).toBe('MEDIUM');
    expect(plant.wateringIntervalDays).toBe(7);
    expect(plant.minTemp).toBeNull();
    expect(plant.maxTemp).toBeNull();
    expect(plant.isDead).toBe(false);
    expect(plant.lastWateredAt).toBeNull();
    expect(plant.planterId).toBeNull();
    expect(plant.planter).toBeNull();
    expect(plant.images).toEqual([]);
    expect(plant.dateAcquired).toBeTruthy();
  });

  it('rejects creation with no name', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ species: 'Monstera deliciosa' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('rejects a name longer than 50 characters', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'x'.repeat(51) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('rejects a scientific name longer than 70 characters', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Long species', species: 'x'.repeat(71) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/species/i);
  });

  it('rejects notes longer than 200 characters', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Long notes', notes: 'x'.repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/notes/i);
  });

  it('rejects an invalid sunlight value', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Bad light', sunlight: 'BLAZING' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sunlight/i);
  });

  it('rejects a watering interval outside 1-365', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Bad interval', wateringIntervalDays: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/wateringIntervalDays/i);
  });

  it('rejects creation when minTemp is greater than maxTemp', async () => {
    const a = await registerVerified();
    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Bad temps', minTemp: 25, maxTemp: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minTemp/i);
  });

  it("rejects a planterId belonging to another user", async () => {
    const a = await registerVerified();
    const b = await registerVerified();
    const bPlanter = await request(app)
      .post('/api/planters')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ name: "B's planter", isIndoor: false });
    expect(bPlanter.status).toBe(201);

    const res = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Cross tenant', planterId: bPlanter.body.planter.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/planter/i);
  });
});
