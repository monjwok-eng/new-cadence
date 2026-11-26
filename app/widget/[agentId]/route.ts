import { NextRequest, NextResponse } from 'next/server';
import { SHARED_WIDGET_RUNTIME_JS } from '@/lib/widget-script-builder';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  const { agentId: rawAgentId } = await context.params;
  const agentId = rawAgentId.replace(/\.js$/, '');
  const reqHost = req.headers.get('host') || '';
  const isDevOrRunApp = reqHost.includes('run.app') || reqHost.includes('localhost');
  const origin = isDevOrRunApp
    ? 'https://new-cadence-gamma.vercel.app'
    : (req.nextUrl.origin || 'https://new-cadence-gamma.vercel.app');

  const script = `(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var agentId = ${JSON.stringify(agentId)};
  var baseOrigin = ${JSON.stringify(origin)};

  window.__cadenceWidgetsLoaded = window.__cadenceWidgetsLoaded || {};
  if (window.__cadenceWidgetsLoaded[agentId]) return;
  window.__cadenceWidgetsLoaded[agentId] = true;

  var hostName = window.location.hostname || '';
  var pageUrl = window.location.href || '';
  var configUrl = baseOrigin + '/api/widget/' + encodeURIComponent(agentId) + '/config?host=' + encodeURIComponent(hostName);

  fetch(configUrl, { method: 'GET', mode: 'cors' })
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.widget) return;
      renderFloatingWidget(data.widget, baseOrigin, hostName, pageUrl);
    })
    .catch(function () {});

${SHARED_WIDGET_RUNTIME_JS}
})();`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
