import { NextRequest, NextResponse } from 'next/server';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  fetchPublicWidgetConfig,
  fetchPublicWidgetKnowledge,
  generateGroundedVoiceReply,
  retrieveTopSnippets,
} from '@/lib/rag-server';
import {
  extractHostname,
  isDomainAllowed,
  widgetCorsHeaders,
  widgetOptionsResponse,
} from '@/lib/widget-domain';

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
    const userMessage =
      typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';
    const sessionId =
      typeof body?.sessionId === 'string' && /^[a-zA-Z0-9_-]{4,128}$/.test(body.sessionId)
        ? body.sessionId
        : `wsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hostParam = typeof body?.host === 'string' ? body.host : '';
    const conversationHistory = Array.isArray(body?.conversationHistory)
      ? body.conversationHistory
      : [];

    if (!userMessage || userMessage.length > 2000) {
      return NextResponse.json(
        { error: 'Please provide a valid message (1-2000 characters).' },
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
        { error: 'This voice chatbot is currently inactive.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    const appHost = req.headers.get('host');
    if (!isDomainAllowed(widget.allowedDomains, hostParam, originHeader, appHost)) {
      return NextResponse.json(
        { error: 'Origin domain not permitted for this chatbot.' },
        { status: 403, headers: widgetCorsHeaders() }
      );
    }

    const knowledgeItems = await fetchPublicWidgetKnowledge(agentId);
    const topSnippets = retrieveTopSnippets(knowledgeItems, userMessage, 5);

    const { responseText, sourcesUsed } = await generateGroundedVoiceReply({
      agent: {
        name: widget.name,
        businessName: widget.businessName,
        personality: widget.personality,
        customInstructions: widget.customInstructions,
        language: widget.language,
        websiteUrl: widget.websiteUrl,
      },
      snippets: topSnippets,
      userMessage,
      conversationHistory,
    });

    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cleanHost = (
      extractHostname(hostParam) ||
      extractHostname(originHeader) ||
      'website'
    ).slice(0, 253);

    try {
      await setDoc(doc(db, 'public_widget_turns', turnId), {
        id: turnId,
        sessionId,
        workspaceId: widget.workspaceId,
        workspaceOwnerId: widget.workspaceOwnerId,
        agentId: widget.id,
        agentName: widget.name.slice(0, 120),
        hostDomain: cleanHost,
        userMessage: userMessage.slice(0, 2000),
        assistantReply: responseText.slice(0, 4000),
        createdAt: serverTimestamp(),
      });
    } catch (logErr) {
      console.warn('Turn logging notice:', logErr);
    }

    return NextResponse.json(
      {
        success: true,
        sessionId,
        turnId,
        responseText,
        sourcesUsed,
      },
      { headers: widgetCorsHeaders() }
    );
  } catch (err) {
    console.error('Widget chat API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to process voice chat.' },
      { status: 500, headers: widgetCorsHeaders() }
    );
  }
}
