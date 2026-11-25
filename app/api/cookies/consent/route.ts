import { NextRequest, NextResponse } from 'next/server';

const COOKIE_CONSENT_NAME = 'cadence_cookie_consent';
const THEME_COOKIE_NAME = 'cadence_theme';
const WORKSPACE_COOKIE_NAME = 'cadence_active_ws';

function isHttpsRequest(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return req.nextUrl.protocol === 'https:';
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

function formatSetCookie(
  name: string,
  value: string,
  options: { maxAge: number; https: boolean; httpOnly?: boolean }
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${options.maxAge}`,
    options.https ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  if (options.https) {
    parts.push('Secure', 'Partitioned');
  }
  return parts.join('; ');
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_CONSENT_NAME)?.value;
  const consent = raw === 'accepted' || raw === 'declined' ? raw : null;
  return NextResponse.json({ consent });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const choice = body?.choice;
    if (choice !== 'accepted' && choice !== 'declined') {
      return NextResponse.json({ error: 'Invalid cookie consent choice' }, { status: 400 });
    }

    const https = isHttpsRequest(req);
    const res = NextResponse.json({ success: true, consent: choice });

    res.headers.append(
      'Set-Cookie',
      formatSetCookie(COOKIE_CONSENT_NAME, choice, {
        maxAge: 60 * 60 * 24 * 365,
        https,
      })
    );

    if (choice === 'declined') {
      res.headers.append(
        'Set-Cookie',
        formatSetCookie(THEME_COOKIE_NAME, '', { maxAge: 0, https })
      );
      res.headers.append(
        'Set-Cookie',
        formatSetCookie(WORKSPACE_COOKIE_NAME, '', { maxAge: 0, https })
      );
    }

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
