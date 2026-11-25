import { NextRequest, NextResponse } from 'next/server';

const WIDGET_SCRIPT = String.raw`(function () {
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

  function sanitizeHexColor(raw) {
    if (typeof raw === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(raw.trim())) {
      return raw.trim();
    }
    return '#2563eb';
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
      baseOrigin = overrideOrigin.replace(/\/$/, '');
    } else {
      try {
        var parsedSrc = new URL(scriptEl.src, window.location.href);
        baseOrigin = parsedSrc.origin;
      } catch (e) {
        baseOrigin = window.location.origin;
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

  function renderFloatingWidget(cfg, baseOrigin, hostName, pageUrl) {
    var agentId = cfg.id;
    var accent = sanitizeHexColor(cfg.accentColor);
    var isDark = cfg.widgetTheme === 'dark';
    var launcherText = (cfg.launcherLabel || 'Voice chat').trim();

    // Inject responsive CSS for centered launcher and fluid panel on mobile
    var styleId = 'cadence-widget-styles-' + agentId;
    // Inject responsive CSS for centered launcher and centered modal card on mobile
    var styleId = 'cadence-widget-styles-' + agentId;
    if (!document.getElementById(styleId)) {
      var st = document.createElement('style');
      st.id = styleId;
      st.textContent =
        '@media (max-width: 640px) {' +
        '  #cadence-widget-root-' + agentId + ' {' +
        '    left: 50% !important;' +
        '    right: auto !important;' +
        '    transform: translateX(-50%) !important;' +
        '    bottom: 16px !important;' +
        '  }' +
        '  #cadence-widget-panel-' + agentId + ' {' +
        '    padding: 12px !important;' +
        '  }' +
        '  #cadence-widget-panel-' + agentId + ' > div {' +
        '    width: 100% !important;' +
        '    max-width: calc(100vw - 24px) !important;' +
        '    height: 580px !important;' +
        '    max-height: calc(100vh - 24px) !important;' +
        '    border-radius: 24px !important;' +
        '  }' +
        '}';
      document.head.appendChild(st);
    }

    var root = document.createElement('div');
    root.id = 'cadence-widget-root-' + agentId;
    root.setAttribute('data-cadence-widget', agentId);
    root.style.position = 'fixed';
    root.style.bottom = '20px';
    root.style[sideProp] = '20px';
    root.style.zIndex = '2147483000';
    root.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    var panel = document.createElement('div');
    panel.id = 'cadence-widget-panel-' + agentId;
    panel.style.position = 'fixed';
    panel.style.inset = '0';
    panel.style.background = 'rgba(0, 0, 0, 0.45)';
    panel.style.backdropFilter = 'blur(4px)';
    panel.style.webkitBackdropFilter = 'blur(4px)';
    panel.style.display = 'none';
    panel.style.alignItems = 'center';
    panel.style.justifyContent = 'center';
    panel.style.padding = '16px';
    panel.style.opacity = '0';
    panel.style.transition = 'opacity 200ms ease';
    panel.style.zIndex = '2147483001';

    var card = document.createElement('div');
    card.style.width = '400px';
    card.style.maxWidth = '100%';
    card.style.height = '610px';
    card.style.maxHeight = 'calc(100vh - 32px)';
    card.style.borderRadius = '28px';
    card.style.overflow = 'hidden';
    card.style.boxShadow = '0 24px 64px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(0, 0, 0, 0.08)';
    card.style.background = isDark ? '#0a0a0a' : '#ffffff';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)';
    panel.appendChild(card);

    panel.addEventListener('click', function (e) {
      if (e.target === panel) {
        closePanel();
      }
    });

    var iframeEl = null;

    // Horizontal Pill Launcher Button (Matches user screenshot 1)
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Open ' + launcherText);
    button.setAttribute('aria-expanded', 'false');
    button.style.background = isDark ? '#171717' : '#ffffff';
    button.style.color = isDark ? '#f5f5f5' : '#171717';
    button.style.border = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(0, 0, 0, 0.08)';
    button.style.borderRadius = '9999px';
    button.style.padding = '5px 16px 5px 6px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.gap = '8px';
    button.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.04)';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 180ms ease, box-shadow 180ms ease';
    button.style.outline = 'none';
    button.style.webkitTapHighlightColor = 'transparent';

    var miniOrbHtml = '<span style="display:inline-block;width:28px;height:28px;border-radius:9999px;background:radial-gradient(circle at 35% 25%, #d9f99d 0%, #a7f3d0 20%, #38bdf8 45%, #0284c7 78%, #0369a1 100%);box-shadow:inset -1px -2px 4px rgba(2, 44, 95, 0.45), inset 1px 1px 3px rgba(255, 255, 255, 0.65), 0 2px 8px rgba(14, 165, 233, 0.35);flex-shrink:0;"></span>';
    var textLabelHtml = '<span style="font-size:14px;font-weight:500;color:' + (isDark ? '#f5f5f5' : '#171717') + ';letter-spacing:-0.01em;white-space:nowrap;">' + launcherText + '</span>';
    var closeContentHtml = '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:' + (isDark ? '#262626' : '#f3f4f6') + ';color:' + (isDark ? '#e5e5e5' : '#374151') + ';font-size:13px;font-weight:600;flex-shrink:0;">✕</span><span style="font-size:14px;font-weight:500;color:' + (isDark ? '#f5f5f5' : '#171717') + ';white-space:nowrap;">Close</span>';

    button.innerHTML = miniOrbHtml + textLabelHtml;
    var isOpen = false;

    function openPanel() {
      if (!iframeEl) {
        iframeEl = document.createElement('iframe');
        iframeEl.src =
          baseOrigin +
          '/embed/widget/' +
          encodeURIComponent(agentId) +
          '?host=' +
          encodeURIComponent(hostName) +
          '&page=' +
          encodeURIComponent(pageUrl);
        iframeEl.title = (cfg.name || 'Voice Chatbot') + ' - Powered by Cadence';
        iframeEl.setAttribute('allow', 'microphone; autoplay; clipboard-write');
        iframeEl.style.width = '100%';
        iframeEl.style.height = '100%';
        iframeEl.style.border = 'none';
        iframeEl.style.display = 'block';
        card.appendChild(iframeEl);
      }
      isOpen = true;
      panel.style.display = 'flex';
      button.innerHTML = closeContentHtml;
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-label', 'Close ' + (cfg.name || 'voice chatbot'));
      window.requestAnimationFrame(function () {
        panel.style.opacity = '1';
        card.style.transform = 'scale(1)';
      });
    }

    function closePanel() {
      isOpen = false;
      button.innerHTML = miniOrbHtml + textLabelHtml;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open ' + (cfg.name || 'voice chatbot'));
      panel.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      window.setTimeout(function () {
        if (!isOpen) panel.style.display = 'none';
      }, 200);
    }

    button.addEventListener('click', function () {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    button.addEventListener('mouseenter', function () {
      button.style.transform = 'scale(1.03)';
      button.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.05)';
    });

    button.addEventListener('mouseleave', function () {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.04)';
    });

    window.addEventListener('message', function (ev) {
      if (
        ev &&
        ev.origin === baseOrigin &&
        ev.data &&
        ev.data.type === 'cadence-widget-close' &&
        ev.data.agentId === agentId
      ) {
        closePanel();
      }
    });

    root.appendChild(button);
    document.body.appendChild(panel);
    document.body.appendChild(root);
  }

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
