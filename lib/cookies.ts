export const COOKIE_CONSENT_NAME = 'cadence_cookie_consent';
export const SESSION_COOKIE_NAME = 'cadence_session';
export const SESSION_HINT_COOKIE = 'cadence_auth_hint';
export const THEME_COOKIE_NAME = 'cadence_theme';
export const WORKSPACE_COOKIE_NAME = 'cadence_active_ws';

export type CookieConsentValue = 'accepted' | 'declined';

function isHttpsContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.protocol === 'https:';
}

export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setClientCookie(
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 365
): void {
  if (typeof document === 'undefined') return;
  const secure = isHttpsContext();
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) {
    attrs.push('Secure', 'Partitioned');
  }
  document.cookie = attrs.join('; ');
}

export function deleteClientCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const secure = isHttpsContext();
  const attrs = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) {
    attrs.push('Secure', 'Partitioned');
  }
  document.cookie = attrs.join('; ');
}

export function hasAuthSessionHint(): boolean {
  return getClientCookie(SESSION_HINT_COOKIE) === '1';
}
