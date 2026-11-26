export type DocsTabId = 'documentation' | 'changelog' | 'cli' | 'api-reference';

export interface DocsTocItem {
  id: string;
  title: string;
  depth?: 2 | 3;
}

export interface DocsCodeBlock {
  language: string;
  filename?: string;
  code: string;
}

export interface DocsEndpointMeta {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
}

export interface DocsBulletItem {
  title?: string;
  href?: string;
  text: string;
}

export interface DocsSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: DocsBulletItem[];
  codeBlock?: DocsCodeBlock;
  endpoint?: DocsEndpointMeta;
}

export interface DocsPageEntry {
  slug: string;
  tab: DocsTabId;
  eyebrow: string;
  sidebarGroup: string;
  title: string;
  sidebarTitle?: string;
  description: string;
  icon: 'clock' | 'calendar' | 'book' | 'rocket' | 'terminal' | 'code' | 'lock' | 'bot' | 'layers' | 'mic';
  intro?: string;
  sections: DocsSection[];
  markdown: string;
}

export interface DocsSidebarGroup {
  group: string;
  icon: 'clock' | 'calendar' | 'book' | 'rocket' | 'terminal' | 'code';
  pages: Array<{
    slug: string;
    title: string;
    icon: DocsPageEntry['icon'];
    method?: DocsEndpointMeta['method'];
  }>;
}

export interface DocsTabConfig {
  id: DocsTabId;
  label: string;
  defaultSlug: string;
  groups: DocsSidebarGroup[];
}

interface MonthlyChangelogSeed {
  slug: string;
  year: '2026' | '2025' | '2024' | '2023';
  title: string;
  summary: string;
  highlights: {
    features: string[];
    improvements: string[];
    fixes: string[];
  };
}

