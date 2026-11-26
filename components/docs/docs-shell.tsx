'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  FileText,
  Globe,
  Hash,
  Layers,
  List,
  Lock,
  Menu,
  Mic,
  Rocket,
  Search,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';
import {
  ALL_DOCS_PAGES,
  DOCS_TABS,
  DocsEndpointMeta,
  DocsPageEntry,
  getDocsNeighbors,
  getDocsPageBySlug,
} from '@/lib/docs/docs-data';

function SidebarIcon({
  icon,
  className,
}: {
  icon: DocsPageEntry['icon'];
  className?: string;
}) {
  switch (icon) {
    case 'clock':
      return <Clock3 className={className} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={className} aria-hidden="true" />;
    case 'rocket':
      return <Rocket className={className} aria-hidden="true" />;
    case 'terminal':
      return <Terminal className={className} aria-hidden="true" />;
    case 'code':
      return <Code2 className={className} aria-hidden="true" />;
    case 'lock':
      return <Lock className={className} aria-hidden="true" />;
    case 'bot':
      return <Bot className={className} aria-hidden="true" />;
    case 'layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'mic':
      return <Mic className={className} aria-hidden="true" />;
    default:
      return <BookOpen className={className} aria-hidden="true" />;
  }
}

function MethodTag({ method }: { method: DocsEndpointMeta['method'] }) {
  const colorMap: Record<DocsEndpointMeta['method'], string> = {
    GET: 'bg-emerald-50 text-emerald-700',
    POST: 'bg-blue-50 text-[#155DEE]',
    PATCH: 'bg-amber-50 text-amber-700',
    DELETE: 'bg-rose-50 text-rose-700',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${colorMap[method]}`}
    >
      {method}
    </span>
  );
}

export function DocsShell({ slug }: { slug?: string }) {
  const page = useMemo(() => getDocsPageBySlug(slug), [slug]);
  return <DocsShellInner key={page.slug} page={page} />;
}

function DocsShellInner({ page }: { page: DocsPageEntry }) {
  const router = useRouter();
  const activeTab = useMemo(
    () => DOCS_TABS.find((t) => t.id === page.tab) || DOCS_TABS[1],
    [page.tab]
  );
  const { prev, next } = useMemo(() => getDocsNeighbors(page), [page]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPage, setCopiedPage] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [markdownModalOpen, setMarkdownModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [feedbackVote, setFeedbackVote] = useState<'yes' | 'no' | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    page.sections[0]?.id || ''
  );

  // Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prevOpen) => !prevOpen);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setCopyMenuOpen(false);
        setMarkdownModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Scroll-spy for "On this page" table of contents
  useEffect(() => {
    if (page.sections.length === 0) return;

    const handleScroll = () => {
      const offset = 160;
      let current = page.sections[0]?.id || '';
      for (const section of page.sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= offset) {
            current = section.id;
          }
        }
      }
      setActiveSectionId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page.slug, page.sections]);

  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return ALL_DOCS_PAGES.slice(0, 10);
    }
    return ALL_DOCS_PAGES.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.eyebrow.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [searchQuery]);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(page.markdown);
      setCopiedPage(true);
      setCopyMenuOpen(false);
      setTimeout(() => setCopiedPage(false), 1800);
    } catch {
      // Ignore clipboard unavailability
    }
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 1800);
    } catch {
      // Ignore clipboard unavailability
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SidebarList = (
    <div id="navigation-items" className="space-y-7 text-sm">
      {activeTab.groups.map((group) => (
        <div key={group.group}>
          <div className="mb-2.5 flex items-center gap-2.5 pl-4 font-semibold text-gray-900">
            <SidebarIcon
              icon={group.icon}
              className="h-3.5 w-3.5 shrink-0 text-gray-700"
            />
            <h3 className="text-sm font-semibold text-gray-900">{group.group}</h3>
          </div>
          <ul className="space-y-0.5">
            {group.pages.map((item) => {
              const active = item.slug === page.slug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/docs/${item.slug}`}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex w-full items-center gap-x-2.5 rounded-xl py-1.5 pl-4 pr-3 text-left transition-colors ${
                      active
                        ? 'bg-[#155DEE]/10 font-medium text-[#155DEE]'
                        : 'text-gray-600 hover:bg-gray-600/5 hover:text-gray-900'
                    }`}
                  >
                    {item.method ? (
                      <MethodTag method={item.method} />
                    ) : (
                      <SidebarIcon
                        icon={item.icon}
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? 'text-[#155DEE]'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-600 antialiased">
      {/* Sticky Mintlify-style Top Header */}
      <header
        id="navbar"
        className="sticky top-0 z-30 w-full border-b border-gray-200/70 bg-white/85 backdrop-blur-md"
      >
        <div className="mx-auto max-w-[90rem]">
          {/* Top Bar Row */}
          <div className="mx-4 flex h-16 min-w-0 items-center gap-x-4 border-b border-gray-100 lg:mx-0 lg:px-12">
            <div className="flex flex-1 items-center gap-x-4">
              <Link
                href="/docs/changelog/overview"
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap select-none"
              >
                <BrandMark className="h-7 w-7 text-[#155DEE]" />
                <span className="font-display text-lg font-bold tracking-tight text-gray-900">
                  Cadence
                </span>
                <span className="text-sm font-medium text-gray-400">Docs</span>
              </Link>
            </div>

            {/* Center Search Trigger */}
            <div className="relative z-20 hidden flex-1 items-center justify-center lg:flex">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="group/search flex h-9 w-full max-w-md items-center justify-between gap-2 rounded-xl bg-white pl-3.5 pr-3 text-sm leading-6 text-gray-500 ring-1 ring-gray-300/80 transition-colors hover:ring-gray-400"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search
                    className="h-4 w-4 shrink-0 text-gray-500 group-hover/search:text-gray-800"
                    aria-hidden="true"
                  />
                  <span className="truncate">Search...</span>
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold text-gray-400">
                  Ctrl K
                </span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="ml-auto hidden flex-1 items-center justify-end space-x-6 lg:flex">
              <a
                href="mailto:support@cadence.ai"
                className="whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Support
              </a>
              <Link
                href="/create-chatbot"
                className="group inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-[#155DEE] py-2 pl-3.5 pr-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <span>Create Your Chatbot Now</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/90" />
              </Link>
            </div>

            {/* Mobile Search Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Breadcrumb & Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-12 w-full items-center px-4 text-left focus:outline-none lg:hidden"
          >
            <Menu className="h-4 w-4 shrink-0 text-gray-500" />
            <div className="ml-3 flex min-w-0 flex-1 items-center gap-2.5 truncate text-sm">
              <span className="shrink-0 text-gray-500">{page.eyebrow}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="truncate font-semibold text-gray-900">
                {page.title}
              </span>
            </div>
          </button>

          {/* Desktop Section Tabs */}
          <div className="hidden h-12 px-12 lg:flex">
            <nav aria-label="Documentation sections" className="flex h-full gap-x-6 text-sm">
              {DOCS_TABS.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <Link
                    key={tab.id}
                    href={`/docs/${tab.defaultSlug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex h-full items-center whitespace-nowrap font-medium transition-colors ${
                      isActive
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] w-full transition-colors ${
                        isActive
                          ? 'bg-[#155DEE]'
                          : 'bg-transparent group-hover:bg-gray-200'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-gray-950/35 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
              <Link
                href="/docs/changelog/overview"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2"
              >
                <BrandMark className="h-6 w-6 text-[#155DEE]" />
                <span className="font-display text-base font-bold text-gray-900">
                  Cadence Docs
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-3">
              {DOCS_TABS.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <Link
                    key={tab.id}
                    href={`/docs/${tab.defaultSlug}`}
                    onClick={() => setMobileNavOpen(false)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                      isActive
                        ? 'bg-[#155DEE]/10 text-[#155DEE]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-6">{SidebarList}</div>
          </aside>
        </div>
      )}

      {/* Three-Column Mintlify Shell */}
      <div className="mx-auto max-w-[90rem] px-4 lg:flex lg:px-8">
        {/* Left Navigation Sidebar */}
        <nav
          id="sidebar"
          aria-label="Pages"
          className="sticky top-[7rem] hidden h-[calc(100dvh-7rem)] w-72 shrink-0 self-start overflow-y-auto pr-8 pb-12 pt-8 lg:block"
        >
          {SidebarList}
        </nav>

        {/* Main Content + Right TOC */}
        <main id="content-container" className="min-w-0 lg:flex-1">
          <div className="flex w-full flex-row-reverse gap-12 pt-6 lg:pt-10">
            {/* Right Table of Contents */}
            <aside
              id="content-side-layout"
              className="sticky top-[8.5rem] hidden h-[calc(100vh-9.5rem)] w-64 shrink-0 self-start xl:flex xl:flex-col"
            >
              <nav aria-label="On this page" className="space-y-2.5 pl-4 text-sm">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900 hover:text-[#155DEE]"
                >
                  <List className="h-3.5 w-3.5 text-gray-500" />
                  <span>On this page</span>
                </button>
                <ul className="space-y-2 pt-1 text-[13px] leading-5">
                  {page.sections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={`block transition-colors ${
                            isActive
                              ? 'font-medium text-[#155DEE]'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {section.heading}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Center Article Area */}
            <div
              id="content-area"
              className="box-border flex w-full min-w-0 grow flex-col px-1 lg:pl-10"
            >
              {/* Page Header */}
              <header id="header" className="space-y-2.5 leading-none">
                <div className="text-sm font-semibold text-[#155DEE]">
                  {page.eyebrow}
                </div>
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <h1
                    id="page-title"
                    className="font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl"
                  >
                    {page.title}
                  </h1>

                  {/* Copy Page Split Button */}
                  <div className="relative inline-flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="inline-flex items-center gap-2 rounded-l-xl border border-r-0 border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 whitespace-nowrap"
                    >
                      {copiedPage ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{copiedPage ? 'Copied' : 'Copy page'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopyMenuOpen((prevOpen) => !prevOpen)}
                      aria-label="More page actions"
                      aria-expanded={copyMenuOpen}
                      className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-r-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {copyMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setCopyMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={handleCopyMarkdown}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                            <span>Copy as Markdown</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCopyMenuOpen(false);
                              setMarkdownModalOpen(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                            <span>View as Markdown</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="pt-1.5 text-lg leading-7 text-gray-600">
                  {page.description}
                </p>
              </header>

              {/* Article Body */}
              <article
                id="content"
                className="mt-8 mb-14 space-y-8 text-[15px] leading-7 text-gray-600"
              >
                {page.intro && <p className="text-gray-700">{page.intro}</p>}

                {page.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-36 space-y-4"
                  >
                    <h2 className="group flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-gray-900">
                      <a
                        href={`#${section.id}`}
                        className="-ml-6 hidden pr-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex"
                        aria-label={`Navigate to ${section.heading}`}
                      >
                        <Hash className="h-4 w-4" />
                      </a>
                      <span>{section.heading}</span>
                    </h2>

                    {section.endpoint && (
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                        <MethodTag method={section.endpoint.method} />
                        <code className="font-mono text-xs font-medium text-gray-900">
                          {section.endpoint.path}
                        </code>
                        <span className="w-full text-xs text-gray-500">
                          {section.endpoint.summary}
                        </span>
                      </div>
                    )}

                    {section.paragraphs?.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-gray-600">
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && (
                      <ul className="list-disc space-y-3 pl-5 marker:text-gray-400">
                        {section.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-7 text-gray-600">
                            {bullet.href && bullet.title ? (
                              <>
                                <Link
                                  href={bullet.href}
                                  className="font-medium text-gray-900 underline decoration-[#155DEE] decoration-1 underline-offset-4 transition-colors hover:text-[#155DEE]"
                                >
                                  {bullet.title}
                                </Link>
                                <span>: {bullet.text}</span>
                              </>
                            ) : bullet.title ? (
                              <>
                                <strong className="font-semibold text-gray-900">
                                  {bullet.title}:
                                </strong>{' '}
                                <span>{bullet.text}</span>
                              </>
                            ) : (
                              <span>{bullet.text}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.codeBlock && (
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950 text-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2 text-xs text-gray-400">
                          <span className="font-mono">
                            {section.codeBlock.filename || section.codeBlock.language}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyCode(
                                `${section.id}-code`,
                                section.codeBlock!.code
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            {copiedCodeId === `${section.id}-code` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-gray-100">
                          <code>{section.codeBlock.code}</code>
                        </pre>
                      </div>
                    )}
                  </section>
                ))}
              </article>

              {/* Feedback Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-12">
                <p className="whitespace-nowrap text-sm text-gray-600">
                  {feedbackVote
                    ? 'Thanks for your feedback!'
                    : 'Was this page helpful?'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackVote('yes')}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                      feedbackVote === 'yes'
                        ? 'border-[#155DEE] bg-[#155DEE]/5 text-[#155DEE]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Yes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackVote('no')}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                      feedbackVote === 'no'
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>No</span>
                  </button>
                </div>
              </div>

              {/* Previous / Next Pagination */}
              {(prev || next) && (
                <nav
                  id="pagination"
                  aria-label="Pagination"
                  className="flex items-center justify-between gap-6 pb-10 text-sm font-semibold text-gray-700"
                >
                  {prev ? (
                    <Link
                      href={`/docs/${prev.slug}`}
                      className="group flex min-w-0 items-center gap-2 hover:text-gray-900"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-700" />
                      <span className="truncate">{prev.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}

                  {next && (
                    <Link
                      href={`/docs/${next.slug}`}
                      className="group ml-auto flex min-w-0 items-center gap-2 hover:text-gray-900"
                    >
                      <span className="truncate">{next.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-700" />
                    </Link>
                  )}
                </nav>
              )}

              {/* Footer */}
              <footer
                id="footer"
                className="flex flex-wrap items-center justify-between gap-6 border-t border-gray-100 pt-10 pb-20"
              >
                <div className="flex items-center gap-5 text-gray-400">
                  <Link
                    href="/dashboard"
                    aria-label="Cadence Website"
                    className="hover:text-gray-700"
                  >
                    <Globe className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/docs/introduction/what-is-cadence"
                    className="text-xs font-medium text-gray-500 hover:text-gray-800"
                  >
                    Documentation
                  </Link>
                  <Link
                    href="/docs/changelog/overview"
                    className="text-xs font-medium text-gray-500 hover:text-gray-800"
                  >
                    Changelog
                  </Link>
                  <Link
                    href="/docs/api-reference/v2/getting-started"
                    className="text-xs font-medium text-gray-500 hover:text-gray-800"
                  >
                    API Reference
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <span>Cadence Documentation</span>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>

      {/* Ctrl+K Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/40 p-4 pt-16 backdrop-blur-xs sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Search documentation"
          onClick={() => setSearchOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation, changelogs, CLI, or API..."
                className="w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md border border-gray-200 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 hover:bg-gray-50"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {filteredSearchResults.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No results found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredSearchResults.map((item) => (
                    <li key={item.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          router.push(`/docs/${item.slug}`);
                        }}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                      >
                        <SidebarIcon
                          icon={item.icon}
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#155DEE]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-gray-900">
                              {item.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              · {item.eyebrow}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View as Markdown Modal */}
      {markdownModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Page Markdown Source"
          onClick={() => setMarkdownModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <span className="text-sm font-semibold text-gray-900">
                {page.title} — Markdown
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copiedPage ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedPage ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMarkdownModalOpen(false)}
                  aria-label="Close markdown preview"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-gray-50 p-5 font-mono text-xs leading-6 whitespace-pre-wrap text-gray-800">
              {page.markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
