import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentaman.com' },
    update: {},
    create: {
      email: 'admin@rentaman.com',
      phone: '+919999999999',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create service categories
  const categories = [
    {
      name: 'Hospital Visit',
      slug: 'hospital-visit',
      description: 'Accompany and assist during hospital visits',
      icon: 'hospital',
    },
    {
      name: 'Elderly Care',
      slug: 'elderly-care',
      description: 'Provide care and companionship for elderly family members',
      icon: 'heart',
    },
    {
      name: 'Errands',
      slug: 'errands',
      description: 'Run errands such as grocery shopping, bill payments, etc.',
      icon: 'shopping-cart',
    },
    {
      name: 'Home Assistance',
      slug: 'home-assistance',
      description: 'Help with household tasks and maintenance',
      icon: 'home',
    },
    {
      name: 'Pet Care',
      slug: 'pet-care',
      description: 'Take care of pets including walking, feeding, and grooming',
      icon: 'paw',
    },
    {
      name: 'Transportation',
      slug: 'transportation',
      description: 'Provide transportation and pickup/drop services',
      icon: 'car',
    },
  ];

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`Created ${categories.length} service categories`);

  // Seed default platform config
  await prisma.platformConfig.upsert({
    where: { key: 'commission_percent' },
    update: {},
    create: {
      key: 'commission_percent',
      value: '15',
    },
  });
  console.log('Created default platform config (commission: 15%)');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
