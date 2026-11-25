'use client';

import React, { useState } from 'react';
import { Bot, CheckCircle2, FileText, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';

export function KnowledgePlayground({ scopedAgentId }: { scopedAgentId?: string } = {}) {
  const { agents, knowledgeSources, activeWorkspace, pushToast } = useApp();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    scopedAgentId || agents[0]?.id || ''
  );
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    usedSources: string[];
    retrievedChunks: { id: string; content: string; sourceName: string; score: number }[];
  } | null>(null);

  const handleTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeWorkspace) return;

    const targetAgent = agents.find((a) => a.id === selectedAgentId);
    const items = knowledgeSources
      .filter(
        (s) =>
          (!selectedAgentId ||
            selectedAgentId === 'all' ||
            s.agentId === selectedAgentId ||
            s.agentId === 'all' ||
            !s.agentId) &&
          typeof s.content === 'string' &&
          s.content.trim().length > 0
      )
      .map((s) => ({
        sourceName: s.sourceName,
        sourceType: s.sourceType,
        content: s.content || '',
      }));

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/kb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          agentId: selectedAgentId || 'all',
          question: question.trim(),
          agentConfig: targetAgent
            ? {
                name: targetAgent.name,
                businessName: targetAgent.businessName,
                personality: targetAgent.personality,
                customInstructions: targetAgent.customInstructions,
                language: targetAgent.language,
                websiteUrl: targetAgent.websiteUrl,
              }
            : undefined,
          knowledgeItems: items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to query knowledge base.');
      }

      setResult(data);
    } catch (err) {
      pushToast({
        title: 'Playground test failed',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Input & Agent Selection */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Knowledge Test Playground
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Test how your assigned voice agent answers customer questions using RAG.
              </p>
            </div>
          </div>

          <form onSubmit={handleTestQuery} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="playground-agent"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Select Voice Chatbot
              </label>
              <select
                id="playground-agent"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              >
                {agents.length === 0 ? (
                  <option value="">No chatbots created yet</option>
                ) : (
                  agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.businessName})
                    </option>
                  ))
                )}
              </select>
              {selectedAgent && (
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Personality: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedAgent.personality}</span> · Language: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedAgent.language}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="playground-question"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Customer Question
              </label>
              <textarea
                id="playground-question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is your return policy or office hours?"
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Generating Answer...' : 'Ask Voice Chatbot'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Output & Retrieved Passages */}
      <div className="space-y-5 lg:col-span-7">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Chatbot Response &amp; Grounding
          </h2>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ask a question to test knowledge retrieval
              </p>
              <p className="mt-1 max-w-sm text-xs text-neutral-500 dark:text-neutral-400">
                The AI will search your workspace knowledge chunks, assemble the context, and generate a grounded response.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Searching vector index and generating answer...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="mt-5 space-y-6">
              {/* Answer Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950/60 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <Bot className="h-4 w-4" />
                  <span>Chatbot Answer ({selectedAgent?.name || 'Voice Chatbot'})</span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                  {result.answer}
                </p>

                {result.usedSources.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-indigo-200/60 pt-3 text-xs text-neutral-600 dark:border-indigo-900/60 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Sources Used:</span>
                    {result.usedSources.map((src) => (
                      <span
                        key={src}
                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-indigo-700 shadow-2xs dark:bg-neutral-800 dark:text-indigo-300"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Retrieved Chunks / Passages */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Retrieved Knowledge Chunks ({result.retrievedChunks.length})
                </h3>
                <div className="mt-3 space-y-3">
                  {result.retrievedChunks.length === 0 ? (
                    <p className="text-xs text-neutral-500">No knowledge chunks matched this query.</p>
                  ) : (
                    result.retrievedChunks.map((chunk, idx) => (
                      <div
                        key={chunk.id || idx}
                        className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-950/50"
                      >
                        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            {chunk.sourceName}
                          </span>
                          <span className="font-mono tabular-nums">
                            Similarity: {Math.round(chunk.score * 100)}%
                          </span>
                        </div>
                        <p className="mt-2 text-neutral-700 dark:text-neutral-300 line-clamp-3">
                          {chunk.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
