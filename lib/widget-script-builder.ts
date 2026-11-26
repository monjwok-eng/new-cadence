export const SHARED_WIDGET_RUNTIME_JS = String.raw`
  function sanitizeColor(raw, fallback) {
    if (typeof raw === 'string') {
      var trimmed = raw.trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
      if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(trimmed)) {
        return trimmed;
      }
    }
    return fallback;
  }

  function numOr(val, fallback) {
    return typeof val === 'number' && isFinite(val) ? val : fallback;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  var ICON_SIZE_MAP = {
    SMALL: 48,
    MEDIUM: 56,
    LARGE: 64,
    XL: 72,
    '2XL': 80,
    '3XL': 96,
    '4XL': 128,
    '5XL': 156,
  };

  function buildCadenceLogoSvg(sizePx) {
    return (
      '<svg width="' +
      sizePx +
      '" height="' +
      sizePx +
      '" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;flex-shrink:0;">' +
      '<path d="M5 12.5C5 6.5 11 3.5 19.5 3.5C24.5 3.5 27.5 6 27.5 9.2C27.5 12.1 24.2 13.8 19.5 13.8C14.2 13.8 10.2 12.2 6.2 14.2C5.4 14.6 5 13.8 5 12.5Z" fill="currentColor"/>' +
      '<path d="M27 15.5C27 21.5 21 24.5 12.5 24.5C7.5 24.5 4.5 22 4.5 18.8C4.5 15.9 7.8 14.2 12.5 14.2C17.8 14.2 21.8 15.8 25.8 13.8C26.6 13.4 27 14.2 27 15.5Z" fill="currentColor"/>' +
      '</svg>'
    );
  }

  function buildCloseSvg() {
    return (
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex-shrink:0;">' +
      '<line x1="18" y1="6" x2="6" y2="18"></line>' +
      '<line x1="6" y1="6" x2="18" y2="18"></line>' +
      '</svg>'
    );
  }

  function renderFloatingWidget(cfg, baseOrigin, hostName, pageUrl) {
    var agentId = cfg.id;
    var wc = cfg.widgetConfig && typeof cfg.widgetConfig === 'object' ? cfg.widgetConfig : {};

    var primaryColor = sanitizeColor(wc.brandColor, sanitizeColor(cfg.accentColor, '#000000'));
    var textColor = sanitizeColor(wc.brandTextColor, '#FFFFFF');
    var iconBgColor = sanitizeColor(wc.iconBackgroundColor, primaryColor);
    var iconBgTransparent = Boolean(wc.iconBackgroundTransparent);
    var isDark = Boolean(wc.enableDarkMode || cfg.widgetTheme === 'dark');

    var isLeft = wc.iconPosition ? wc.iconPosition === 'LEFT' : cfg.widgetPosition === 'bottom-left';
    var iconShape = wc.iconShape === 'SQUARE' ? 'SQUARE' : 'CIRCLE';
    var baseIconPx = ICON_SIZE_MAP[wc.iconSize || 'SMALL'] || 48;
    var borderRadiusValue = iconShape === 'CIRCLE' ? '9999px' : '16px';
    var heightPercent = clamp(numOr(wc.height, 85), 40, 100);

    var desktopBottom = Math.max(8, numOr(wc.distanceFromBottom, 16));
    var mobileBottom = Math.max(8, numOr(wc.distanceFromBottomInMobile, desktopBottom));
    var desktopHorizontal = Math.max(8, numOr(wc.horizontalDistance, 16));
    var mobileHorizontal = Math.max(8, numOr(wc.horizontalDistanceInMobile, desktopHorizontal));

    var welcomeMessage = (cfg.welcomeMessage || 'Hello! How can I assist you today?').trim();
    var tooltipText = (wc.tooltip || welcomeMessage).trim();
    var hideTooltip = Boolean(wc.hideTooltip);
    var agentName = (cfg.name || 'Cadence Chatbot').trim();

    var isOpen = false;
    var isExpanded = false;
    var tooltipDismissed = false;
    var userInteracted = false;
    var iframeEl = null;

    var root = document.createElement('div');
    root.id = 'cadence-widget-root-' + agentId;
    root.setAttribute('data-cadence-widget', agentId);
    root.style.position = 'fixed';
    root.style.zIndex = '2147483000';
    root.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Popup Window Container (anchored cleanly above launcher, matching FloatingChatbotLauncher)
    var popup = document.createElement('div');
    popup.id = 'cadence-widget-popup-' + agentId;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', agentName + ' chatbot');
    popup.setAttribute('aria-hidden', 'true');
    popup.style.position = 'fixed';
    popup.style.zIndex = '2147483001';
    popup.style.display = 'none';
    popup.style.flexDirection = 'column';
    popup.style.overflow = 'hidden';
    popup.style.borderRadius = '16px';
    popup.style.border = isDark ? '1px solid #1f2937' : '1px solid #e5e7eb';
    popup.style.background = isDark ? '#111827' : '#ffffff';
    popup.style.boxShadow = '0 24px 56px -12px rgba(15, 23, 42, 0.24)';
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(12px) scale(0.96)';
    popup.style.transition =
      'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1), width 200ms ease, height 200ms ease';

    // Tooltip Bubble Above Launcher
    var tooltipWrap = null;
    if (!hideTooltip && tooltipText) {
      tooltipWrap = document.createElement('div');
      tooltipWrap.id = 'cadence-widget-tooltip-' + agentId;
      tooltipWrap.style.position = 'fixed';
      tooltipWrap.style.zIndex = '2147483000';
      tooltipWrap.style.maxWidth = '260px';
      tooltipWrap.style.display = 'flex';
      tooltipWrap.style.alignItems = 'center';
      tooltipWrap.style.gap = '8px';
      tooltipWrap.style.borderRadius = '12px';
      tooltipWrap.style.padding = '8px 14px';
      tooltipWrap.style.fontSize = '12px';
      tooltipWrap.style.fontWeight = '500';
      tooltipWrap.style.lineHeight = '1.35';
      tooltipWrap.style.border = isDark ? '1px solid #374151' : '1px solid #e5e7eb';
      tooltipWrap.style.background = isDark ? '#1f2937' : '#ffffff';
      tooltipWrap.style.color = isDark ? '#f3f4f6' : '#1f2937';
      tooltipWrap.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 4px 10px -4px rgba(0, 0, 0, 0.08)';
      tooltipWrap.style.fontFamily = root.style.fontFamily;

      var tooltipBtn = document.createElement('button');
      tooltipBtn.type = 'button';
      tooltipBtn.textContent = tooltipText;
      tooltipBtn.style.border = 'none';
      tooltipBtn.style.background = 'transparent';
      tooltipBtn.style.padding = '0';
      tooltipBtn.style.margin = '0';
      tooltipBtn.style.color = 'inherit';
      tooltipBtn.style.font = 'inherit';
      tooltipBtn.style.textAlign = 'left';
      tooltipBtn.style.cursor = 'pointer';
      tooltipBtn.style.overflow = 'hidden';
      tooltipBtn.style.textOverflow = 'ellipsis';
      tooltipBtn.style.whiteSpace = 'nowrap';
      tooltipBtn.style.minWidth = '0';
      tooltipBtn.addEventListener('click', function () {
        userInteracted = true;
        openPanel();
      });

      var tooltipCloseBtn = document.createElement('button');
      tooltipCloseBtn.type = 'button';
      tooltipCloseBtn.setAttribute('aria-label', 'Dismiss tooltip');
      tooltipCloseBtn.innerHTML =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      tooltipCloseBtn.style.border = 'none';
      tooltipCloseBtn.style.background = 'transparent';
      tooltipCloseBtn.style.padding = '2px';
      tooltipCloseBtn.style.margin = '0';
      tooltipCloseBtn.style.color = isDark ? '#9ca3af' : '#9ca3af';
      tooltipCloseBtn.style.cursor = 'pointer';
      tooltipCloseBtn.style.flexShrink = '0';
      tooltipCloseBtn.style.borderRadius = '4px';
      tooltipCloseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        tooltipDismissed = true;
        syncTooltipVisibility();
      });

      tooltipWrap.appendChild(tooltipBtn);
      tooltipWrap.appendChild(tooltipCloseBtn);
    }

    // Launcher Button (Matches FloatingChatbotLauncher)
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open ' + agentName);
    button.title = 'Chat with ' + agentName;
    button.style.position = 'fixed';
    button.style.zIndex = '2147483000';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.border = 'none';
    button.style.padding = '0';
    button.style.borderRadius = borderRadiusValue;
    button.style.color = textColor;
    button.style.cursor = 'pointer';
    button.style.outline = 'none';
    button.style.webkitTapHighlightColor = 'transparent';
    button.style.transition = 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease';

    function getViewportState() {
      var isMobile = window.innerWidth < 640;
      var bottomOffset = isMobile ? mobileBottom : desktopBottom;
      var horizontalOffset = isMobile ? mobileHorizontal : desktopHorizontal;
      var renderedIconPx = isMobile ? Math.min(72, Math.max(44, baseIconPx)) : baseIconPx;
      return {
        isMobile: isMobile,
        bottomOffset: bottomOffset,
        horizontalOffset: horizontalOffset,
        renderedIconPx: renderedIconPx,
      };
    }

    function syncButtonAppearance(renderedIconPx) {
      var showBg = isOpen || !iconBgTransparent;
      button.style.backgroundColor = showBg ? iconBgColor : 'transparent';
      button.style.boxShadow = showBg
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        : 'none';

      if (isOpen) {
        button.innerHTML = buildCloseSvg();
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Close ' + agentName);
        button.title = 'Close ' + agentName;
      } else {
        var svgSize = renderedIconPx >= 96 ? 48 : renderedIconPx >= 72 ? 36 : 24;
        button.innerHTML = buildCadenceLogoSvg(svgSize);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Open ' + agentName);
        button.title = 'Chat with ' + agentName;
      }
    }

    function syncTooltipVisibility() {
      if (!tooltipWrap) return;
      tooltipWrap.style.display = !isOpen && !tooltipDismissed ? 'flex' : 'none';
    }

    function syncLayout() {
      var vp = getViewportState();
      var sideProp = isLeft ? 'left' : 'right';
      var clearSideProp = isLeft ? 'right' : 'left';
      var windowBottomOffset = vp.bottomOffset + vp.renderedIconPx + 14;

      button.style.bottom = vp.bottomOffset + 'px';
      button.style[sideProp] = vp.horizontalOffset + 'px';
      button.style[clearSideProp] = 'auto';
      button.style.width = vp.renderedIconPx + 'px';
      button.style.height = vp.renderedIconPx + 'px';
      syncButtonAppearance(vp.renderedIconPx);

      if (tooltipWrap) {
        tooltipWrap.style.bottom = vp.bottomOffset + vp.renderedIconPx + 10 + 'px';
        tooltipWrap.style[sideProp] = vp.horizontalOffset + 'px';
        tooltipWrap.style[clearSideProp] = 'auto';
        syncTooltipVisibility();
      }

      popup.style.bottom = windowBottomOffset + 'px';
      popup.style[sideProp] = vp.horizontalOffset + 'px';
      popup.style[clearSideProp] = 'auto';

      if (vp.isMobile) {
        popup.style.width = 'calc(100vw - ' + Math.max(32, vp.horizontalOffset * 2) + 'px)';
      } else {
        var targetWidth = isExpanded ? 520 : 395;
        popup.style.width = Math.min(targetWidth, Math.max(280, window.innerWidth - vp.horizontalOffset * 2)) + 'px';
      }

      popup.style.maxHeight = 'calc(100vh - ' + (windowBottomOffset + 20) + 'px)';
      popup.style.height = isExpanded
        ? 'calc(100vh - ' + (windowBottomOffset + 24) + 'px)'
        : heightPercent + 'vh';
    }

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
        iframeEl.title = agentName + ' - Powered by Cadence';
        iframeEl.setAttribute('allow', 'microphone; autoplay; clipboard-write');
        iframeEl.style.width = '100%';
        iframeEl.style.height = '100%';
        iframeEl.style.border = 'none';
        iframeEl.style.display = 'block';
        iframeEl.style.background = 'transparent';
        popup.appendChild(iframeEl);
      }
      isOpen = true;
      popup.style.display = 'flex';
      popup.setAttribute('aria-hidden', 'false');
      syncLayout();
      window.requestAnimationFrame(function () {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0) scale(1)';
      });
    }

    function closePanel() {
      isOpen = false;
      popup.setAttribute('aria-hidden', 'true');
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(12px) scale(0.96)';
      syncLayout();
      window.setTimeout(function () {
        if (!isOpen) popup.style.display = 'none';
      }, 190);
    }

    button.addEventListener('click', function () {
      userInteracted = true;
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    button.addEventListener('mouseenter', function () {
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', function () {
      button.style.transform = 'scale(1)';
    });

    window.addEventListener('resize', syncLayout);

    window.addEventListener('message', function (ev) {
      if (!ev || !ev.data || ev.data.agentId !== agentId) return;
      if (ev.origin && ev.origin !== baseOrigin) return;
      if (ev.data.type === 'cadence-widget-close') {
        closePanel();
      } else if (ev.data.type === 'cadence-widget-expand') {
        isExpanded = Boolean(ev.data.expanded);
        syncLayout();
      }
    });

    syncLayout();
    root.appendChild(popup);
    if (tooltipWrap) {
      root.appendChild(tooltipWrap);
    }
    root.appendChild(button);
    document.body.appendChild(root);

    // Auto-Open Delay Handling
    var isMobileNow = window.innerWidth < 640;
    var autoOpenMode = isMobileNow
      ? wc.autoOpenChatWindowInMobile
      : wc.autoOpenChatWindowInDesktop;
    if (autoOpenMode === 'ALWAYS_OPEN_WITH_DELAY') {
      var delaySec = Math.max(
        0,
        numOr(
          isMobileNow
            ? wc.autoOpenChatWindowDelayInMobile
            : wc.autoOpenChatWindowDelayInDesktop,
          5
        )
      );
      window.setTimeout(function () {
        if (!userInteracted && !isOpen) {
          openPanel();
        }
      }, delaySec * 1000);
    }
  }
`;