const MONTHLY_CHANGELOGS: MonthlyChangelogSeed[] = [
  {
    slug: 'changelog/2026-november',
    year: '2026',
    title: 'November 2026',
    summary:
      'Visitors who email a conversation to themselves, files in a team reply on the website, WhatsApp, Messenger, and email, a public page that explains how to delete your account, a 6-digit sign-in code in the sign-in email, large files that train again, one 25 MB limit for each file, uploads and website links of PDF, Word, PowerPoint, and Excel files up to 1 GB, text recognition for scanned PDFs, also over 25 MB, chatbot transfers that the new owner accepts, the same link check for answers on every channel, answers that cite the page they used, a reason in plain words for more failed sources, CLI hints that fit the error and name the wait after a rate limit, the name of the team member on each team reply, WhatsApp replies that show the message they answer, an Auto Sync page that lists sources with no schedule, webhook verification that turns itself on, WhatsApp files that open from Cadence’s copy in the API and in exports, deletion dates in Chat History for accounts with a custom retention period, sign-in that works when an email security service opens your links first, no empty escalation buttons, a dark “Verify you are human” box in dark mode, conversations, leads, files, and text closed to the API in HIPAA workspaces, an iOS app where your team can report AI answers and that works in HIPAA workspaces, one document for a page at more than one address, pages that sites hide from automated visitors, no Messenger answers for another Facebook Page, plan locks that tell team members whom to ask, and handoff messages in the visitor’s language.',
    highlights: {
      features: [
        'Visitors can email a full transcript of their voice or text conversation directly to their inbox from the widget menu.',
        'Team replies now support file attachments across the website widget, WhatsApp, Messenger, and email.',
        'Added PDF, Word, PowerPoint, and Excel ingestion up to 1 GB with OCR text recognition for scanned PDFs over 25 MB.',
        'Chatbot ownership transfers with explicit acceptance by the receiving workspace owner.',
        'Citations on every AI answer showing the exact source page or knowledge document used.',
      ],
      improvements: [
        'Plain-language failure diagnostics for failed crawl URLs and document ingestion jobs.',
        'CLI error hints now show exact retry-after wait times when hitting API rate limits.',
        'Auto Sync page highlights connected sources that do not yet have a refresh schedule configured.',
        'Handoff and escalation prompts automatically localize to the visitor’s detected language.',
      ],
      fixes: [
        'Prevented email security link scanners from consuming single-use magic sign-in links.',
        'Resolved duplicate knowledge entries when the same canonical page is reachable via multiple URLs.',
        'Fixed empty escalation buttons when human handoff hours are disabled.',
      ],
    },
  },
  {
    slug: 'changelog/2026-october',
    year: '2026',
    title: 'October 2026',
    summary:
      'Working hours for new conversations, lead emails for returning visitors, a clear invitation email that you can send again, locking a conversation from the menu, a Cadence home view, settings tools that show working hours, replies to visitors, and read-only connections in the MCP server, chatbot lists without a 100 cap, conversations and leads closed on the MCP servers in HIPAA workspaces, the source of each conversation in Chat History, sign-in links that email security tools cannot use up, a Chat Modes option that lets the visitor choose the AI or a person, WhatsApp photos in Chat History, accepting or declining invites on the dashboard, answers that no longer wait for follow-up suggestions, a length limit with a count in the chat, Allowed Domains for the hosted chat page, a hand-off to your team that follows your team’s hours, AI answers by email with drafts for your team, replies from the dashboard to Messenger, your own footer for AI email replies, a list of the emails that the AI did not answer, WhatsApp files that Cadence keeps, pasted link lists that repair themselves, Messenger messages that Facebook refused marked in Chat History, Messenger connections that check each message, sign-in help for your mailbox, API v2 content errors with their real status, and a new sign-in link from the check-your-email page.',
    highlights: {
      features: [
        'Working hours schedule for live agent handoff and new conversation routing.',
        'Chat Modes selector allowing visitors to choose AI assistance or wait for a human teammate.',
        'AI email drafts and customizable footers for automated email replies.',
        'Allowed Domains security control for the hosted chat and voice agent landing pages.',
      ],
      improvements: [
        'Removed the 100-chatbot pagination cap in workspace lists and MCP server responses.',
        'Streaming AI answers render immediately without waiting for follow-up question generation.',
        'Added conversation channel source badges directly in Chat History.',
      ],
      fixes: [
        'Auto-repair malformed URLs when pasting bulk link lists into Knowledge Sources.',
        'API v2 knowledge endpoints now return exact upstream status codes on content validation errors.',
      ],
    },
  },
  {
    slug: 'changelog/2026-september',
    year: '2026',
    title: 'September 2026',
    summary:
      'WhatsApp, your own escalation rules, custom responses and text snippets that take priority in answers, and more accurate widget open counts.',
    highlights: {
      features: [
        'Native WhatsApp Business channel integration for automated and human-assisted replies.',
        'Configurable escalation rules based on intent, sentiment, or keyword triggers.',
        'Priority weighting for Custom Responses and curated Q&A snippets over crawled pages.',
      ],
      improvements: [
        'More accurate widget open and engagement analytics excluding prefetch and bot hits.',
      ],
      fixes: [
        'Fixed duplicate session events when visitors switch tabs with the widget open.',
      ],
    },
  },
  {
    slug: 'changelog/2026-august',
    year: '2026',
    title: 'August 2026',
    summary:
      'Take over and close conversations, control where the widget shows, and new developer tools.',
    highlights: {
      features: [
        'One-click conversation takeover and thread resolution directly inside the agent inbox.',
        'URL path include/exclude rules to control exactly where the embed widget appears.',
      ],
      improvements: [
        'Expanded developer webhook payloads with full transcript metadata and agent IDs.',
      ],
      fixes: [
        'Fixed mobile viewport scroll locking when closing the embedded voice launcher.',
      ],
    },
  },
  {
    slug: 'changelog/2026-july',
    year: '2026',
    title: 'July 2026',
    summary:
      'The iPhone app, a new Analytics page, a redesigned chat history, and one-click Slack and Crisp apps.',
    highlights: {
      features: [
        'Redesigned Usage & Analytics dashboard with conversation volume, resolution rate, and latency breakdowns.',
        'One-click Slack and Crisp integrations for real-time team notifications and handoff.',
      ],
      improvements: [
        'Faster Chat History search with channel, date range, and sentiment filters.',
      ],
      fixes: [
        'Resolved timezone offset inconsistencies in daily analytics rollups.',
      ],
    },
  },
  {
    slug: 'changelog/2026-june',
    year: '2026',
    title: 'June 2026',
    summary:
      'Widget events for your analytics tools and new API v2 endpoints for chatbot ownership and members.',
    highlights: {
      features: [
        'Client-side widget lifecycle events (`cadence:open`, `cadence:message`, `cadence:lead`) for analytics pipelines.',
        'API v2 endpoints for workspace member invitations and role management.',
      ],
      improvements: [
        'Reduced initial widget bundle size by 28% for faster host page loads.',
      ],
      fixes: [
        'Fixed CORS preflight caching on custom-domain API v2 requests.',
      ],
    },
  },
  {
    slug: 'changelog/2026-may',
    year: '2026',
    title: 'May 2026',
    summary:
      'A new API, the Cadence CLI, and an MCP server so AI agents can build and manage chatbots.',
    highlights: {
      features: [
        'Launched API v2 with scoped personal access tokens and OpenAPI 3.1 specification.',
        'Released the Cadence CLI for terminal-based chatbot creation, training, and sync automation.',
        'Introduced the Cadence MCP server for programmatic chatbot orchestration.',
      ],
      improvements: [
        'Unified error envelope across all API v2 routes with structured `requestId` diagnostics.',
      ],
      fixes: [
        'Fixed webhook signature verification headers on retried delivery attempts.',
      ],
    },
  },
  {
    slug: 'changelog/2026-april',
    year: '2026',
    title: 'April 2026',
    summary: 'Cadence on the Zendesk Marketplace and a new SDK command to open a fresh chat.',
    highlights: {
      features: [
        'Official Zendesk Marketplace integration for seamless ticket creation and context sync.',
        'Added `window.Cadence.startNewChat()` SDK method to reset conversations programmatically.',
      ],
      improvements: [
        'Improved voice turn-taking detection in noisy microphone environments.',
      ],
      fixes: [
        'Fixed Zendesk macro sync when custom ticket fields contain commas.',
      ],
    },
  },
  {
    slug: 'changelog/2026-march',
    year: '2026',
    title: 'March 2026',
    summary: 'New-conversation emails, the page URL on every conversation, and more widget translations.',
    highlights: {
      features: [
        'Instant email alerts when a visitor starts a new conversation with your chatbot.',
        'Automatic capture of the referring page URL in Conversation Logs.',
      ],
      improvements: [
        'Added 14 new interface translations for the embedded chat and voice widget.',
      ],
      fixes: [
        'Fixed RTL text alignment in Arabic and Hebrew widget message bubbles.',
      ],
    },
  },
  {
    slug: 'changelog/2026-february',
    year: '2026',
    title: 'February 2026',
    summary: 'Escalation after a lead form, a square chat icon option, and many lead form fixes.',
    highlights: {
      features: [
        'Automatic human escalation flow triggered immediately upon lead form submission.',
        'Square and rounded-square launcher button geometry options in Embed customization.',
      ],
      improvements: [
        'Accessible keyboard navigation and error validation announcements on lead capture forms.',
      ],
      fixes: [
        'Fixed optional phone number validation rejecting international `+` prefixes.',
      ],
    },
  },
  {
    slug: 'changelog/2026-january',
    year: '2026',
    title: 'January 2026',
    summary: 'New consent and disclaimer settings, page context, cleaner website imports, and new chat history tools.',
    highlights: {
      features: [
        'Configurable GDPR consent checkbox and AI disclosure banner prior to starting a session.',
        'Automatic current-page context awareness so answers reflect the page the visitor is reading.',
      ],
      improvements: [
        'Smarter HTML boilerplate stripping during website crawls for cleaner vector chunks.',
      ],
      fixes: [
        'Fixed CSV export escaping for multi-line transcripts containing quotes.',
      ],
    },
  },
  {
    slug: 'changelog/2025-december',
    year: '2025',
    title: 'December 2025',
    summary: 'GitHub auto-sync, new widget header options, a conversation download button, and a faster-loading widget.',
    highlights: {
      features: [
        'Scheduled GitHub repository auto-sync for markdown docs and README knowledge bases.',
        'Visitor conversation transcript download button in the widget header.',
      ],
      improvements: [
        'Lazy-loaded secondary widget assets to keep Time-to-Interactive near zero.',
      ],
      fixes: [
        'Fixed header logo clipping on narrow mobile viewports.',
      ],
    },
  },
  {
    slug: 'changelog/2025-november',
    year: '2025',
    title: 'November 2025',
    summary: 'The GitHub connector, sitemap auto scan, allowed domains for crawls, and a smoother file upload.',
    highlights: {
      features: [
        'GitHub Docs connector supporting branch selection and folder filtering.',
        'Automatic XML sitemap discovery and allowed-domain crawl boundaries.',
      ],
      improvements: [
        'Resumable chunked uploads for large PDF and DOCX knowledge packs.',
      ],
      fixes: [
        'Fixed sitemap index recursion when nested sitemaps use relative URLs.',
      ],
    },
  },
  {
    slug: 'changelog/2025-october',
    year: '2025',
    title: 'October 2025',
    summary: 'Scheduled auto-sync, a new widget design with dark mode, and new widget SDK commands.',
    highlights: {
      features: [
        'Daily and weekly automated re-sync schedules for website and file knowledge sources.',
        'Adaptive light/dark widget theme support matching host site preferences.',
      ],
      improvements: [
        'Added `open()`, `close()`, and `toggle()` methods to the client embed SDK.',
      ],
      fixes: [
        'Fixed dark-mode link contrast inside markdown code blocks.',
      ],
    },
  },
  {
    slug: 'changelog/2025-september',
    year: '2025',
    title: 'September 2025',
    summary: 'YouTube videos as content, AI-driven lead collection, and faster tools for managing links and files.',
    highlights: {
      features: [
        'YouTube video URL ingestion using automatic transcript extraction.',
        'Conversational AI lead qualification that naturally gathers contact details mid-chat.',
      ],
      improvements: [
        'Redesigned knowledge table with instant status filtering and search.',
      ],
      fixes: [
        'Fixed transcript parsing on YouTube Shorts and unlisted video links.',
      ],
    },
  },
  {
    slug: 'changelog/2025-august',
    year: '2025',
    title: 'August 2025',
    summary: 'Auto-open, mobile position settings, the Continue with AI button, and bulk actions for links and files.',
    highlights: {
      features: [
        'Configurable auto-open delay and independent mobile corner positioning.',
        'Bulk select, re-sync, and delete actions across Knowledge Sources.',
      ],
      improvements: [
        'Added "Continue with AI" prompt chips below documentation summaries.',
      ],
      fixes: [
        'Prevented auto-open from re-triggering after a visitor explicitly dismissed the widget.',
      ],
    },
  },
  {
    slug: 'changelog/2025-july',
    year: '2025',
    title: 'July 2025',
    summary: 'The WordPress plugin, upgraded Gemini & GPT model answers, and clearer links and files pages.',
    highlights: {
      features: [
        'Official WordPress plugin for zero-code widget installation.',
        'Next-generation reasoning models available per agent in Voice & Chat configuration.',
      ],
      improvements: [
        'Clearer token & character counts per indexed document in Knowledge Sources.',
      ],
      fixes: [
        'Fixed WordPress multisite option saving for sub-blogs.',
      ],
    },
  },
  {
    slug: 'changelog/2025-june',
    year: '2025',
    title: 'June 2025',
    summary: 'A cleaner chat window header and fixes for chat history export and suggestions.',
    highlights: {
      features: [
        'Streamlined chat window header with crisp agent avatar and status subtitle.',
      ],
      improvements: [
        'Faster JSON and CSV export generation for workspaces with over 50,000 messages.',
      ],
      fixes: [
        'Fixed starter suggestion chips wrapping unevenly on Safari.',
      ],
    },
  },
  {
    slug: 'changelog/2025-may',
    year: '2025',
    title: 'May 2025',
    summary: 'Markdown in the chatbot description, plus fixes for the chat button and resync.',
    highlights: {
      features: [
        'Rich Markdown links and formatting inside chatbot welcome descriptions.',
      ],
      improvements: [
        'More resilient batch resync queuing for workspaces with hundreds of URLs.',
      ],
      fixes: [
        'Fixed floating launcher z-index collision with full-screen navigation drawers.',
      ],
    },
  },
  {
    slug: 'changelog/2025-april',
    year: '2025',
    title: 'April 2025',
    summary: 'Open and close the chat from your own code, and hide the chat button.',
    highlights: {
      features: [
        'Headless launcher mode allowing custom site buttons to trigger the Cadence widget.',
      ],
      improvements: [
        'Added `hideLauncher` embed configuration flag.',
      ],
      fixes: [
        'Fixed keyboard Escape shortcut not returning focus to the trigger button.',
      ],
    },
  },
  {
    slug: 'changelog/2025-march',
    year: '2025',
    title: 'March 2025',
    summary: 'A faster main dashboard, a clearer delete confirmation, and a billing fix.',
    highlights: {
      features: [
        'Instant dashboard skeleton loading and cached agent metadata.',
      ],
      improvements: [
        'Explicit typed confirmation dialog before permanently deleting an agent.',
      ],
      fixes: [
        'Fixed prorated invoice preview when upgrading billing tiers mid-cycle.',
      ],
    },
  },
  {
    slug: 'changelog/2025-february',
    year: '2025',
    title: 'February 2025',
    summary: 'Delete leads, page through long lead lists, and several billing and content fixes.',
    highlights: {
      features: [
        'Bulk and individual lead deletion with instant workspace sync.',
        'Cursor-based pagination for high-volume lead tables.',
      ],
      improvements: [
        'Improved PDF table extraction accuracy for pricing sheets.',
      ],
      fixes: [
        'Fixed billing email receipt delivery when updated in Profile.',
      ],
    },
  },
  {
    slug: 'changelog/2025-january',
    year: '2025',
    title: 'January 2025',
    summary: 'A new website crawler, 12 months of usage history, and a fix for file uploads.',
    highlights: {
      features: [
        'Headless JavaScript-aware website crawler for SPA documentation sites.',
        '12-month historical usage breakdown for messages, voice minutes, and training tokens.',
      ],
      improvements: [
        'Parallelized embedding indexing for 3x faster initial training.',
      ],
      fixes: [
        'Fixed UTF-8 BOM handling in uploaded CSV and TXT files.',
      ],
    },
  },
  {
    slug: 'changelog/2024-december',
    year: '2024',
    title: 'December 2024',
    summary: 'Apple Pay domain verification for checkout.',
    highlights: {
      features: ['Apple Pay and Express Checkout domain verification support on Billing.'],
      improvements: ['Faster checkout redirect handling on iOS Safari.'],
      fixes: ['Resolved duplicate invoice webhook events during 3DS confirmation.'],
    },
  },
  {
    slug: 'changelog/2024-november',
    year: '2024',
    title: 'November 2024',
    summary: 'A fix for garbled answers at very low temperature.',
    highlights: {
      features: ['Minimum temperature clamping safeguards for deterministic responses.'],
      improvements: ['Lowered voice response first-byte latency by 120ms.'],
      fixes: ['Fixed token repetition artifacts when temperature was set to 0.0.'],
    },
  },
  {
    slug: 'changelog/2024-october',
    year: '2024',
    title: 'October 2024',
    summary: 'A faster chat history and fixes for the leads and custom responses pages.',
    highlights: {
      features: ['Instant virtualized scrolling in Conversation Logs.'],
      improvements: ['Faster regex matching in Custom Responses.'],
      fixes: ['Fixed lead CSV export missing custom form fields.'],
    },
  },
  {
    slug: 'changelog/2024-september',
    year: '2024',
    title: 'September 2024',
    summary: 'A fix for adding many links at once.',
    highlights: {
      features: ['Batch URL importer supporting up to 500 links per submission.'],
      improvements: ['Clearer validation preview before starting batch crawls.'],
      fixes: ['Fixed timeout when queuing large URL batches from slow sitemaps.'],
    },
  },
  {
    slug: 'changelog/2024-august',
    year: '2024',
    title: 'August 2024',
    summary: 'The Zoho SalesIQ integration, automatic tags from conversation starters, and upgraded multimodal models.',
    highlights: {
      features: ['Zoho SalesIQ handoff integration and automatic conversation tagging.'],
      improvements: ['Added conversation starter analytics attribution.'],
      fixes: ['Fixed duplicate tags when visitors click multiple starter prompts rapidly.'],
    },
  },
  {
    slug: 'changelog/2024-july',
    year: '2024',
    title: 'July 2024',
    summary: 'Human support handoff, fast mini models, a setting for the number of smart follow-ups, and a change to cancellation.',
    highlights: {
      features: ['Live human support handoff queue and configurable follow-up question count.'],
      improvements: ['Sub-second streaming with lightweight inference models.'],
      fixes: ['Fixed subscription cancellation grace-period display on Billing.'],
    },
  },
  {
    slug: 'changelog/2024-june',
    year: '2024',
    title: 'June 2024',
    summary: 'Forward new leads by webhook and email, lead notification settings, and Intercom as a content source.',
    highlights: {
      features: ['Intercom Help Center importer and real-time lead forwarding webhooks.'],
      improvements: ['Per-chatbot email notification toggles for newly captured leads.'],
      fixes: ['Fixed Intercom pagination skipping articles in nested collections.'],
    },
  },
  {
    slug: 'changelog/2024-may',
    year: '2024',
    title: 'May 2024',
    summary: 'New content sources on the Files page, updated models, widget embedding options, and a create conversation API.',
    highlights: {
      features: ['Create Conversation REST endpoint and inline iframe embed mode.'],
      improvements: ['Unified file drag-and-drop uploader across all agent workspaces.'],
      fixes: ['Fixed iframe height resizing inside single-page React applications.'],
    },
  },
  {
    slug: 'changelog/2024-april',
    year: '2024',
    title: 'April 2024',
    summary: 'Conversation tags, archived leads, an escalation webhook, and expanded context models.',
    highlights: {
      features: ['Escalation webhook trigger, conversation tags, and archived leads filter.'],
      improvements: ['Expanded context window support for long technical manuals.'],
      fixes: ['Fixed tag filter reset when navigating between chatbots.'],
    },
  },
  {
    slug: 'changelog/2024-march',
    year: '2024',
    title: 'March 2024',
    summary: 'Slack, Freshdesk, and Zendesk integrations, a widget tooltip, and unread message counts.',
    highlights: {
      features: ['Slack, Freshdesk, and Zendesk integrations plus proactive launcher tooltips.'],
      improvements: ['Unread message badge counter on collapsed widget buttons.'],
      fixes: ['Fixed tooltip dismissal state persistence in sessionStorage.'],
    },
  },
  {
    slug: 'changelog/2024-february',
    year: '2024',
    title: 'February 2024',
    summary: 'Control which parts of web pages the chatbot learns from, cleaner training, and newer models.',
    highlights: {
      features: ['CSS selector include/exclude rules for fine-grained web scraping.'],
      improvements: ['Stripped cookie banners and navigation sidebars during indexing.'],
      fixes: ['Fixed relative anchor links inside scraped knowledge chunks.'],
    },
  },
  {
    slug: 'changelog/2024-january',
    year: '2024',
    title: 'January 2024',
    summary: 'The white-label program, retraining all links at once, and more accurate links in answers.',
    highlights: {
      features: ['Agency white-label branding and one-click retrain-all action.'],
      improvements: ['Higher citation accuracy when answers reference deep anchor sections.'],
      fixes: ['Fixed stale favicon cache on white-labeled custom domains.'],
    },
  },
  {
    slug: 'changelog/2023-december',
    year: '2023',
    title: 'December 2023',
    summary: 'Leads, personas, prompts, the Playground, Notion, and a redesigned chat history.',
    highlights: {
      features: ['Lead capture forms, custom system prompts, Notion sync, and interactive Playground.'],
      improvements: ['Split-pane Conversation Logs inspector with full turn metadata.'],
      fixes: ['Fixed Notion workspace OAuth token refresh on long-running syncs.'],
    },
  },
  {
    slug: 'changelog/2023-november',
    year: '2023',
    title: 'November 2023',
    summary: 'A Usage page, Box, Dropbox, and SharePoint connectors, and new chat widget options.',
    highlights: {
      features: ['Dedicated Usage & Quota dashboard and Box, Dropbox, and SharePoint connectors.'],
      improvements: ['Customizable widget header colors and font sizing.'],
      fixes: ['Fixed SharePoint folder pagination for libraries over 200 files.'],
    },
  },
  {
    slug: 'changelog/2023-october',
    year: '2023',
    title: 'October 2023',
    summary: 'Crisp integration, smarter follow-up questions, live chat history, and usage meters.',
    highlights: {
      features: ['Crisp live chat bridge and AI-suggested follow-up prompts.'],
      improvements: ['Real-time message streaming into Conversation Logs.'],
      fixes: ['Fixed usage meter rounding for workspaces on custom quotas.'],
    },
  },
  {
    slug: 'changelog/2023-september',
    year: '2023',
    title: 'September 2023',
    summary: 'Team members, Messenger, Google Drive and OneDrive, and a Q&A page to improve answers.',
    highlights: {
      features: ['Multi-seat team invitations, Google Drive / OneDrive connectors, and Q&A training.'],
      improvements: ['Direct Q&A pair editing from flagged conversation turns.'],
      fixes: ['Fixed Google Drive shared drive permissions check during sync.'],
    },
  },
  {
    slug: 'changelog/2023-august',
    year: '2023',
    title: 'August 2023',
    summary: 'Google Chat integration, CSV export of chat history, and agent profile pictures.',
    highlights: {
      features: ['Google Chat bot integration, CSV transcript exports, and custom agent avatars.'],
      improvements: ['Faster avatar image compression on upload.'],
      fixes: ['Fixed missing timestamps in exported CSV logs.'],
    },
  },
  {
    slug: 'changelog/2023-july',
    year: '2023',
    title: 'July 2023',
    summary: 'File uploads, your own text as content, and a new chat history with filters.',
    highlights: {
      features: ['PDF/DOCX/TXT file uploads and raw pasted text knowledge blocks.'],
      improvements: ['Date and rating filters in Conversation Logs.'],
      fixes: ['Fixed password-protected PDF detection returning generic errors.'],
    },
  },
  {
    slug: 'changelog/2023-june',
    year: '2023',
    title: 'June 2023',
    summary: 'A new chat widget with human handoff, the first public API, and new appearance options.',
    highlights: {
      features: ['Public REST API v1 and widget appearance customization controls.'],
      improvements: ['Smooth transition animations when opening and minimizing the widget.'],
      fixes: ['Fixed widget scroll jump on iOS Safari keyboards.'],
    },
  },
  {
    slug: 'changelog/2023-may',
    year: '2023',
    title: 'May 2023',
    summary: 'Step-by-step flow to create a chatbot, advanced reasoning models, and separate icons for the chatbot and human agents.',
    highlights: {
      features: ['Guided 4-step chatbot creation wizard and distinct AI vs human reply avatars.'],
      improvements: ['Higher answer grounding strictness to prevent off-topic hallucinations.'],
      fixes: ['Fixed wizard state loss when navigating back to URL selection.'],
    },
  },
  {
    slug: 'changelog/2023-april',
    year: '2023',
    title: 'April 2023',
    summary: 'Streaming answers, sitemap support, a new dashboard, and more ways to style the chat widget.',
    highlights: {
      features: ['Token-by-token streaming responses and XML sitemap ingestion.'],
      improvements: ['Refreshed chatbot overview cards with quick embed copy.'],
      fixes: ['Fixed sitemap URL deduplication with trailing slashes.'],
    },
  },
  {
    slug: 'changelog/2023-march',
    year: '2023',
    title: 'March 2023',
    summary: 'Cadence launched: create an AI voice & chat agent from your website, add it to your site, and read its conversations.',
    highlights: {
      features: [
        'Initial public launch of Cadence: crawl any website URL to build an instant AI chatbot.',
        'One-line JavaScript embed script and live Conversation Logs.',
      ],
      improvements: ['Fast onboarding from URL paste to live test chat in under 60 seconds.'],
      fixes: ['Initial stability and crawl reliability tuning.'],
    },
  },
];

