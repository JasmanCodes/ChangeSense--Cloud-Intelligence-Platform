import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { seedOrgDemoData } from '../services/demoSeed.js';

async function main() {
  console.log('[Seed] Seeding ChangeSense database...');

  // Create or find default demo organization
  const defaultOrg = await prisma.organization.upsert({
    where: { externalId: 'cs-ext-demo-acme' },
    update: {},
    create: {
      name: 'Acme Cloud Platform',
      industry: 'Fintech & Payments',
      teamSize: '50-200',
      externalId: 'cs-ext-demo-acme',
    },
  });

  console.log(`[Seed] Organization ready: ${defaultOrg.name} (${defaultOrg.id})`);

  // Create default admin user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'alex@acmecloud.io' },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Alex Rivera',
      email: 'alex@acmecloud.io',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log(`[Seed] Admin user ready: ${adminUser.email}`);

  // Create enabled services
  const services = ['change-tracking', 'incident-detection', 'security-drift', 'ai-assistant'];
  for (const s of services) {
    await prisma.enabledService.upsert({
      where: {
        organizationId_serviceKey: {
          organizationId: defaultOrg.id,
          serviceKey: s,
        },
      },
      update: { enabled: true },
      create: {
        organizationId: defaultOrg.id,
        serviceKey: s,
        enabled: true,
      },
    });
  }

  // Create default AWS connection status
  await prisma.awsConnection.upsert({
    where: { id: 'aws-conn-demo-1' },
    update: {},
    create: {
      id: 'aws-conn-demo-1',
      organizationId: defaultOrg.id,
      accountAlias: 'AWS Production (us-east-1)',
      awsAccountId: '123456789012',
      roleArn: 'arn:aws:iam::123456789012:role/ChangeSense-ReadRole',
      externalId: defaultOrg.externalId,
      status: 'CONNECTED',
      lastSyncAt: new Date(),
    },
  });

  // Seed the full 5 services, 30 changes, metrics, and incidents
  const result = await seedOrgDemoData(defaultOrg.id);
  console.log('[Seed] Seeded dataset:', result.counts);
  console.log('[Seed] Demo database seeding complete!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
