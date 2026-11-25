import React, { Suspense } from 'react';
import { ChatbotWorkspaceView } from '@/components/agents/chatbot-workspace-view';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AgentWorkspacePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <ChatbotWorkspaceView agentId={agentId} />
    </Suspense>
  );
}
