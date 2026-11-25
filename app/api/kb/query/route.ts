import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPublicWidgetConfig,
  fetchPublicWidgetKnowledge,
  generateGroundedVoiceReply,
  retrieveTopSnippets,
} from '@/lib/rag-server';

export async function POST(req: NextRequest) {
  try {
    const { agentId, question, agentConfig, knowledgeItems } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 });
    }

    const cleanQuestion = question.trim();
    const publicWidget = agentId ? await fetchPublicWidgetConfig(String(agentId)).catch(() => null) : null;
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
          name: 'Voice Chatbot',
          businessName: 'Business',
          personality: 'Professional',
          customInstructions: '',
          language: 'English (US)',
          websiteUrl: '',
        };

    const items =
      Array.isArray(knowledgeItems) && knowledgeItems.length > 0
        ? knowledgeItems
        : agentId && agentId !== 'all'
          ? await fetchPublicWidgetKnowledge(String(agentId))
          : [];

    const retrievedChunks = retrieveTopSnippets(items, cleanQuestion, 5);
    const { responseText, sourcesUsed } = await generateGroundedVoiceReply({
      agent,
      snippets: retrievedChunks,
      userMessage: cleanQuestion,
    });

    return NextResponse.json({
      answer: responseText,
      usedSources: sourcesUsed,
      retrievedChunks: retrievedChunks.map((c) => ({
        id: c.id,
        content: c.content,
        sourceName: c.sourceName,
        score: Math.round(c.score * 100) / 100,
      })),
    });
  } catch (err) {
    console.error('RAG query error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
