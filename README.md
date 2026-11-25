# Cadence — AI Voice Agent SaaS Platform

Cadence is a multi-tenant SaaS application for creating, configuring, and organizing AI voice agents, knowledge sources, demo phone routing, and workspace team roles.

## Architecture & Routes

### Public Routes
- `/` — Product landing page (capabilities, security architecture, use cases, pricing)
- `/login` — Email/password and Google Sign-In
- `/signup` — Registration with automatic workspace onboarding & email verification dispatch
- `/forgot-password` — Firebase password reset email flow
- `/reset-password` — Password reset confirmation handler (`?oobCode=...`)

### Protected Workspace Routes
Unauthenticated visitors are redirected to `/login`, and unverified email accounts must verify their address before accessing workspace data:
- `/dashboard` — Workspace overview, KPI summary, recent call logs, and agent performance
- `/agents` — Voice agent management and 4-step creation/edit wizard
- `/knowledge-base` — Website URLs, text scripts, and private document uploads (`<= 10 MB`, `.pdf/.txt/.docx/.md`)
- `/phone-numbers` — Demo phone inventory connection and agent routing (saved to Firestore; no real carrier purchasing)
- `/calls` — Call history log & transcript drawer
- `/analytics` — Call volume & conversion analytics computed from workspace records
- `/integrations` — Planned Milestone 3 carrier/CRM integration previews
- `/settings` — Profile, workspace configuration, plan overview, preview API keys, and RBAC team management

## Firebase Configuration & Collections

Firebase configuration is stored in `firebase-applet-config.json` (project `gen-lang-client-0381200836`, named Firestore database `ai-studio-voxagent-e781a270-8345-4c9d-9294-990ba2aba251`).

- `users/{userId}` — User profile metadata & `memberships/{workspaceId}` index
- `workspaces/{workspaceId}` — Workspace settings, owner ID, plan tier, and `memberUids`
- `workspaces/{workspaceId}/members/{memberId}` — RBAC roles (`owner`, `admin`, `member`)
- `workspaces/{workspaceId}/voice_agents/{agentId}` — Voice agent configurations
- `workspaces/{workspaceId}/knowledge_sources/{sourceId}` — URL, text, and Storage document records
- `workspaces/{workspaceId}/phone_numbers/{phoneId}` — Demo number routing records
- `workspaces/{workspaceId}/call_logs/{callId}` — Call logs and transcripts
- `workspaces/{workspaceId}/subscriptions/{subId}` — Workspace plan state
- `workspaces/{workspaceId}/api_keys/{keyId}` — Masked preview API key records

## Firebase Console Checklist

Before using all features in Firebase project `gen-lang-client-0381200836`, confirm in the Firebase Console:
1. **Authentication → Sign-in method**: Enable **Email/Password** and **Google** providers.
2. **Storage**: Ensure Firebase Storage is initialized and `storage.rules` is deployed if using Knowledge Base document uploads.
3. **Security Rules**: Review `firestore.rules` and `storage.rules` before broad production sharing.

## Development Commands

```bash
npm run dev
npm run lint
npm run build
```
