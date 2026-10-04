import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

describe('Multi-Tenancy & Authorization Isolation Tests', () => {
  let orgAToken: string;
  let orgAId: string;
  let orgBToken: string;
  let orgBId: string;

  beforeAll(async () => {
    // 1. Sign up Org A
    const resA = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Alice OrgA',
        companyName: 'Company Alpha',
        email: `alice.${Date.now()}@alpha.com`,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    orgAToken = resA.body.data.accessToken;
    orgAId = resA.body.data.organization.id;

    // 2. Sign up Org B
    const resB = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Bob OrgB',
        companyName: 'Company Beta',
        email: `bob.${Date.now()}@beta.com`,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    orgBToken = resB.body.data.accessToken;
    orgBId = resB.body.data.organization.id;

    // Seed private data for Org A
    await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${orgAToken}`);
  });

  afterAll(async () => {
    // Clean up test orgs
    if (orgAId) await prisma.organization.deleteMany({ where: { id: orgAId } });
    if (orgBId) await prisma.organization.deleteMany({ where: { id: orgBId } });
    await prisma.$disconnect();
  });

  it('Verifies Org A can read its own seeded changes and dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.services.length).toBe(5);
    expect(res.body.data.recentIncidents.length).toBeGreaterThan(0);
  });

  it('CRITICAL TENANT ISOLATION: Proves Org B cannot see Org A data', async () => {
    // Org B has not seeded its data yet
    const resB = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(resB.status).toBe(200);
    // Org B must see 0 services and 0 incidents belonging to Org A!
    expect(resB.body.data.services.length).toBe(0);
    expect(resB.body.data.recentIncidents.length).toBe(0);
  });

  it('Proves Org B cannot retrieve Org A changes via changes endpoint', async () => {
    // Fetch changes as Org B
    const resB = await request(app)
      .get('/api/changes')
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(0);

    // Fetch changes as Org A
    const resA = await request(app)
      .get('/api/changes')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBeGreaterThan(0);
  });

  it('Rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
