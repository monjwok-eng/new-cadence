import { NextRequest, NextResponse } from 'next/server';
import { isSafePublicHttpUrl } from '@/lib/widget-domain';

function chunkText(text: string, maxChunkLength = 600, overlap = 100): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleaned];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [cleaned];
}

function extractReadableTextFromHtml(html: string): string {
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

export async function POST(req: NextRequest) {
  try {
    const { action, textContent, sourceUrl } = await req.json();

    let rawText = typeof textContent === 'string' ? textContent : '';

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

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'CadenceCrawler/1.0 (+https://cadence.app)',
            Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Website returned status ${response.status}` },
            { status: 422 }
          );
        }

        const html = await response.text();
        rawText = extractReadableTextFromHtml(html);
      } catch (err) {
        clearTimeout(timer);
        return NextResponse.json(
          {
            error:
              'Unable to crawl website URL: ' +
              (err instanceof Error ? err.message : String(err)),
          },
          { status: 500 }
        );
      }
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
      chunks: chunks.slice(0, 40),
      indexedChunksCount: chunks.length,
    });
  } catch (err) {
    console.error('Knowledge processing error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