function buildChangelogOverviewSections(): DocsSection[] {
  const years: Array<'2026' | '2025' | '2024' | '2023'> = ['2026', '2025', '2024', '2023'];
  return years.map((year) => ({
    id: year,
    heading: year,
    bullets: MONTHLY_CHANGELOGS.filter((item) => item.year === year).map((item) => ({
      title: item.title,
      href: `/docs/${item.slug}`,
      text: item.summary,
    })),
  }));
}

function buildChangelogOverviewMarkdown(): string {
  const years: Array<'2026' | '2025' | '2024' | '2023'> = ['2026', '2025', '2024', '2023'];
  const lines = [
    '# Changelog',
    '',
    'Find what changed in Cadence each month since March 2023.',
    '',
    'This page lists every monthly changelog page, newest first. Each entry gives a short summary of that month. Open a month to see the full list of new features, improvements, and fixes. Each page lists only changes you could see or use, based on what shipped that month.',
  ];
  for (const year of years) {
    lines.push('', `## ${year}`, '');
    for (const item of MONTHLY_CHANGELOGS.filter((m) => m.year === year)) {
      lines.push(`- [${item.title}](/docs/${item.slug}): ${item.summary}`);
    }
  }
  return lines.join('\n');
}

const MONTHLY_PAGES: DocsPageEntry[] = MONTHLY_CHANGELOGS.map((month) => ({
  slug: month.slug,
  tab: 'changelog',
  eyebrow: month.year,
  sidebarGroup: month.year,
  title: month.title,
  description: month.summary,
  icon: 'calendar',
  intro: `Full release summary for ${month.title}, covering new capabilities, platform improvements, and bug fixes shipped across Cadence.`,
  sections: [
    {
      id: 'new-features',
      heading: 'New features',
      bullets: month.highlights.features.map((text) => ({ text })),
    },
    {
      id: 'improvements',
      heading: 'Improvements',
      bullets: month.highlights.improvements.map((text) => ({ text })),
    },
    {
      id: 'fixes',
      heading: 'Fixes',
      bullets: month.highlights.fixes.map((text) => ({ text })),
    },
  ],
  markdown: [
    `# ${month.title}`,
    '',
    month.summary,
    '',
    '## New features',
    ...month.highlights.features.map((f) => `- ${f}`),
    '',
    '## Improvements',
    ...month.highlights.improvements.map((i) => `- ${i}`),
    '',
    '## Fixes',
    ...month.highlights.fixes.map((x) => `- ${x}`),
  ].join('\n'),
}));

