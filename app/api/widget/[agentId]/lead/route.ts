import { NextRequest, NextResponse } from 'next/server';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchPublicWidgetConfig } from '@/lib/rag-server';
import {
  isDomainAllowed,
  widgetCorsHeaders,
  widgetOptionsResponse,
} from '@/lib/widget-domain';

function sanitizePlain(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

export async function OPTIONS() {
  return widgetOptionsResponse();
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();

    const visitorName = sanitizePlain(body?.visitorName, 120);
    const visitorEmail = sanitizePlain(body?.visitorEmail, 200);
    const visitorPhone = sanitizePlain(body?.visitorPhone, 40);
    const company = sanitizePlain(body?.company, 120);
    const inquirySummary = sanitizePlain(body?.inquirySummary, 2000);
    const sourcePageUrl = sanitizePlain(body?.sourcePageUrl, 1000);
    const hostParam = sanitizePlain(body?.host, 253);

    if (!visitorName || !visitorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid name and email address.' },
        { status: 400, headers: widgetCorsHeaders() }
      );
    }

    const widget = await fetchPublicWidgetConfig(agentId);
    if (!widget) {
      return NextResponse.json(
        { error: 'Chatbot not found.' },
        { status: 404, headers: widgetCorsHeaders() }
      );
    }
    if (widget.status !== 'Active') {
      return NextResponse.json(
        { error: 'This voice chatbot is inactive.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }
    if (!widget.leadCaptureEnabled) {
      return NextResponse.json(
        { error: 'Lead capture is disabled for this chatbot.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    const appHost = req.headers.get('host');
    if (!isDomainAllowed(widget.allowedDomains, hostParam || sourcePageUrl, originHeader, appHost)) {
      return NextResponse.json(
        { error: 'Origin domain not permitted for this chatbot.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    const leadId = `wlead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = serverTimestamp();

    const payload: Record<string, unknown> = {
      id: leadId,
      workspaceId: widget.workspaceId,
      workspaceOwnerId: widget.workspaceOwnerId,
      agentId: widget.id,
      agentName: sanitizePlain(widget.name, 120) || 'Voice Chatbot',
      visitorName,
      visitorEmail,
      status: 'New',
      createdAt: now,
      updatedAt: now,
    };

    if (visitorPhone) payload.visitorPhone = visitorPhone;
    if (company) payload.company = company;
    if (inquirySummary) payload.inquirySummary = inquirySummary;
    if (sourcePageUrl) payload.sourcePageUrl = sourcePageUrl;

    await setDoc(doc(db, 'public_widget_leads', leadId), payload);

    return NextResponse.json(
      {
        success: true,
        leadId,
      },
      { headers: widgetCorsHeaders() }
    );
  } catch (err) {
    console.error('Widget lead API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to submit contact details.' },
      { status: 500, headers: widgetCorsHeaders() }
    );
  }
}
