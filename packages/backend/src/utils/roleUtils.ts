export type AppRole = 'reader' | 'creator' | 'admin';

export function normalizeRole(role: string): AppRole {
  if (role === 'author') return 'creator';
  if (role === 'admin') return 'admin';
  if (role === 'creator') return 'creator';
  return 'reader';
}
