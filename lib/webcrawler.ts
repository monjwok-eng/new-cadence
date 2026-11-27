/**
 * WebCrawlerAPI Integration Service
 * Documentation & Access: https://dash.webcrawlerapi.com/access
 *
 * Provides headless, LLM-ready website scraping and crawling with markdown extraction,
 * clean readability stripping, and multi-page link crawling for AI agent knowledge bases.
 */

import { isSafePublicHttpUrl } from '@/lib/widget-domain';

export const WEBCRAWLER_API_KEY =
  process.env.WEBCRAWLER_API_KEY ||
  'webcr_6076899c91ff117d82f59b318749adf50a908a64d9164db517cb90c3814cce3f';

const WEBCRAWLER_SCRAPE_ENDPOINT = 'https://api.webcrawlerapi.com/v2/scrape';
const WEBCRAWLER_CRAWL_ENDPOINT = 'https://api.webcrawlerapi.com/v1/crawl';

export interface WebCrawlerScrapeResult {
  success: boolean;
  url: string;
  markdown: string;
  title: string;
  statusCode: number;
  links: string[];
  provider: 'webcrawlerapi' | 'fallback';
  error?: string;
}

export interface WebCrawlerCrawlResult {
  success: boolean;
  seedUrl: string;
  title: string;
  combinedMarkdown: string;
  pagesScraped: number;
  pages: {
    url: string;
    title: string;
    markdown: string;
  }[];
  discoveredLinks: string[];
  provider: 'webcrawlerapi' | 'fallback';
  error?: string;
}

/**
 * Strips HTML tags and boilerplate when fallback fetch is required
 */
export function extractReadableTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrapes a single webpage using WebCrawlerAPI v2
 */
export async function scrapePageWithWebCrawlerApi(
  targetUrl: string,
  options?: {
    timeoutMs?: number;
    mainContentOnly?: boolean;
    apiKey?: string;
  }
): Promise<WebCrawlerScrapeResult> {
  const apiKey = options?.apiKey || WEBCRAWLER_API_KEY;
  const timeoutMs = options?.timeoutMs || 20000;
  const mainContentOnly = options?.mainContentOnly ?? true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(WEBCRAWLER_SCRAPE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        output_formats: ['markdown', 'links'],
        main_content_only: mainContentOnly,
        respect_robots_txt: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const markdown = typeof data.markdown === 'string' ? data.markdown.trim() : '';
      const title = typeof data.page_title === 'string' ? data.page_title.trim() : '';
      const links = Array.isArray(data.links)
        ? data.links.filter((l: unknown): l is string => typeof l === 'string')
        : [];
      const statusCode = typeof data.page_status_code === 'number' ? data.page_status_code : 200;

      if (markdown.length > 0) {
        return {
          success: true,
          url: targetUrl,
          markdown,
          title: title || new URL(targetUrl).hostname,
          statusCode,
          links,
          provider: 'webcrawlerapi',
        };
      }
    }

    // If WebCrawlerAPI returned non-200 or empty markdown, record error message
    const errText = await res.text().catch(() => '');
    console.warn(`WebCrawlerAPI returned status ${res.status}:`, errText);
  } catch (err) {
    clearTimeout(timer);
    console.warn('WebCrawlerAPI request failed, attempting fallback crawler:', err);
  }

  // Graceful fallback to direct public fetch
  return fallbackScrape(targetUrl, timeoutMs);
}

/**
 * Fallback public scraper in case of unexpected connectivity issues
 */
