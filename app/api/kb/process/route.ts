import { NextRequest, NextResponse } from 'next/server';
import { isSafePublicHttpUrl } from '@/lib/widget-domain';
import { crawlWebsiteWithWebCrawlerApi } from '@/lib/webcrawler';

function chunkText(text: string, maxChunkLength = 600, overlap = 80): string[] {
  if (!text || !text.trim()) return [];
  // Split by paragraphs / markdown blocks first
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (para.length > maxChunkLength) {
      // Split large paragraph into sentences without breaking within URLs
      const sentences = para
        .split(/(?<=[.!?])\s+(?=[A-Z0-9#*[-])/g)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length > maxChunkLength && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-Math.max(3, Math.floor(overlap / 12)));
          currentChunk = overlapWords.join(' ') + ' ' + sentence;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + para).length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.max(3, Math.floor(overlap / 12)));
        currentChunk = overlapWords.join(' ') + '\n\n' + para;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text.trim()];
}

export async function POST(req: NextRequest) {
  try {
    const { action, textContent, sourceUrl, maxPages } = await req.json();

    let rawText = typeof textContent === 'string' ? textContent : '';
    let pageTitle = '';
    let pagesCrawled = 1;
    let discoveredLinks: string[] = [];
    let crawlProvider = 'local';

    if (action === 'crawl' && typeof sourceUrl === 'string' && sourceUrl.trim()) {
      const normalizedUrl = sourceUrl.trim().startsWith('http')
        ? sourceUrl.trim()
        : `https://${sourceUrl.trim()}`;

      if (!isSafePublicHttpUrl(normalizedUrl)) {
        return NextResponse.json(
          { error: 'Please provide a valid public http(s) website URL.' },
          { status: 400 }
        );
      }

      // Crawl using WebCrawlerAPI (https://dash.webcrawlerapi.com/access)
      const crawlResult = await crawlWebsiteWithWebCrawlerApi(normalizedUrl, {
        maxPages: typeof maxPages === 'number' ? maxPages : 3,
        timeoutMs: 25000,
      });

      if (!crawlResult.success || !crawlResult.combinedMarkdown.trim()) {
        return NextResponse.json(
          {
            error:
              crawlResult.error ||
              'Unable to crawl website URL. Please verify the URL is publicly reachable.',
          },
          { status: 422 }
        );
      }

      rawText = crawlResult.combinedMarkdown;
      pageTitle = crawlResult.title;
      pagesCrawled = crawlResult.pagesScraped;
      discoveredLinks = crawlResult.discoveredLinks;
      crawlProvider = crawlResult.provider;
    }

    const boundedText = rawText.slice(0, 19500).trim();
    if (!boundedText || boundedText.length < 10) {
      return NextResponse.json(
        { error: 'No readable text content found on this source.' },
        { status: 400 }
      );
    }

    const chunks = chunkText(boundedText, 600, 100);

    return NextResponse.json({
      success: true,
      extractedText: boundedText,
      pageTitle,
      pagesCrawled,
      discoveredLinks: discoveredLinks.slice(0, 50),
      chunks: chunks.slice(0, 40),
      indexedChunksCount: chunks.length,
      provider: crawlProvider,
    });
  } catch (err) {
    console.error('Knowledge processing error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
