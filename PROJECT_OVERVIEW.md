## Project Overview

### Problem
Founders hit a wall when turning an idea into a real brand. Agencies are expensive and slow. DIY tools force guesswork. Existing AI tools handle isolated tasks but don’t create a unified identity. As a result, people waste weeks stitching together names, visuals, and messaging across fragmented services, with inconsistent results.

### Solution
Brandkite provides a full-stack, AI-assisted brand studio that replaces fragmented workflows with a single, coherent system. It lets teams draft, refine, and operationalize brand context using live data, and real-time sync. AI-powered enrichment accelerates iteration, while seamless deployment ensures that names, voice, visuals, and guidelines stay consistent. The result: brand assets that are fast to create, easy to maintain, and always up to date.


## How It’s Built

### TanStack Start
- Full-stack app using TanStack Start (powered by TanStack Router) for React.
- File-based routing, loaders/actions for data workflows, and end-to-end type-safety.
- Progressive enhancement by default with server-first data flows and great DX.
- Personal take: TanStack Start is great — routing ergonomics, data APIs, and DX made building fast and enjoyable.

Resources:
- TanStack Start: [Quickstart](https://tanstack.com/router/latest/docs/framework/react/start/quick-start)

### Convex
- Convex is the reactive backend that keeps the app in sync across clients.
- We store brand modules (mission, values, voice, etc.), threads, and user actions in Convex tables.
- Convex functions handle mutations, scheduled summarization, and aggregation without managing servers.
- Personal take: Convex makes reactive apps awesome — it’s been a lot of fun to build with.

Resources:
- Convex: [Convex is the backend platform that keeps your app in sync](https://www.convex.dev/)

### High-Level Architecture
- UI and routing: TanStack Start (React)
- Data + real-time sync: Convex
- AI data ingestion: Firecrawl
- Auth/payments (AI infra-ready): Autum
- Object storage: Cloudflare R2
- Observability: Sentry
- CI/code quality: CodeRabbit
- Hosting: Netlify (primary). Cloudflare-compatible build for Workers as needed.


## Integrations and Co-Host Platforms

### CodeRabbit
- AI-driven code reviews to maintain high signal PR feedback and consistent standards.
- Automated review suggestions accelerated refactors and reduced review latency.

Resource: [CodeRabbit – AI code reviews](https://coderabbit.ai/)

### Firecrawl
- Used to convert websites and public docs into LLM-ready data to enrich brand context.
- Ingestion pipeline feeds structured content into Convex; editors can map sources to brand modules.
- Personal take: Firecrawl lets us enrich our context with high-signal, structured snippets from real sites.

Resource: [Firecrawl – Turn websites into LLM-ready data](https://www.firecrawl.dev/)

### Autum
- “Stripe for AI Startups” — designed the billing hooks and entitlements around Autum to support tiered access (e.g., number of brand modules, AI enrichment quota).
- Integration points are abstracted via server functions; swapping or enabling Autum requires no client changes.
- Personal take: Autum made setting up billing a breeze — clean APIs and straightforward entitlements.

Resource: [Autum](https://autum.ai/)

### Netlify
- Primary hosting target for TanStack Start.
- Simple push-to-deploy with preview environments for branches.
- Netlify Forms used where applicable for marketing/feedback capture.

Resources:
- Netlify: [Push your ideas to the web](https://www.netlify.com/)
- TanStack Start on Netlify: [Guide](https://tanstack.com/router/latest/docs/framework/react/start/deployment#netlify)

### Cloudflare
- We use Cloudflare R2 for object storage (e.g., assets and exported brand artifacts).

Resources:
- Cloudflare: [Build faster & more secure apps](https://www.cloudflare.com/)

### Sentry
- Application monitoring and error tracking are wired into the app to capture client and server issues in real time [[memory:10924761]].
- We track route-level performance, Convex mutation failures, and user-impacting exceptions.

Resource: [Sentry – Application monitoring “not bad” (by 4M devs)](https://sentry.io/)


## Show & Tell

### Example User Flow
1) Founder creates a workspace authenticated with Convex Auth, adds company details, and drafts mission/voice with AI assistance.
2) Firecrawl ingests the current website and relevant docs; data is transformed into structured snippets.
3) Convex workflows/actions generate modules (mission, tone, values), update data, and keep all clients in sync.
4) Stakeholders iterate, and approve; TanStack Start actions persist edits via Convex mutations.
5) Deployment to Netlify publishes a public brand guide.
6) Sentry records performance and errors; CodeRabbit maintains code quality on incoming changes.
7) Autum is used to enforce plan entitlements and quota for AI enrichment features.

### Why This Approach Works
- Real-time, collaborative source of truth (Convex) meets modern app ergonomics (TanStack Start).
- Data ingestion (Firecrawl) upgrades brand work from static to dynamic, testable inputs.
- Operational excellence with Sentry, CodeRabbit, and first-class deployment targets.