const DOCUMENTATION_PAGES: DocsPageEntry[] = [
  {
    slug: 'introduction/what-is-cadence',
    tab: 'documentation',
    eyebrow: 'Get Started',
    sidebarGroup: 'Get Started',
    title: 'What is Cadence?',
    description: 'Build grounded AI voice and chat agents trained on your website, docs, and files.',
    icon: 'book',
    intro:
      'Cadence transforms your help center, product documentation, PDFs, and web pages into an interactive AI voice and chat agent you can test in real time and embed on any website in minutes.',
    sections: [
      {
        id: 'core-capabilities',
        heading: 'Core capabilities',
        bullets: [
          {
            title: 'Grounded Website & File Training',
            text: 'Crawl URLs, XML sitemaps, or upload documents so every reply is grounded in your verified source material.',
          },
          {
            title: 'Real-Time Voice & Text Chat',
            text: 'Run low-latency voice simulations or deploy a responsive chat widget directly on your marketing or product pages.',
          },
          {
            title: 'Lead Capture & Analytics',
            text: 'Collect qualified inbound leads mid-conversation and review conversation transcripts, latency, and resolution metrics.',
          },
        ],
      },
      {
        id: 'how-it-works',
        heading: 'How it works',
        paragraphs: [
          'Every chatbot workspace combines a curated Knowledge Base, a customizable persona and voice profile, and an embeddable widget script. Updates pushed to your knowledge sources re-index automatically without redeploying your site.',
        ],
      },
    ],
    markdown: `# What is Cadence?\n\nBuild grounded AI voice and chat agents trained on your website, docs, and files.\n\n## Core capabilities\n- Grounded Website & File Training\n- Real-Time Voice & Text Chat\n- Lead Capture & Analytics`,
  },
  {
    slug: 'introduction/quickstart',
    tab: 'documentation',
    eyebrow: 'Get Started',
    sidebarGroup: 'Get Started',
    title: 'Quickstart',
    description: 'Create, train, test, and embed your first Cadence chatbot in under five minutes.',
    icon: 'rocket',
    intro: 'Follow these four steps to go from an empty workspace to a live embedded agent on your site.',
    sections: [
      {
        id: 'step-1-create',
        heading: '1. Create a chatbot',
        paragraphs: [
          'Open the Chatbots hub and click Create New Chatbot. Choose a name, language, and primary tone for your agent.',
        ],
      },
      {
        id: 'step-2-train',
        heading: '2. Add knowledge sources',
        paragraphs: [
          'Paste your website URL, upload PDF or Markdown files, or add custom Q&A pairs under Knowledge Sources so your agent answers accurately.',
        ],
      },
      {
        id: 'step-3-test',
        heading: '3. Test voice and chat',
        paragraphs: [
          'Use the built-in Playground and Voice Chat Test to inspect source citations, adjust response length, and verify tone before publishing.',
        ],
      },
      {
        id: 'step-4-embed',
        heading: '4. Embed on your site',
        paragraphs: [
          'Copy your unique embed script from the chatbot card or Embed & Install page and paste it before the closing </body> tag.',
        ],
        codeBlock: {
          language: 'html',
          filename: 'index.html',
          code: `<script\n  src="https://cadence.ai/widget.js"\n  data-agent-id="YOUR_CHATBOT_ID"\n  async\n></script>`,
        },
      },
    ],
    markdown: `# Quickstart\n\n1. Create a chatbot\n2. Add knowledge sources\n3. Test voice and chat\n4. Embed on your site`,
  },
  {
    slug: 'guides/voice-agents',
    tab: 'documentation',
    eyebrow: 'Guides',
    sidebarGroup: 'Guides',
    title: 'Voice & Persona Tuning',
    description: 'Configure speech responsiveness, custom system prompts, and conversational guardrails.',
    icon: 'mic',
    intro:
      'Fine-tune how your Cadence agent greets callers, handles uncertain questions, and escalates complex tickets to human teammates.',
    sections: [
      {
        id: 'system-instructions',
        heading: 'System instructions',
        paragraphs: [
          'Define clear rules for formatting, escalation triggers, and fallback phrasing when an answer is outside your knowledge base.',
        ],
      },
      {
        id: 'voice-testing',
        heading: 'Live voice simulator',
        paragraphs: [
          'Run microphone-based end-to-end tests inside Voice Chat Test to measure turn-taking latency and pronunciation of brand terms.',
        ],
      },
    ],
    markdown: `# Voice & Persona Tuning\n\nConfigure speech responsiveness, custom system prompts, and conversational guardrails.`,
  },
  {
    slug: 'guides/knowledge-sync',
    tab: 'documentation',
    eyebrow: 'Guides',
    sidebarGroup: 'Guides',
    title: 'Knowledge Sources & Sync',
    description: 'Keep your chatbot up to date with automated website crawling and file indexing.',
    icon: 'layers',
    intro:
      'Cadence supports single URLs, XML sitemaps, raw text snippets, and file uploads. Configure scheduled syncs so your documentation stays accurate automatically.',
    sections: [
      {
        id: 'supported-sources',
        heading: 'Supported content types',
        bullets: [
          { title: 'Websites & Sitemaps', text: 'Automatically discover sub-pages and strip navigation boilerplate.' },
          { title: 'Documents', text: 'Upload PDF, DOCX, TXT, and Markdown files up to 25 MB per file.' },
          { title: 'Custom Q&A', text: 'Override general answers with verified, high-priority question and answer pairs.' },
        ],
      },
    ],
    markdown: `# Knowledge Sources & Sync\n\nKeep your chatbot up to date with automated website crawling and file indexing.`,
  },
  {
    slug: 'guides/embed-sdk',
    tab: 'documentation',
    eyebrow: 'Guides',
    sidebarGroup: 'Guides',
    title: 'Website Widget & SDK',
    description: 'Programmatically open, close, and listen to events from the embedded Cadence widget.',
    icon: 'code',
    intro: 'Control the Cadence chat widget from your own React, Next.js, or vanilla JavaScript application.',
    sections: [
      {
        id: 'sdk-methods',
        heading: 'JavaScript SDK methods',
        codeBlock: {
          language: 'typescript',
          filename: 'widget-controls.ts',
          code: `// Open the widget drawer from a custom button\nwindow.Cadence?.open();\n\n// Start a clean conversation thread\nwindow.Cadence?.startNewChat();\n\n// Close the widget programmatically\nwindow.Cadence?.close();`,
        },
      },
    ],
    markdown: `# Website Widget & SDK\n\nProgrammatically open, close, and listen to events from the embedded Cadence widget.`,
  },
];

