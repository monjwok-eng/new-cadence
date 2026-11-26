import type { Metadata } from 'next';
import { DocsShell } from '@/components/docs/docs-shell';

export const metadata: Metadata = {
  title: 'Changelog - Cadence Docs',
  description: 'Find what changed in Cadence each month since March 2023.',
};

export default function DocsPage() {
  return <DocsShell slug="changelog/overview" />;
}
