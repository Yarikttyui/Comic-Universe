import { User } from '../models/index.js';
import { config } from '../config/index.js';

export const seedAdminUserIfMissing = async (): Promise<void> => {
  const existing = await User.findOne({ where: { email: config.seed.adminEmail } });

  if (existing) {
    await existing.update({
      role: 'admin',
      password: config.seed.adminPassword,
      onboardingStage: 'done',
      accountStatus: 'active',
    });
    return;
  }

  await User.create({
    email: config.seed.adminEmail,
    displayName: 'Администратор',
    password: config.seed.adminPassword,
    role: 'admin',
    onboardingStage: 'done',
    accountStatus: 'active',
    bio: 'Системный администратор платформы',
  });
};
