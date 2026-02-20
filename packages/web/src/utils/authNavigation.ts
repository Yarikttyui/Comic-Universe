export type PostAuthUser = {
  isOnboardingCompleted?: boolean;
  nextAction?: 'select_role' | 'complete_creator_profile' | null;
};

export function resolvePostAuthRoute(user: PostAuthUser | null | undefined, fallback = '/'): string {
  if (!user) return fallback;

  if (!user.isOnboardingCompleted) {
    return '/onboarding';
  }

  if (user.nextAction === 'select_role' || user.nextAction === 'complete_creator_profile') {
    return '/onboarding';
  }

  return fallback;
}
