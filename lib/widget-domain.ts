import { NextResponse } from 'next/server';

export function extractHostname(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';
  try {
    const withScheme = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    return url.hostname.replace(/\.$/, '');
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/\.$/, '');
  }
}

export function isSameOrLocalHost(host: string, appOriginHost?: string): boolean {
  if (!host) return false;
  const lower = host.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.codepen.io') ||
    lower.endsWith('.cdpn.io') ||
    lower.endsWith('.codesandbox.io') ||
    lower.endsWith('.stackblitz.io') ||
    (appOriginHost && lower === appOriginHost.toLowerCase())
  ) {
    return true;
  }
  return false;
}

export function isDomainAllowed(
  allowedDomains: unknown,
  candidateHostOrUrl?: string | null,
  requestOriginHeader?: string | null,
  appHostHeader?: string | null
): boolean {
  if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return true;
  }

  const normalizedRules = allowedDomains
    .map((d) => (typeof d === 'string' ? extractHostname(d) : ''))
    .filter(Boolean);

  if (normalizedRules.length === 0) {
    return true;
  }

  const candidateHost =
    extractHostname(candidateHostOrUrl) || extractHostname(requestOriginHeader);
  const appHost = extractHostname(appHostHeader);

  if (!candidateHost) {
    return true;
  }

  if (isSameOrLocalHost(candidateHost, appHost)) {
    return true;
  }

  return normalizedRules.some((rule) => {
    if (rule.startsWith('*.')) {
      const rootDomain = rule.slice(2);
      return candidateHost === rootDomain || candidateHost.endsWith(`.${rootDomain}`);
    }
    return candidateHost === rule || candidateHost.endsWith(`.${rule}`);
  });
}

export function isSafePublicHttpUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const h = parsed.hostname.toLowerCase();
    if (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '0.0.0.0' ||
      h === '::1' ||
      h.endsWith('.local') ||
      h.endsWith('.internal') ||
      h.startsWith('10.') ||
      h.startsWith('192.168.') ||
      h.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function widgetCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export function widgetOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: widgetCorsHeaders(),
  });
}
