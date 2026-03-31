# Next.js Rendering Strategy

## force-dynamic ABSOLUTE BAN

### Rule
`export const dynamic = 'force-dynamic'` is **STRICTLY FORBIDDEN** in this project.

### Why
This CMS is designed to be blazing fast. `force-dynamic` sets `Cache-Control: no-store` on the HTTP response, which:
1. Disables all edge/CDN caching → every request hits the origin server
2. Prevents BFCache → browser makes a full page reload on back/forward navigation
3. Forces JS module re-initialization on every navigation (requires sessionStorage fallback for GcsImage cache)
4. Kills ISR (Incremental Static Regeneration) and all Next.js caching benefits

### What to Use Instead

| Scenario | Correct approach |
|---|---|
| Blog list / post pages | No `dynamic` export — rely on `revalidatePath()` for on-demand ISR |
| Sitemap | `export const revalidate = 3600` (hourly) |
| Preview (draft) pages | No `dynamic` export — Payload auth cookies cause Next.js to opt out of static rendering automatically |
| Any page needing fresh data | On-demand revalidation via `revalidatePath()` or `revalidateTag()` in API routes |

### Files Cleaned (2026-03-31)
- `src/app/sitemap.ts`
- `src/app/(frontend)/blog/page.tsx`
- `src/app/(frontend)/blog/[slug]/page.tsx`
- `src/app/(frontend)/blog/[slug]/preview/page.tsx`

### Key Insight
For preview pages that need always-fresh data: Payload's auth cookie lookup in `getPayload()` causes Next.js App Router to automatically treat the route as dynamic. No `force-dynamic` needed.

### Pitfall
A future developer might add `force-dynamic` to "fix" a stale cache issue. **Do not do this.** Instead, wire up on-demand revalidation via `revalidatePath()` called from Payload hooks or the `/api/revalidate` endpoint.
