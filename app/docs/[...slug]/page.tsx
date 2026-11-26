import type { Metadata } from 'next';
import { DocsShell } from '@/components/docs/docs-shell';
import { getDocsPageBySlug } from '@/lib/docs/docs-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocsPageBySlug(slug.join('/'));
  return {
    title: `${page.title} - Cadence Docs`,
    description: page.description,
  };
}

export default async function DocsSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <DocsShell slug={slug.join('/')} />;
}
