# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

No test suite is configured.

## Codebase Index
Pre-built index files are in `.ai-codex/`. Read these FIRST before exploring the codebase:
- `.ai-codex/routes.md` -- all API routes
- `.ai-codex/pages.md` -- page tree
- `.ai-codex/lib.md` -- library exports
- `.ai-codex/schema.md` -- database schema
- `.ai-codex/components.md` -- component tree

## Architecture Overview

**TommyboyDesigns V2** is a Next.js 14 (App Router) e-commerce site for 3D-printed bourbon bottle tags. It uses Server Components with ISR throughout, a client-side cart context, and Supabase for the database.

### Data Sources

- **Shopify Storefront API** (`lib/shopify.ts`): All product/collection/cart data. Uses GraphQL via `graphql-request`. Functions: `getProducts`, `getProduct`, `getCollection`, cart mutations.
- **Shopify Admin API**: Order lookup for purchase verification (in API routes directly, not via `lib/shopify.ts`).
- **Supabase** (`lib/supabase.ts` anon, `lib/supabase-admin.ts` service role): Reviews, custom inquiries, pending review emails.

`supabase-admin.ts` imports `server-only` — it must never be imported from client components.

### Key Feature Areas

**Review System** — two pathways:
1. Verified: Shopify fulfillment webhook → `pending_review_emails` table → cron job sends email with HMAC token → `/reviews/[token]` → auto-approved on submit
2. Public: `/reviews` form → held for moderation → admin gets email with HMAC-signed approve/reject links → `/api/admin/reviews/approve|reject`

**Custom Tag Builder** (`/custom/build/`): Multi-step wizard using local React state (`WizardState` type from `lib/custom-inquiry-types.ts`). Uploads files to Supabase storage (`custom-inquiry-uploads` bucket), then submits to `/api/custom-inquiry` which emails the owner.

**Cart**: Client-side only via `CartProvider` context wrapping the root layout. Mutations go directly to Shopify Storefront API.

### Security Model

- No user authentication — access control is HMAC token-based
- `lib/admin-sig.ts` provides `makeAdminSig()` / `verifyAdminSig()` using `ADMIN_TOKEN_SECRET`
- Review submission tokens use `REVIEW_TOKEN_SECRET` (format: `order_id:email`)
- Cron routes check `Authorization: Bearer <CRON_SECRET>`
- Shopify webhook routes verify `X-Shopify-Hmac-SHA256` against `SHOPIFY_WEBHOOK_SECRET`

### Environment Variables

```
SHOPIFY_STORE_DOMAIN
SHOPIFY_STOREFRONT_ACCESS_TOKEN
SHOPIFY_ADMIN_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
REVIEW_TOKEN_SECRET
ADMIN_TOKEN_SECRET
CRON_SECRET
OWNER_EMAIL
NEXT_PUBLIC_SITE_URL
```

### Styling Conventions

Tailwind CSS with a custom military/bourbon theme defined in `tailwind.config.ts`:
- **Fonts**: `font-bebas` (headings, via CSS var `--font-bebas`), `font-inter` (body)
- **Colors**: `navy-*` (950–600), `amber-bourbon`, `olive-tactical`, `steel-*`
- **Utilities**: Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes

### Routing Notes

`next.config.mjs` has permanent redirects for old product URL slugs — check there before adding new redirects or changing product handles.

Image domains allowed: `cdn.shopify.com`, `res.cloudinary.com`.

### Tom's preferences
Tom will run all git push commands externally
