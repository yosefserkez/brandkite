# Brandkite

> AI brand studio — generate a complete, editable brand kit (name, logo,
> tagline, mission, vision, values, story, tone, colors, typography, …) from a
> short description or a single URL.

Brandkite is an open-source web app that bootstraps a brand from raw context.
Drop in a company description or scrape an existing site, and it produces a
multi-module brand kit you can iterate on — every module is regenerable,
versioned, and shareable.

![Brandkite preview](./public/billboard.png)

- **Live site:** https://brandkite.co
- **License:** [AGPL-3.0](./LICENSE)
- **Status:** Hackathon-grown, actively developed. Expect rough edges.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Brand modules — how they work](#brand-modules--how-they-work)
- [Common tasks](#common-tasks)
- [Deployment](#deployment)
- [Trademark notice](#trademark-notice)
- [License](#license)

---

## Features

- **Context-first generation.** Paste a description, drop a URL (scraped via
  Firecrawl), or upload PDFs / DOCX files. Brandkite extracts a structured
  brand context (industry, product, market, customer, competitors,
  inspirations, business model, team).
- **Multi-module brand kit.** From the same context, generate `name`,
  `tagline`, `mission`, `vision`, `values`, `story`, `tone`, `colors`,
  `typography`, and an SVG `logo`. Each is its own module with its own data
  shape and prompt.
- **Versioning.** Every module keeps every generation in `brandModules` with a
  `published` flag and a status (`idle`, `queued`, `in_progress`, `succeeded`,
  `failed`). Users can flip between versions and publish the one they like.
- **Workflows.** Long-running generations run on `@convex-dev/workflow` so
  they survive page reloads and you can watch a module flip from `queued` to
  `succeeded` in real time.
- **Logo vector search.** Logos are described by GPT, embedded with OpenAI
  text embeddings + CLIP image embeddings, and stored in a Convex vector
  index for hybrid (text + image) similarity search.
- **Realtime collaboration.** Public companies can be viewed by anyone;
  members see each other via a lightweight `presence` table.
- **Magic-link auth.** Passwordless sign-in via `@convex-dev/auth` + Resend.
- **Optional billing.** Hooks for [Autumn](https://useautumn.com) usage
  metering ship with the app; remove or replace if you don't need it.

## Architecture

```
                 ┌─────────────────────────────────────────────────┐
   Browser ◀──▶  │  TanStack Start (Vite + React 19, file routing) │
                 │  - /              public landing / studio       │
                 │  - /c/$id         authenticated company studio  │
                 │  - /public/c/$id  read-only public brand kit    │
                 │  - /gallery       sample / showcase             │
                 └──────────────────────────┬──────────────────────┘
                                            │  reactive queries
                                            │  + mutations
                                            ▼
                 ┌─────────────────────────────────────────────────┐
                 │              Convex backend (convex/)           │
                 │                                                 │
                 │  schema.ts     companies, members, brandModules │
                 │                brandAssets, presence,           │
                 │                logoEmbeddings (vector index)    │
                 │                                                 │
                 │  modules/      one file per brand module type:  │
                 │                name, tagline, mission, vision,  │
                 │                story, tone, colors, typography, │
                 │                logo, brandContext               │
                 │                                                 │
                 │  workflows/    long-running generation pipelines│
                 │  auth.ts       Resend magic-link provider       │
                 │  r2.ts         Cloudflare R2 file storage       │
                 │  autumn.ts     billing component                │
                 │  lib/          firecrawl scrape helper, etc.    │
                 │  logoVectorSearch.ts                            │
                 └──────────────────────────┬──────────────────────┘
                                            │
       ┌────────────────────────────────────┼────────────────────────────┐
       ▼                ▼                   ▼                ▼           ▼
   OpenRouter        OpenAI            Replicate         Firecrawl      R2
   (text gen)     (embeddings)   (logo SVG + CLIP)    (URL scrape)   (assets)
```

The frontend never talks to AI providers directly — every generation goes
through a Convex action, which keeps API keys server-side and lets us cache
intermediate results in the database.

## Tech stack

| Layer            | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Framework        | [TanStack Start](https://tanstack.com/start) (Vite, file-based routing) |
| UI               | React 19, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Radix primitives) |
| Backend / DB     | [Convex](https://convex.dev) — queries, mutations, actions, workflows, file storage, vector search |
| Auth             | [`@convex-dev/auth`](https://labs.convex.dev/auth) + [Resend](https://resend.com) magic links |
| LLM gateway      | [Vercel AI SDK](https://sdk.vercel.ai) via [OpenRouter](https://openrouter.ai) |
| Embeddings       | OpenAI `text-embedding-3-large` (text) + CLIP on Replicate (image)      |
| Image generation | [Replicate](https://replicate.com) (`recraft-ai/recraft-20b-svg`)       |
| Web scraping     | [Firecrawl](https://www.firecrawl.dev)                                  |
| Asset storage    | Cloudflare R2 via [`@convex-dev/r2`](https://www.convex.dev/components/cloudflare-r2) |
| Billing          | [Autumn](https://useautumn.com) (optional)                              |
| Errors           | [Sentry](https://sentry.io) (optional)                                  |
| Lint / format    | [Biome](https://biomejs.dev) + [Ultracite](https://github.com/biomejs/ultracite) rules |
| Tests            | [Vitest](https://vitest.dev) + Testing Library                          |
| Package manager  | [pnpm](https://pnpm.io)                                                 |

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **pnpm** ≥ 9 — `npm install -g pnpm`
- A free **Convex** account — https://convex.dev
- API keys for the providers you intend to use. The bare minimum to boot the
  app (UI + auth + scraping + text modules) is Convex + Resend + OpenRouter +
  Firecrawl. Logo generation additionally needs Replicate, and the logo
  vector search needs OpenAI + Replicate (CLIP) + R2.

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/yosefserkez/brandkite.git
cd brandkite
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — at minimum you need a value for VITE_CONVEX_URL,
# which the next step will fill in for you.

# 3. Provision a Convex deployment (interactive on first run)
npx convex dev --once --configure=new
# This writes VITE_CONVEX_URL and CONVEX_DEPLOYMENT into .env.local.

# 4. Initialize Convex Auth (one-time, follow the prompts)
npx @convex-dev/auth

# 5. Set the server-side secrets on your Convex deployment
npx convex env set AUTH_RESEND_KEY      re_...
npx convex env set OPENROUTER_API_KEY   sk-or-...
npx convex env set FIRECRAWL_API_KEY    fc-...
npx convex env set OPENAI_API_KEY       sk-...      # optional, logo search
npx convex env set REPLICATE_API_TOKEN  r8_...      # optional, logo gen
# Cloudflare R2 + Autumn keys: see .env.example and the relevant component docs.

# 6. Start everything (two terminals)
npx convex dev          # terminal 1: backend, pushes functions on save
pnpm dev                # terminal 2: Vite dev server on http://localhost:3000
```

Optional — seed a public showcase company:

```bash
pnpm seed
```

## Environment variables

A full annotated list lives in [`.env.example`](./.env.example). Quick map:

| Variable                   | Used by                       | Where to set            |
| -------------------------- | ----------------------------- | ----------------------- |
| `VITE_CONVEX_URL`          | browser → Convex client       | `.env.local`            |
| `VITE_SENTRY_DSN`          | client error reporting        | `.env.local` (optional) |
| `VITE_SENTRY_ENV`          | client error reporting        | `.env.local` (optional) |
| `VITE_APP_TITLE`           | document `<title>`            | `.env.local` (optional) |
| `VITE_SENTRY_ORG` / `VITE_SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | source map upload | CI build env (optional) |
| `CONVEX_SITE_URL`          | `convex/auth.config.ts`       | Convex env (auto-set)   |
| `AUTH_RESEND_KEY`          | `convex/auth.ts`              | Convex env              |
| `OPENROUTER_API_KEY`       | every text module             | Convex env              |
| `OPENAI_API_KEY`           | `convex/logoVectorSearch.ts`  | Convex env              |
| `REPLICATE_API_TOKEN`      | `convex/modules/logo.ts`, CLIP embeddings | Convex env  |
| `FIRECRAWL_API_KEY`        | `convex/lib/firecrawl.ts`     | Convex env              |
| `AUTUMN_SECRET_KEY`        | `convex/autumn.ts` (billing)  | Convex env (optional)   |
| `R2_*`                     | `@convex-dev/r2`              | Convex env              |

Anything prefixed `VITE_` is exposed to the browser bundle — never put a
secret there. Everything else lives in the Convex deployment and is only
visible to server-side code.

## Project structure

```
brandkite/
├── convex/                 Backend — Convex functions, schema, components
│   ├── schema.ts           Tables: companies, brandModules, brandAssets,
│   │                       presence, logoEmbeddings (vector index), …
│   ├── auth.ts             @convex-dev/auth + Resend magic-link provider
│   ├── auth.config.ts      JWT provider config
│   ├── companies.ts        CRUD + scrape-from-URL bootstrap flow
│   ├── brandModules.ts     Generic module read/write/version helpers
│   ├── modules/            One file per brand module type
│   │   ├── brandContext.ts
│   │   ├── name.ts  tagline.ts  mission.ts  story.ts  tone.ts
│   │   ├── colors.ts  typography.ts  logo.ts
│   │   └── …
│   ├── workflows/index.ts  BRAND_MODULE_TYPES (single source of truth)
│   ├── logoVectorSearch.ts Hybrid text+image search over logoEmbeddings
│   ├── r2.ts               Cloudflare R2 file storage component
│   ├── autumn.ts           Optional billing component
│   ├── presence.ts         Lightweight per-company presence tracker
│   ├── http.ts             HTTP routes (auth callbacks, etc.)
│   └── lib/firecrawl.ts    URL scraper used by brandContext generation
│
├── src/
│   ├── routes/             TanStack Router file-based routes
│   │   ├── __root.tsx      App shell, providers, <Toaster />
│   │   ├── index.tsx       Landing / studio entry
│   │   ├── _authenticated/c/{$id,new}.tsx   Auth-only studio
│   │   ├── public/c/$id.tsx                  Read-only public view
│   │   └── gallery.tsx
│   ├── components/
│   │   ├── modules/        UI per brand module + shared primitives
│   │   │                   (see src/components/modules/README.md)
│   │   ├── ui/             shadcn/ui primitives (button, dialog, …)
│   │   ├── new-company/    Onboarding flow (paste/upload/scrape)
│   │   └── …
│   ├── hooks/useBrandModule.ts   The hook every module screen uses
│   ├── stores/             TanStack Store state
│   ├── integrations/       Convex + TanStack Query glue
│   ├── env.ts              Type-safe env access (t3-env)
│   └── routeTree.gen.ts    Generated by TanStack Router — don't edit
│
├── public/                 Static assets, favicons, preview images
├── scripts/logos/          Logo dataset ingestion (see scripts/logos/README.md)
├── biome.json              Lint + format config (extends ultracite)
├── components.json         shadcn/ui generator config
├── vite.config.ts          Vite + TanStack Start + Nitro + Sentry plugins
├── AGENTS.md               House style rules surfaced to coding agents
└── convex.json / .cta.json Tool configs
```

## Brand modules — how they work

A "brand module" is one slice of the brand kit (e.g. the name, the logo, the
colors). Every module shares the same lifecycle:

1. **Data model.** All modules live in one `brandModules` table keyed by
   `companyId` + `type`. The `type` is one of `BRAND_MODULE_TYPES` declared in
   [`convex/workflows/index.ts`](./convex/workflows/index.ts) — the single
   source of truth for module names. Each row has a free-form `data` blob, a
   `published` flag, and a `generationStatus`.

2. **Backend.** Each `convex/modules/<type>.ts` file exports the generation
   pipeline: a Zod schema for the AI output, a prompt builder, and an action
   (often inside a workflow step) that calls OpenRouter via the Vercel AI
   SDK's `generateObject` and writes a new version row. `logo.ts` is the
   exception — it calls Replicate, downloads the SVG, and stores it in R2.

3. **Frontend.** Each `src/components/modules/<Type>Module.tsx` calls
   `useBrandModule(companyId, type)` to get the live state and wraps content
   in `BlockWrapper` + `ModuleActions`. See
   [`src/components/modules/README.md`](./src/components/modules/README.md)
   for the component patterns.

### Adding a new module type

1. Add the type to `BRAND_MODULE_TYPES` in `convex/workflows/index.ts`.
2. Create `convex/modules/<type>.ts` — define a Zod schema, a prompt, and an
   `internalAction` that writes a row via the generic helpers in
   `convex/brandModules.ts`.
3. Wire the new action into the workflow in `convex/companies.ts` if you
   want it generated automatically when a company is created.
4. Create `src/components/modules/<Type>Module.tsx` following the pattern in
   the modules README.
5. Render it from `src/components/BrandStudioPage.tsx`.

## Common tasks

| Task                                | Command                          |
| ----------------------------------- | -------------------------------- |
| Install dependencies                | `pnpm install`                   |
| Start Convex backend (watches)      | `npx convex dev`                 |
| Start Vite dev server               | `pnpm dev`                       |
| Type-check + lint + format check    | `pnpm check`                     |
| Lint only                           | `pnpm lint`                      |
| Format (write)                      | `pnpm format`                    |
| Run unit tests                      | `pnpm test`                      |
| Production build                    | `pnpm build`                     |
| Preview production build            | `pnpm serve`                     |
| Seed the "Brandkite" demo company   | `pnpm seed`                      |
| Add a shadcn/ui component           | `pnpm dlx shadcn@latest add <c>` |
| Initialize Convex Auth              | `pnpm init-convex-auth`          |

## Deployment

The repo ships with a `vercel.json` that runs:

```
npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'pnpm run build'
```

That single command deploys the Convex backend and builds the TanStack Start
app, wiring the production `VITE_CONVEX_URL` into the bundle automatically.

To deploy elsewhere:

1. Pick a Node host that can run the `pnpm build` output (the Nitro adapter
   produces a generic Node server in `.output/`; swap presets in `nitro` if
   you need a different target).
2. Run `npx convex deploy` once to provision the production deployment, then
   set every server-side secret from [`.env.example`](./.env.example) via
   `npx convex env set ... --prod`.
3. Set `VITE_CONVEX_URL` to the production Convex URL in your host's build
   env.
4. Run `npx @convex-dev/auth --prod` once to provision production auth keys.

## Trademark notice

The source code is AGPL-3.0. The **"Brandkite" name and logo are trademarks**
of the original author and are *not* covered by the license. If you fork
this project to ship your own product, please rename it and replace the
branding — see [`NOTICE`](./NOTICE) for the specific files to change.

## License

Brandkite is licensed under the **GNU Affero General Public License v3.0**
(AGPL-3.0). See [`LICENSE`](./LICENSE) for the full text.

The AGPL is a strong copyleft license: if you run a modified version of
Brandkite as a network service, you must offer the modified source to your
users. If that doesn't work for your use case, please open an issue to
discuss alternative licensing.
