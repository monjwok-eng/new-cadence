import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPublicWidgetConfig,
  fetchPublicWidgetKnowledge,
  generateGroundedVoiceReply,
  retrieveTopSnippets,
} from '@/lib/rag-server';

export async function POST(req: NextRequest) {
  try {
    const {
      agentId,
      userMessage,
      conversationHistory,
      agentConfig,
      knowledgeItems,
    } = await req.json();

    if (!agentId || !userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Missing agentId or userMessage' },
        { status: 400 }
      );
    }

    const publicWidget = await fetchPublicWidgetConfig(String(agentId)).catch(() => null);
    const agent = agentConfig?.name
      ? {
          name: String(agentConfig.name),
          businessName: String(agentConfig.businessName || 'Business'),
          personality: String(agentConfig.personality || 'Professional'),
          customInstructions: String(agentConfig.customInstructions || ''),
          language: String(agentConfig.language || 'English (US)'),
          websiteUrl: String(agentConfig.websiteUrl || ''),
        }
      : publicWidget || {
          name: 'AI Voice Chatbot',
          businessName: 'Business',
          personality: 'Professional',
          customInstructions: 'Be concise, helpful, and polite.',
          language: 'English (US)',
          websiteUrl: '',
        };

    const items = Array.isArray(knowledgeItems) && knowledgeItems.length > 0
      ? knowledgeItems
      : await fetchPublicWidgetKnowledge(String(agentId));

    const topSnippets = retrieveTopSnippets(items, userMessage, 5);
    const result = await generateGroundedVoiceReply({
      agent,
      snippets: topSnippets,
      userMessage,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      responseText: result.responseText,
      sourcesUsed: result.sourcesUsed,
    });
  } catch (err) {
    console.error('Voice interact error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
