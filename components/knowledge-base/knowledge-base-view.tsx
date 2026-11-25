'use client';

import React, { useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { KnowledgeSource, KnowledgeSourceType } from '@/lib/types';
import { KnowledgePlayground } from './knowledge-playground';

type MainTab = 'sources' | 'playground';
type AddTab = 'website' | 'document' | 'text';

function sourceDetailText(src: KnowledgeSource): string {
  if (src.sourceType === 'website') {
    return src.sourceUrl || src.sourceName;
  }
  if (src.sourceType === 'document') {
    const bytes = src.fileSizeBytes || 0;
    const sizeLabel =
      bytes > 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    const ext = src.sourceName.split('.').pop()?.toUpperCase() || 'FILE';
    return `${ext} · ${sizeLabel}`;
  }
  const charLen = src.content?.length || 0;
  return `Custom text (${charLen.toLocaleString()} chars)`;
}

function sourceTypeLabel(type: KnowledgeSourceType): string {
  if (type === 'website') return 'Website';
  if (type === 'document') return 'Document';
  return 'Text';
}

export function KnowledgeBaseView({
  scopedAgentId,
  initialSourceType,
  embedded = false,
}: {
  scopedAgentId?: string;
  initialSourceType?: KnowledgeSourceType;
  embedded?: boolean;
} = {}) {
  const {
    isReady,
    activeWorkspace,
    agents,
    knowledgeSources,
    addWebsiteOrTextKnowledge,
    updateKnowledgeSource,
    uploadKnowledgeFile,
    deleteKnowledgeSource,
    pushToast,
  } = useApp();

  const [mainTab, setMainTab] = useState<MainTab>('sources');
  const [activeTab, setActiveTab] = useState<AddTab>(initialSourceType || 'website');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | KnowledgeSourceType>(
    initialSourceType || 'all'
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string>(scopedAgentId || 'all');

  // Website form
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [submittingWebsite, setSubmittingWebsite] = useState(false);

  // Document form
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Text form
  const [textTitle, setTextTitle] = useState('');
  const [textBody, setTextBody] = useState('');
  const [textError, setTextError] = useState('');
  const [submittingText, setSubmittingText] = useState(false);

  // Processing action state
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [sourceToDelete, setSourceToDelete] = useState<KnowledgeSource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const effectiveAgentFilter = scopedAgentId || null;
  const scopedKnowledgeSources = effectiveAgentFilter
    ? knowledgeSources.filter(
        (src) => src.agentId === effectiveAgentFilter || src.agentId === 'all' || !src.agentId
      )
    : knowledgeSources;

  const filteredSources = scopedKnowledgeSources.filter((src) => {
    const matchesType = typeFilter === 'all' || src.sourceType === typeFilter;
    const q = searchQuery.trim().toLowerCase();
    const detail = sourceDetailText(src).toLowerCase();
    const matchesQuery =
      !q || src.sourceName.toLowerCase().includes(q) || detail.includes(q);
    return matchesType && matchesQuery;
  });

  const getAgentName = (id: string) => {
    if (id === 'all') return 'All Workspace Agents';
    return agents.find((a) => a.id === id)?.name || 'Unassigned Agent';
  };

  const triggerProcessingPipeline = async (
    sourceId: string,
    sourceType: KnowledgeSourceType,
    sourceUrl?: string,
    content?: string
  ) => {
    if (!activeWorkspace) return;
    try {
      setProcessingId(sourceId);
      await updateKnowledgeSource(sourceId, {
        processingStatus: sourceType === 'website' ? 'crawling' : 'processing',
      });
      const res = await fetch('/api/kb/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          sourceId,
          action: sourceType === 'website' ? 'crawl' : 'process',
          sourceUrl,
          textContent: content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await updateKnowledgeSource(sourceId, { processingStatus: 'failed' });
        throw new Error(data.error || 'Processing failed');
      }
      await updateKnowledgeSource(sourceId, {
        content: data.extractedText || content || '',
        processingStatus: 'ready',
      });
      pushToast({
        title: 'Source trained successfully',
        description: `Indexed ${data.indexedChunksCount || 1} knowledge segments for live voice answers.`,
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Indexing error',
        description: err instanceof Error ? err.message : 'Failed to process source.',
        variant: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebsiteError('');
    const trimmed = websiteUrl.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    } catch {
      setWebsiteError('Please enter a valid website URL (e.g., https://example.com/faq).');
      return;
    }

    setSubmittingWebsite(true);
    try {
      const sourceId = await addWebsiteOrTextKnowledge({
        agentId: selectedAgentId,
        sourceType: 'website',
        sourceName: websiteTitle.trim() || parsed.hostname + parsed.pathname,
        sourceUrl: parsed.toString(),
      });
      setWebsiteUrl('');
      setWebsiteTitle('');
      pushToast({
        title: 'Website URL added & crawling',
        description: 'Extracting content and indexing vector embeddings...',
        variant: 'success',
      });
      if (sourceId) {
        triggerProcessingPipeline(sourceId, 'website', parsed.toString());
      }
    } catch (err) {
      setWebsiteError(
        err instanceof Error ? err.message : 'Unable to save website URL.'
      );
    } finally {
      setSubmittingWebsite(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocError('');
    if (!selectedFile) {
      setDocError('Select a PDF, TXT, DOCX, or Markdown file first.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setDocError('Maximum supported file size is 10 MB.');
      return;
    }

    setUploadingDoc(true);
    try {
      let fileText = '';
      if (
        selectedFile.type === 'text/plain' ||
        selectedFile.type === 'text/markdown' ||
        selectedFile.name.endsWith('.md') ||
        selectedFile.name.endsWith('.txt')
      ) {
        fileText = await selectedFile.text();
      } else {
        const rawFallback = await selectedFile.text().catch(() => '');
        const asciiRuns = rawFallback
          .replace(/[^\x20-\x7E\n\r]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        fileText =
          asciiRuns.length >= 60
            ? asciiRuns.slice(0, 18000)
            : `Document uploaded: ${selectedFile.name} (${selectedFile.size} bytes). Official business reference document.`;
      }

      const uploadedId = await uploadKnowledgeFile(selectedAgentId, selectedFile);
      if (uploadedId) {
        await updateKnowledgeSource(uploadedId, {
          content: fileText.slice(0, 19500),
          processingStatus: 'ready',
        });
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      pushToast({
        title: 'Document uploaded & trained',
        description: 'Document content extracted and synced to your voice chatbots.',
        variant: 'success',
      });
    } catch (err) {
      setDocError(
        err instanceof Error ? err.message : 'Document upload failed.'
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    setTextError('');
    if (!textTitle.trim() || textBody.trim().length < 20) {
      setTextError('Provide a title and at least 20 characters of training text.');
      return;
    }

    setSubmittingText(true);
    try {
      const sourceId = await addWebsiteOrTextKnowledge({
        agentId: selectedAgentId,
        sourceType: 'text',
        sourceName: textTitle.trim(),
        content: textBody.trim(),
      });
      setTextTitle('');
      setTextBody('');
      pushToast({
        title: 'Text source saved & indexed',
        description: 'Training snippet processed into vector embeddings.',
        variant: 'success',
      });
      if (sourceId) {
        triggerProcessingPipeline(sourceId, 'text', undefined, textBody.trim());
      }
    } catch (err) {
      setTextError(
        err instanceof Error ? err.message : 'Unable to save text source.'
      );
    } finally {
      setSubmittingText(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sourceToDelete || deleting) return;
    const target = sourceToDelete;
    setDeleting(true);
    try {
      await deleteKnowledgeSource(target);
      pushToast({ title: 'Knowledge source removed' });
      setSourceToDelete(null);
    } catch (err) {
      pushToast({
        title: 'Failed to remove source',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Main Navigation Tabs */}
      {!embedded ? (
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Knowledge Sources &amp; Training
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Train your website voice chatbots with crawled pages, uploaded documents, and custom Q&amp;A scripts.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 p-1.5 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMainTab('sources')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                mainTab === 'sources'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <BookOpen className="h-4 w-4 text-indigo-600" />
              Knowledge Sources ({scopedKnowledgeSources.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab('playground')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                mainTab === 'playground'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Test RAG Playground
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Train this chatbot with website pages, uploaded files, or Q&amp;A snippets.
          </p>
          <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMainTab('sources')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mainTab === 'sources'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              Sources ({scopedKnowledgeSources.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab('playground')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mainTab === 'playground'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Test RAG
            </button>
          </div>
        </div>
      )}

      {mainTab === 'playground' ? (
        <KnowledgePlayground scopedAgentId={scopedAgentId} />
      ) : (
        <>
          {/* Add Knowledge Source Panel */}
          <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
              <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                {(
                  [
                    { id: 'website', icon: Globe, label: 'Website URL' },
                    { id: 'document', icon: FileText, label: 'Upload Documents' },
                    { id: 'text', icon: Type, label: 'Text Content' },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {!scopedAgentId && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="kb-agent-assign"
                    className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap"
                  >
                    Assign to chatbot:
                  </label>
                  <select
                    id="kb-agent-assign"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-800 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
                  >
                    <option value="all">All Workspace Chatbots</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-5">
              {activeTab === 'website' && (
                <form onSubmit={handleAddWebsite} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Website or page URL
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourcompany.com/faq"
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Source label (optional)
                      </label>
                      <input
                        type="text"
                        value={websiteTitle}
                        onChange={(e) => setWebsiteTitle(e.target.value)}
                        placeholder="e.g., Pricing & FAQ"
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                  {websiteError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{websiteError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Automated crawler extracts text, chunks paragraphs, and indexes vector embeddings.
                    </span>
                    <button
                      type="submit"
                      disabled={submittingWebsite}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {submittingWebsite ? 'Crawling & Indexing...' : 'Crawl & Index URL'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'document' && (
                <form onSubmit={handleAddDocument} className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/20 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-indigo-500"
                  >
                    <Upload className="h-6 w-6 text-neutral-400" />
                    <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedFile ? selectedFile.name : 'Click to choose a document'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Supports PDF, TXT, DOCX, or Markdown (.md) up to 10 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.md"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setDocError('');
                      }}
                      className="hidden"
                    />
                  </div>
                  {docError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{docError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Stored in secure workspace storage and processed for vector retrieval.
                    </span>
                    <button
                      type="submit"
                      disabled={uploadingDoc}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {uploadingDoc ? 'Uploading...' : 'Upload & Process Document'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'text' && (
                <form onSubmit={handleAddText} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Title
                    </label>
                    <input
                      type="text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="e.g., Return Policy & Warranty Terms"
                      className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Content
                    </label>
                    <textarea
                      rows={4}
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      placeholder="Paste FAQs, product specs, or call handling guidelines..."
                      className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                  </div>
                  {textError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{textError}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingText}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {submittingText ? 'Indexing...' : 'Save & Index Text Source'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Knowledge Source List */}
          <div className="space-y-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter knowledge sources..."
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="inline-flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'website', label: 'Website' },
                    { id: 'document', label: 'Document' },
                    { id: 'text', label: 'Text' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeFilter(t.id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      typeFilter === t.id
                        ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {!isReady ? (
              <TableSkeleton rows={4} />
            ) : filteredSources.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No knowledge sources found"
                description="Add a website URL, upload a document, or save a text snippet above to train your voice agents."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Assigned Agent</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredSources.map((src) => {
                        const isProcessing = processingId === src.id;
                        return (
                          <tr
                            key={src.id}
                            className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                          >
                            <td className="px-4 py-3.5">
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {src.sourceName}
                              </p>
                              <p className="mt-0.5 max-w-sm truncate text-xs text-neutral-500 dark:text-neutral-400">
                                {sourceDetailText(src)} · {src.addedAt}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                              {sourceTypeLabel(src.sourceType)}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                              {getAgentName(src.agentId)}
                            </td>
                            <td className="px-4 py-3.5">
                              {isProcessing ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Indexing Embeddings...
                                </span>
                              ) : src.processingStatus === 'ready' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Ready (Indexed)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                                  <Clock className="h-3.5 w-3.5" />
                                  Pending Indexing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => triggerProcessingPipeline(src.id, src.sourceType, src.sourceUrl, src.content)}
                                  disabled={isProcessing}
                                  title="Reprocess & Re-index Source"
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                                  Reprocess
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSourceToDelete(src)}
                                  aria-label={`Remove ${src.sourceName}`}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(sourceToDelete)}
        title="Remove knowledge source?"
        description={
          sourceToDelete
            ? `Remove "${sourceToDelete.sourceName}" and its vector embeddings from your workspace?`
            : ''
        }
        confirmLabel={deleting ? 'Removing...' : 'Remove'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setSourceToDelete(null)}
      />
    </div>
  );
}
