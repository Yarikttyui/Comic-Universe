import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import { runMigrations } from './migrate.js';
import { seedAdminUserIfMissing } from '../seed/seedAdmin.js';

async function seed() {
  console.log('Starting database seed...');

  try {
    await runMigrations();
    await connectDatabase();
    await seedAdminUserIfMissing();

    console.log('Seed completed. Only admin user is ensured.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