async function fallbackScrape(
  url: string,
  timeoutMs: number
): Promise<WebCrawlerScrapeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 10000));

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; CadenceWebCrawler/2.0; +https://dash.webcrawlerapi.com/access)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        url,
        markdown: '',
        title: '',
        statusCode: response.status,
        links: [],
        provider: 'fallback',
        error: `Website returned HTTP status ${response.status}`,
      };
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
    const cleanText = extractReadableTextFromHtml(html);

    // Basic markdown wrapper
    const markdown = title ? `# ${title}\n\n${cleanText}` : cleanText;

    return {
      success: true,
      url,
      markdown,
      title,
      statusCode: response.status,
      links: [],
      provider: 'fallback',
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      url,
      markdown: '',
      title: '',
      statusCode: 500,
      links: [],
      provider: 'fallback',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Deep website crawler using WebCrawlerAPI
 * Scrapes the seed page, discovers internal links on the same domain,
 * and fetches up to maxPages to index full website context for AI grounding.
 */
export async function crawlWebsiteWithWebCrawlerApi(
  seedUrl: string,
  options?: {
    maxPages?: number;
    timeoutMs?: number;
  }
): Promise<WebCrawlerCrawlResult> {
  const maxPages = Math.max(1, Math.min(options?.maxPages ?? 3, 5));
  const primary = await scrapePageWithWebCrawlerApi(seedUrl, {
    timeoutMs: options?.timeoutMs,
  });

  if (!primary.success || !primary.markdown) {
    return {
      success: false,
      seedUrl,
      title: primary.title || seedUrl,
      combinedMarkdown: '',
      pagesScraped: 0,
      pages: [],
      discoveredLinks: primary.links || [],
      provider: primary.provider,
      error: primary.error || 'Failed to extract content from URL',
    };
  }

  const parsedSeed = new URL(seedUrl);
  const seedHost = parsedSeed.hostname.toLowerCase();

  const collectedPages: { url: string; title: string; markdown: string }[] = [
    {
      url: primary.url,
      title: primary.title,
      markdown: primary.markdown,
    },
  ];

  // If multi-page crawling is requested and links exist, crawl internal subpages
  if (maxPages > 1 && primary.links.length > 0) {
    const internalCandidateUrls = primary.links
      .map((link) => {
        try {
          const parsed = new URL(link, seedUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
          if (parsed.hostname.toLowerCase() !== seedHost) return null;
          // Ignore anchor links, media, and duplicate seed
          if (parsed.pathname === parsedSeed.pathname && parsed.search === parsedSeed.search) {
            return null;
          }
          if (/\.(jpg|jpeg|png|gif|svg|pdf|zip|mp4|webp|ico|css|js)$/i.test(parsed.pathname)) {
            return null;
          }
          parsed.hash = '';
          return parsed.toString();
        } catch {
          return null;
        }
      })
      .filter((u): u is string => typeof u === 'string' && isSafePublicHttpUrl(u));

    // Deduplicate URLs
    const uniqueSubUrls = Array.from(new Set(internalCandidateUrls)).slice(
      0,
      maxPages - 1
    );

    if (uniqueSubUrls.length > 0) {
      // Scrape sub-pages in parallel
      const subResults = await Promise.allSettled(
        uniqueSubUrls.map((subUrl) =>
          scrapePageWithWebCrawlerApi(subUrl, {
            timeoutMs: 12000,
            mainContentOnly: true,
          })
        )
      );

      for (const res of subResults) {
        if (res.status === 'fulfilled' && res.value.success && res.value.markdown) {
          collectedPages.push({
            url: res.value.url,
            title: res.value.title || res.value.url,
            markdown: res.value.markdown,
          });
        }
      }
    }
  }

  // Combine pages into a coherent markdown document with clear section headings
  const combinedMarkdown = collectedPages
    .map((p, idx) => {
      const pageHeading = idx === 0 ? `# ${p.title}\n*Source: ${p.url}*\n\n` : `\n\n---\n## Page: ${p.title}\n*Source: ${p.url}*\n\n`;
      return `${pageHeading}${p.markdown}`;
    })
    .join('');

  return {
    success: true,
    seedUrl,
    title: primary.title,
    combinedMarkdown,
    pagesScraped: collectedPages.length,
    pages: collectedPages,
    discoveredLinks: primary.links,
    provider: primary.provider,
  };
}
