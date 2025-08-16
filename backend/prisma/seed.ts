import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const usersToSeed = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: Role.ADMIN,
    },
    {
      name: 'Support One',
      email: 'support01@example.com',
      password: 'Password123!',
      role: Role.SUPPORT,
    },
    {
      name: 'Support Two',
      email: 'support02@example.com',
      password: 'Password123!',
      role: Role.SUPPORT,
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password123!',
      role: Role.USER,
    },
  ];

  for (const userData of usersToSeed) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`Created user: ${user.name} with role ${user.role}`);
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });