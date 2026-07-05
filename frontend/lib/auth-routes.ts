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
