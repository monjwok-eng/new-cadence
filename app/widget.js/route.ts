import { NextRequest, NextResponse } from 'next/server';
import { SHARED_WIDGET_RUNTIME_JS } from '@/lib/widget-script-builder';

const WIDGET_SCRIPT = `(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function findWidgetScripts() {
    var list = [];
    if (document.currentScript && document.currentScript.getAttribute('data-chatbot-id')) {
      list.push(document.currentScript);
      return list;
    }
    var scripts = document.querySelectorAll('script[data-chatbot-id]');
    for (var i = 0; i < scripts.length; i++) {
      if ((scripts[i].getAttribute('src') || '').indexOf('/widget.js') !== -1) {
        list.push(scripts[i]);
      }
    }
    return list;
  }

  function mountWidget(scriptEl) {
    var agentId = (scriptEl.getAttribute('data-chatbot-id') || '').trim();
    if (!agentId || !/^[a-zA-Z0-9_-]{1,128}$/.test(agentId)) return;

    window.__cadenceWidgetsLoaded = window.__cadenceWidgetsLoaded || {};
    if (window.__cadenceWidgetsLoaded[agentId]) return;
    window.__cadenceWidgetsLoaded[agentId] = true;

    var baseOrigin = '';
    var overrideOrigin = (scriptEl.getAttribute('data-cadence-origin') || '').trim();
    if (overrideOrigin) {
      baseOrigin = overrideOrigin.replace(/\\/$/, '');
    } else {
      try {
        var parsedSrc = new URL(scriptEl.src, window.location.href);
        baseOrigin = parsedSrc.origin;
      } catch (e) {
        baseOrigin = 'https://new-cadence-gamma.vercel.app';
      }
    }

    var hostName = window.location.hostname || '';
    var pageUrl = window.location.href || '';
    var configUrl =
      baseOrigin +
      '/api/widget/' +
      encodeURIComponent(agentId) +
      '/config?host=' +
      encodeURIComponent(hostName);

    fetch(configUrl, { method: 'GET', mode: 'cors' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.widget) return;
        renderFloatingWidget(data.widget, baseOrigin, hostName, pageUrl);
      })
      .catch(function () {
        // Ignore network errors cleanly so host site never breaks
      });
  }

${SHARED_WIDGET_RUNTIME_JS}

  function init() {
    var scripts = findWidgetScripts();
    for (var i = 0; i < scripts.length; i++) {
      mountWidget(scripts[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;

export async function GET(_req: NextRequest) {
  return new NextResponse(WIDGET_SCRIPT, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