const CLI_PAGES: DocsPageEntry[] = [
  {
    slug: 'cli/overview',
    tab: 'cli',
    eyebrow: 'CLI',
    sidebarGroup: 'Cadence CLI',
    title: 'CLI Overview',
    description: 'Build, train, and manage your Cadence chatbots and knowledge sources from the terminal.',
    icon: 'terminal',
    intro:
      'The Cadence CLI brings chatbot creation, sitemap synchronization, and conversation exports directly into your CI/CD pipelines and local workflow.',
    sections: [
      {
        id: 'installation',
        heading: 'Installation',
        paragraphs: ['Install the CLI globally via npm or run commands directly with npx:'],
        codeBlock: {
          language: 'bash',
          code: `npm install -g @cadence-ai/cli\ncadence --version`,
        },
      },
      {
        id: 'authentication',
        heading: 'Authenticate your workspace',
        paragraphs: ['Authenticate using a workspace API v2 token from your Account Settings:'],
        codeBlock: {
          language: 'bash',
          code: `cadence login --token cad_live_xxxxxxxxxxxxxxxx\ncadence chatbots list`,
        },
      },
    ],
    markdown: `# CLI Overview\n\nBuild, train, and manage your Cadence chatbots from the terminal.\n\n\`\`\`bash\nnpm install -g @cadence-ai/cli\ncadence login --token cad_live_xxx\n\`\`\``,
  },
  {
    slug: 'cli/sync-and-deploy',
    tab: 'cli',
    eyebrow: 'CLI',
    sidebarGroup: 'Cadence CLI',
    title: 'Syncing Knowledge & CI',
    description: 'Trigger automated doc re-indexing whenever your repository merges to main.',
    icon: 'terminal',
    intro: 'Integrate `cadence knowledge sync` into GitHub Actions or release scripts so documentation changes go live immediately.',
    sections: [
      {
        id: 'ci-example',
        heading: 'Sync command reference',
        codeBlock: {
          language: 'bash',
          code: `cadence knowledge add-sitemap \\\n  --chatbot bot_01J9X \\\n  --url https://docs.example.com/sitemap.xml\n\ncadence knowledge resync --chatbot bot_01J9X --wait`,
        },
      },
    ],
    markdown: `# Syncing Knowledge & CI\n\nTrigger automated doc re-indexing whenever your repository merges to main.`,
  },
];

