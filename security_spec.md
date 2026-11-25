# Security Specification — Cadence SaaS Firestore Rules

## 1. Data Invariants
1. **Authentication & Verification**: Every read and write across `/users/*` and `/workspaces/*` requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation**: User profiles (`/users/{userId}`) and membership indexes (`/users/{userId}/memberships/{workspaceId}`) are readable and writable strictly by `request.auth.uid == userId`.
3. **Workspace Membership Boundary**: Workspace documents and all subcollections (`members`, `voice_agents`, `knowledge_sources`, `leads`, `voice_sessions`, `conversation_messages`, `phone_numbers`, `call_logs`, `subscriptions`, `api_keys`) are accessible only to verified users who belong to the workspace (`memberUids` / `members/{uid}`).
4. **Role-Based Access Control (RBAC)**:
   - `owner`: Full workspace control, plan & trial selection (`Starter`, `Growth`, `Basic`, `Business`, `Enterprise`), team management, API keys, and workspace deletion.
   - `admin`: Can update workspace metadata, manage team members (non-owner), and manage API keys.
   - `member`: Can read workspace data and create/update/delete `voice_agents`, `knowledge_sources`, `leads`, and test `voice_sessions`/`conversation_messages`, but cannot mutate workspace settings, API keys, or team roles.
5. **Immutable Relational Integrity & Array Bounds**: `id`, `workspaceId`, `workspaceOwnerId`, `createdBy`, `ownerId`, and `createdAt` cannot be modified after creation. Server timestamps (`request.time`) are enforced on `createdAt` and `updatedAt`, and bounded arrays (`memberUids <= 50`, `allowedDomains <= 20`, `techStack <= 25`, `deployChannels <= 25`) prevent unbounded list growth.
6. **Public Widget Zero-PII & Strict Drop-Box Isolation**:
   - `/public_widgets/{agentId}` exposes ONLY non-PII chatbot styling/persona configuration when `status == 'Active'` and strictly denies `allow list`. Writes are restricted to verified workspace members.
   - `/public_widgets/{agentId}/knowledge/bundle` enforces `allow list: if false` and exposes bundled knowledge snippets only for `Active` widgets via `get`.
   - `/public_widget_leads/{leadId}` and `/public_widget_turns/{turnId}` enforce strict server-validated `create` checks tied to an existing `Active` parent widget (`leadCaptureEnabled == true` for leads), and strictly forbid unauthenticated `get`, `list`, `update`, or `delete` (only verified workspace owners/members can read/manage captured visitor leads and transcripts).

## 2. Dirty Dozen Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. Unauthenticated read of `/users/{uid}` or `/workspaces/{wsId}/voice_agents`.
2. Unverified email user (`email_verified == false`) attempting to create a workspace or voice agent.
3. Cross-tenant `get` or `list` of `/workspaces/{otherWsId}/voice_agents` by a non-member.
4. Cross-tenant `create` into `/workspaces/{otherWsId}/knowledge_sources` with spoofed `memberUids`.
5. Shadow field injection (`isAdmin: true`, `planName: 'Enterprise'` inside `voice_agents`) blocked by `keys().hasOnly(...)`.
6. Client-spoofed `createdAt` or `updatedAt` timestamp != `request.time`.
7. Workspace `member` attempting to update `/workspaces/{wsId}` name or plan.
8. Workspace `member` attempting to invite or promote themselves to `admin`/`owner` in `/workspaces/{wsId}/members/{memberId}`.
9. Workspace `admin` attempting to delete or modify the `owner` member record.
10. Workspace `member` attempting to create or revoke `/workspaces/{wsId}/api_keys/{keyId}` or `/workspaces/{wsId}/phone_numbers/{phoneId}`.
11. Resource exhaustion / ID poisoning with document IDs > 128 chars or invalid characters (`../foo`).
12. Non-owner (`admin` or `member`) attempting to change `planName` or `subscriptionStatus` on `/workspaces/{wsId}` or `/subscriptions/{subId}`.
13. Unauthenticated caller attempting `get` or `list` on `/public_widgets`, `/public_widget_leads`, or `/public_widget_turns`, or reading an `Inactive`/`Draft` widget.
14. Unauthenticated caller attempting to submit a lead for a widget with `leadCaptureEnabled == false` or mismatched `workspaceId` / `workspaceOwnerId`.
