export type AuthIntent = 'customer' | 'seller';

export const SELLER_ONBOARDING_PATH = '/seller-onboarding';

export function buildLoginUrl(options?: {
  intent?: AuthIntent;
  redirect?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.intent) params.set('intent', options.intent);
  if (options?.redirect) params.set('redirect', options.redirect);
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}

export function buildRegisterUrl(options?: {
  intent?: AuthIntent;
  redirect?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.intent) params.set('intent', options.intent);
  if (options?.redirect) params.set('redirect', options.redirect);
  const query = params.toString();
  return query ? `/register?${query}` : '/register';
}

export function parseAuthIntent(value: string | null | undefined): AuthIntent {
  return value === 'seller' ? 'seller' : 'customer';
}

export function getAuthTheme(intent: AuthIntent) {
  if (intent === 'seller') {
    return {
      intent,
      badge: 'Seller Portal',
      badgeIcon: '🏪',
      gradient: 'from-violet-600/10 via-background to-orange-500/10',
      accent: '#7C3AED',
      accentSecondary: '#FF6B35',
      headline: 'Grow Your Business',
      subline: 'Sign in to manage your shop, orders, and earnings',
      registerHeadline: 'Start Selling',
      registerSubline: 'Create your seller account and reach local customers',
      buttonGradient: 'linear-gradient(135deg,#7C3AED,#FF6B35)',
      panelGradient: 'linear-gradient(135deg,#1E0A4E 0%,#4C1D95 50%,#7C2D12 100%)',
      defaultRedirect: SELLER_ONBOARDING_PATH,
      oppositeLabel: 'Shop as Customer',
      oppositeLogin: buildLoginUrl({ intent: 'customer' }),
      oppositeRegister: buildRegisterUrl({ intent: 'customer' }),
    };
  }

  return {
    intent,
    badge: 'Customer Account',
    badgeIcon: '🛍️',
    gradient: 'from-blue-600/10 via-background to-indigo-500/10',
    accent: '#3D5AF1',
    accentSecondary: '#6D28D9',
    headline: 'Welcome Back',
    subline: 'Sign in to shop from trusted local stores near you',
    registerHeadline: 'Join LocalKart',
    registerSubline: 'Create your account and discover products from local shops',
    buttonGradient: 'linear-gradient(135deg,#3D5AF1,#6D28D9)',
    panelGradient: 'linear-gradient(135deg,#0F0E2A 0%,#1a1560 50%,#312E81 100%)',
    defaultRedirect: '/',
    oppositeLabel: 'Sell on LocalKart',
    oppositeLogin: buildLoginUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH }),
    oppositeRegister: buildRegisterUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH }),
  };
}

export function preserveAuthQuery(intent: AuthIntent, redirect?: string | null): string {
  const params = new URLSearchParams();
  params.set('intent', intent);
  if (redirect) params.set('redirect', redirect);
  return params.toString();
}