const API_PAGES: DocsPageEntry[] = [
  {
    slug: 'api-reference/v2/getting-started',
    tab: 'api-reference',
    eyebrow: 'Get started',
    sidebarGroup: 'Get started',
    title: 'Make your first API calls',
    sidebarTitle: 'Getting started',
    description: 'Use the Cadence REST API v2 to manage chatbots, knowledge documents, and conversations.',
    icon: 'rocket',
    intro:
      'All API v2 endpoints are served over HTTPS using JSON request and response payloads. Authenticate every request with a Bearer workspace token.',
    sections: [
      {
        id: 'base-url',
        heading: 'Base URL',
        paragraphs: ['All v2 API paths are relative to the production API origin:'],
        codeBlock: {
          language: 'bash',
          code: `https://api.cadence.ai/v2`,
        },
      },
      {
        id: 'first-request',
        heading: 'Verify your token',
        paragraphs: ['Call the chatbots list endpoint to confirm authentication:'],
        codeBlock: {
          language: 'bash',
          code: `curl -X GET "https://api.cadence.ai/v2/chatbots" \\\n  -H "Authorization: Bearer $CADENCE_API_TOKEN" \\\n  -H "Content-Type: application/json"`,
        },
      },
    ],
    markdown: `# Make your first API calls\n\nBase URL: \`https://api.cadence.ai/v2\``,
  },
  {
    slug: 'api-reference/v2/authentication',
    tab: 'api-reference',
    eyebrow: 'Get started',
    sidebarGroup: 'Get started',
    title: 'API v2 authentication',
    sidebarTitle: 'Authentication',
    description: 'Create, scope, and rotate Bearer tokens for server-to-server integrations.',
    icon: 'lock',
    intro: 'Keep workspace API tokens strictly on the server side. Never expose private tokens in browser bundles.',
    sections: [
      {
        id: 'bearer-header',
        heading: 'Authorization header',
        codeBlock: {
          language: 'http',
          code: `Authorization: Bearer cad_live_9f8a21c4e0b742d1`,
        },
      },
    ],
    markdown: `# API v2 authentication\n\nSend \`Authorization: Bearer <TOKEN>\` with every request.`,
  },
  {
    slug: 'api-reference/chatbots/list-chatbots',
    tab: 'api-reference',
    eyebrow: 'Chatbots',
    sidebarGroup: 'Chatbots',
    title: 'List chatbots',
    description: 'Retrieve all AI voice and text chatbots in the authenticated workspace.',
    icon: 'bot',
    sections: [
      {
        id: 'endpoint',
        heading: 'Endpoint',
        endpoint: {
          method: 'GET',
          path: '/api/v2/chatbots',
          summary: 'Returns a paginated list of chatbots ordered by creation timestamp.',
        },
        codeBlock: {
          language: 'json',
          filename: '200 OK',
          code: `{\n  "data": [\n    {\n      "id": "bot_01J9X8K2",\n      "name": "Support Concierge",\n      "status": "active",\n      "voiceEnabled": true,\n      "documentsCount": 42\n    }\n  ],\n  "nextCursor": null\n}`,
        },
      },
    ],
    markdown: `# List chatbots\n\nGET \`/api/v2/chatbots\``,
  },
  {
    slug: 'api-reference/chatbots/create-chatbot',
    tab: 'api-reference',
    eyebrow: 'Chatbots',
    sidebarGroup: 'Chatbots',
    title: 'Create chatbot',
    description: 'Provision a new Cadence chatbot programmatically.',
    icon: 'bot',
    sections: [
      {
        id: 'endpoint',
        heading: 'Endpoint',
        endpoint: {
          method: 'POST',
          path: '/api/v2/chatbots',
          summary: 'Creates a new chatbot with optional system prompt and voice greeting.',
        },
        codeBlock: {
          language: 'bash',
          code: `curl -X POST "https://api.cadence.ai/v2/chatbots" \\\n  -H "Authorization: Bearer $CADENCE_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Onboarding Assistant",\n    "greeting": "Hi there! How can I help you get started?"\n  }'`,
        },
      },
    ],
    markdown: `# Create chatbot\n\nPOST \`/api/v2/chatbots\``,
  },
  {
    slug: 'api-reference/messages/send-message',
    tab: 'api-reference',
    eyebrow: 'Messages',
    sidebarGroup: 'Messages',
    title: 'Send message',
    description: 'Send a visitor prompt to a conversation thread and receive a grounded AI response.',
    icon: 'code',
    sections: [
      {
        id: 'endpoint',
        heading: 'Endpoint',
        endpoint: {
          method: 'POST',
          path: '/api/v2/chatbots/{chatbotId}/conversations/{threadId}/messages',
          summary: 'Appends a user message and returns the grounded assistant reply with source citations.',
        },
        codeBlock: {
          language: 'bash',
          code: `curl -X POST "https://api.cadence.ai/v2/chatbots/bot_01J9X8K2/conversations/thr_8821/messages" \\\n  -H "Authorization: Bearer $CADENCE_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "content": "How do I embed the widget on Next.js?" }'`,
        },
      },
    ],
    markdown: `# Send message\n\nPOST \`/api/v2/chatbots/{chatbotId}/conversations/{threadId}/messages\``,
  },
];

