import { User } from '../models/index.js';

export const ADMIN_EMAIL = 'admin@admin.adm';
export const ADMIN_PASSWORD = 'admin123';

export const seedAdminUserIfMissing = async (): Promise<void> => {
  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    await existing.update({
      role: 'admin',
      onboardingStage: 'done',
      accountStatus: 'active',
    });
    return;
  }

  await User.create({
    email: ADMIN_EMAIL,
    displayName: 'Администратор',
    password: ADMIN_PASSWORD,
    role: 'admin',
    onboardingStage: 'done',
    accountStatus: 'active',
    bio: 'Системный администратор платформы',
  });
};
