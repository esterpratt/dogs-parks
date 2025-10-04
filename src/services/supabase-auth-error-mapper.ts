// utils/mapSupabaseAuthErrorToKey.ts

import type { AuthError } from '@supabase/supabase-js';

interface AuthErrorMapResult {
  key: string;
}

// Dictionary for Supabase error codes
const CODE_TO_I18N_KEY: Record<string, string> = {
  // Credentials / sign-in
  invalid_credentials: 'auth.invalid_credentials',
  email_not_confirmed: 'auth.email_not_confirmed',
  user_not_found: 'auth.user_not_found',
  user_banned: 'auth.user_banned',

  // Sign-up
  email_exists: 'auth.email_already_exists',
  weak_password: 'auth.weak_password',
  signup_disabled: 'auth.signups_disabled',

  // Sessions / rate limits
  session_expired: 'auth.session_expired',

  // CAPTCHA / security
  captcha_failed: 'auth.captcha_failed',

  // MFA
  too_many_enrolled_mfa_factors: 'auth.too_many_mfa_factors',

  // Providers / OAuth
  provider_not_enabled: 'auth.provider_not_enabled',
  email_address_not_authorized: 'auth.email_not_authorized',
};

function mapSupabaseAuthErrorToKey(
  error: AuthError | null
): AuthErrorMapResult {
  if (!error) {
    return { key: 'auth.unknown' };
  }

  // 1) Prefer explicit code if present
  const code = (error as unknown as { code?: string }).code;
  if (code && CODE_TO_I18N_KEY[code]) {
    return { key: CODE_TO_I18N_KEY[code] };
  }

  // 2) Fallback: HTTP status
  const status = (error as unknown as { status?: number }).status;
  if (typeof status === 'number') {
    const mapped = mapStatusToKey(status);
    if (mapped) {
      return { key: mapped };
    }
  }

  // 3) Last fallback: message heuristics
  const message = (error.message || '').toLowerCase();

  if (
    (message.includes('already') &&
      message.includes('signed up') &&
      message.includes('email')) ||
    (message.includes('already') &&
      message.includes('registered') &&
      message.includes('email')) ||
    (message.includes('already in use') && message.includes('email')) ||
    (message.includes('already exists') && message.includes('email'))
  ) {
    return { key: 'auth.email_already_exists' };
  }

  if (
    message.includes('invalid') &&
    (message.includes('login') ||
      message.includes('credentials') ||
      message.includes('email') ||
      message.includes('password'))
  ) {
    return { key: 'auth.invalid_credentials' };
  }

  if (
    message.includes('email not confirmed') ||
    message.includes('confirm your email') ||
    message.includes('email not verified')
  ) {
    return { key: 'auth.email_not_confirmed' };
  }

  if (message.includes('provider') && message.includes('not enabled')) {
    return { key: 'auth.provider_not_enabled' };
  }

  if (message.includes('network')) {
    return { key: 'auth.network' };
  }

  return { key: 'auth.unknown' };
}

function mapStatusToKey(status: number): string | null {
  switch (status) {
    case 400:
      return 'auth.bad_request';
    case 401:
      return 'auth.unauthorized';
    case 403:
      return 'auth.forbidden';
    case 404:
      return 'auth.user_not_found';
    case 429:
      return 'auth.rate_limited';
    case 500:
      return 'auth.server_error';
    default:
      return null;
  }
}

export { mapSupabaseAuthErrorToKey };
