import jwt from 'jsonwebtoken';
import { User, RefreshToken } from '../models/index.js';
import { config } from '../config/index.js';
import { normalizeRole } from '../utils/roleUtils.js';

function toSafeUser(user: User) {
  const safe = user.toSafeJSON() as any;
  safe.role = normalizeRole(safe.role);
  safe.onboardingStage = 'done';
  safe.isOnboardingCompleted = true;
  safe.nextAction = null;
  return safe;
}

function generateTokens(user: User) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: normalizeRole(user.role),
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresSeconds,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: Math.floor(config.jwt.refreshExpiresMs / 1000),
  });

  return { accessToken, refreshToken };
}

export async function issueSession(user: User) {
  const tokens = generateTokens(user);

  await RefreshToken.create({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + config.jwt.refreshExpiresMs),
  });

  return {
    user: toSafeUser(user),
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.jwt.accessExpiresSeconds,
    },
  };
}

export async function refreshSession(refreshToken: string) {
  const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });

  if (!storedToken || storedToken.isExpired()) {
    if (storedToken) await storedToken.destroy();
    return null;
  }

  let decoded: { userId: string };
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
  } catch {
    await storedToken.destroy();
    return null;
  }

  const user = await User.findByPk(decoded.userId);

  if (!user) return null;

  await storedToken.destroy();
  const tokens = generateTokens(user);

  await RefreshToken.create({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + config.jwt.refreshExpiresMs),
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: config.jwt.accessExpiresSeconds,
  };
}

export { toSafeUser };
