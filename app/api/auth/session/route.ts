import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const SESSION_COOKIE_NAME = 'cadence_session';
const SESSION_HINT_COOKIE = 'cadence_auth_hint';

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

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!lookupRes.ok) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const lookupData = (await lookupRes.json()) as { users?: Array<{ localId?: string }> };
    const uid = lookupData.users?.[0]?.localId;
    if (!uid) {
      return NextResponse.json({ error: 'Invalid session user' }, { status: 401 });
    }

    const https = isHttpsRequest(req);
    const maxAge = 60 * 60 * 24 * 30;
    const res = NextResponse.json({ success: true, uid });

    res.headers.append(
      'Set-Cookie',
      formatSetCookie(SESSION_COOKIE_NAME, uid, {
        maxAge,
        https,
        httpOnly: true,
      })
    );
    res.headers.append(
      'Set-Cookie',
      formatSetCookie(SESSION_HINT_COOKIE, '1', {
        maxAge,
        https,
        httpOnly: false,
      })
    );

    return res;
  } catch {
    return NextResponse.json({ error: 'Session verification failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const https = isHttpsRequest(req);
  const res = NextResponse.json({ success: true });

  res.headers.append(
    'Set-Cookie',
    formatSetCookie(SESSION_COOKIE_NAME, '', {
      maxAge: 0,
      https,
      httpOnly: true,
    })
  );
  res.headers.append(
    'Set-Cookie',
    formatSetCookie(SESSION_HINT_COOKIE, '', {
      maxAge: 0,
      https,
      httpOnly: false,
    })
  );

  return res;
}