const CHANGELOG_OVERVIEW_PAGE: DocsPageEntry = {
  slug: 'changelog/overview',
  tab: 'changelog',
  eyebrow: 'Updates',
  sidebarGroup: 'Updates',
  title: 'Changelog',
  sidebarTitle: 'Overview',
  description: 'Find what changed in Cadence each month since March 2023.',
  icon: 'clock',
  intro:
    'This page lists every monthly changelog page, newest first. Each entry gives a short summary of that month. Open a month to see the full list of new features, improvements, and fixes. Each page lists only changes you could see or use, based on what shipped that month.',
  sections: buildChangelogOverviewSections(),
  markdown: buildChangelogOverviewMarkdown(),
};

export const ALL_DOCS_PAGES: DocsPageEntry[] = [
  CHANGELOG_OVERVIEW_PAGE,
  ...MONTHLY_PAGES,
  ...DOCUMENTATION_PAGES,
  ...CLI_PAGES,
  ...API_PAGES,
];

export const DOCS_TABS: DocsTabConfig[] = [
  {
    id: 'documentation',
    label: 'Documentation',
    defaultSlug: 'introduction/what-is-cadence',
    groups: [
      {
        group: 'Get Started',
        icon: 'rocket',
        pages: DOCUMENTATION_PAGES.filter((p) => p.sidebarGroup === 'Get Started').map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
        })),
      },
      {
        group: 'Guides',
        icon: 'book',
        pages: DOCUMENTATION_PAGES.filter((p) => p.sidebarGroup === 'Guides').map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
        })),
      },
    ],
  },
  {
    id: 'changelog',
    label: 'Changelog',
    defaultSlug: 'changelog/overview',
    groups: [
      {
        group: 'Updates',
        icon: 'clock',
        pages: [
          {
            slug: 'changelog/overview',
            title: 'Overview',
            icon: 'clock',
          },
        ],
      },
      ...(['2026', '2025', '2024', '2023'] as const).map((year) => ({
        group: year,
        icon: 'calendar' as const,
        pages: MONTHLY_PAGES.filter((p) => p.sidebarGroup === year).map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
        })),
      })),
    ],
  },
  {
    id: 'cli',
    label: 'CLI',
    defaultSlug: 'cli/overview',
    groups: [
      {
        group: 'Cadence CLI',
        icon: 'terminal',
        pages: CLI_PAGES.map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
        })),
      },
    ],
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    defaultSlug: 'api-reference/v2/getting-started',
    groups: [
      {
        group: 'Get started',
        icon: 'rocket',
        pages: API_PAGES.filter((p) => p.sidebarGroup === 'Get started').map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
        })),
      },
      {
        group: 'Chatbots',
        icon: 'code',
        pages: API_PAGES.filter((p) => p.sidebarGroup === 'Chatbots').map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
          method: p.sections[0]?.endpoint?.method,
        })),
      },
      {
        group: 'Messages',
        icon: 'code',
        pages: API_PAGES.filter((p) => p.sidebarGroup === 'Messages').map((p) => ({
          slug: p.slug,
          title: p.sidebarTitle || p.title,
          icon: p.icon,
          method: p.sections[0]?.endpoint?.method,
        })),
      },
    ],
  },
];

export function getDocsPageBySlug(rawSlug?: string): DocsPageEntry {
  const normalized = (rawSlug || 'changelog/overview').replace(/^\/+|\/+$/g, '');
  if (!normalized) return CHANGELOG_OVERVIEW_PAGE;
  return (
    ALL_DOCS_PAGES.find((page) => page.slug === normalized) || CHANGELOG_OVERVIEW_PAGE
  );
}

export function getDocsNeighbors(page: DocsPageEntry): {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
} {
  const tabConfig = DOCS_TABS.find((t) => t.id === page.tab);
  if (!tabConfig) return { prev: null, next: null };

  const ordered = tabConfig.groups.flatMap((g) => g.pages);
  const idx = ordered.findIndex((p) => p.slug === page.slug);
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? { slug: ordered[idx - 1].slug, title: ordered[idx - 1].title } : null,
    next:
      idx < ordered.length - 1
        ? { slug: ordered[idx + 1].slug, title: ordered[idx + 1].title }
        : null,
  };
}
