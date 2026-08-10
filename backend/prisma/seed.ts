import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Grove database...');

  const host = await prisma.user.upsert({
    where: { email: 'host@grove.app' },
    update: {},
    create: {
      email: 'host@grove.app',
      name: 'Session Host',
    },
  });

  await prisma.session.upsert({
    where: { roomId: 'room-grove-101' },
    update: {},
    create: {
      title: 'Interactive Team Standup',
      roomId: 'room-grove-101',
      hostId: host.id,
      isActive: true,
    },
  });

  console.log('Seeding complete for Grove.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
