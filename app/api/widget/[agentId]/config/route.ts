import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicWidgetConfig } from '@/lib/rag-server';
import {
  isDomainAllowed,
  widgetCorsHeaders,
  widgetOptionsResponse,
} from '@/lib/widget-domain';

export async function OPTIONS() {
  return widgetOptionsResponse();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const widget = await fetchPublicWidgetConfig(agentId);

    if (!widget) {
      return NextResponse.json(
        { error: 'Chatbot widget not found or not published yet.' },
        { status: 404, headers: widgetCorsHeaders() }
      );
    }

    if (widget.status === 'Inactive') {
      return NextResponse.json(
        { error: 'This voice chatbot is currently inactive.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    const hostParam = req.nextUrl.searchParams.get('host');
    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    const appHost = req.headers.get('host');

    if (!isDomainAllowed(widget.allowedDomains, hostParam, originHeader, appHost)) {
      return NextResponse.json(
        { error: 'Domain is not in this chatbot allowed domains list.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        widget: {
          id: widget.id,
          name: widget.name,
          businessName: widget.businessName,
          personality: widget.personality,
          voiceId: widget.voiceId,
          voiceLabel: widget.voiceLabel,
          language: widget.language,
          welcomeMessage:
            widget.welcomeMessage ||
            `Hi! Ask me anything about ${widget.businessName}.`,
          accentColor: widget.accentColor || '#2563eb',
          widgetPosition: widget.widgetPosition || 'bottom-right',
          widgetTheme: widget.widgetTheme || 'light',
          launcherLabel: widget.launcherLabel || 'Talk with us',
          leadCaptureEnabled: Boolean(widget.leadCaptureEnabled),
        },
      },
      {
        headers: {
          ...widgetCorsHeaders(),
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('Widget config API error:', err);
    return NextResponse.json(
      { error: 'Unable to load widget configuration.' },
      { status: 500, headers: widgetCorsHeaders() }
    );
  }
}
