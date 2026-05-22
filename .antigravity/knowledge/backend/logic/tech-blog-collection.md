# Tech Blog Collection & /dev Routes

## Implementation Pattern

Added a separate `tech-posts` Payload CMS collection for developer-focused blog content, served at `/dev/[slug]`. The existing `posts` collection and `/blog/[slug]` routes remain completely untouched.

### Architecture Decisions

- **Route Group**: `/dev` lives under the existing `(frontend)` route group instead of a separate `(tech)` group. This shares the layout.tsx (fonts, metadata, providers, CustomCursor, ProgressBar, MobileBottomNav) and avoids duplication.
- **Shared Fields**: Common blog fields are defined in `src/collections/fields/sharedBlogFields.ts` and used by `TechPosts.ts`. `Posts.ts` was NOT refactored (protected file).
- **Admin Sidebar**: `TechPosts` uses `admin.group: 'Blog'` for sidebar grouping. `Posts` remains ungrouped (top-level).
- **Component Reuse**: `PostArticle` and `BlogRecentStoriesClient` both accept an optional `basePath` prop (defaults to `/blog`), allowing `/dev` pages to pass `basePath="/dev"` for correct navigation links.

### Used Files

- `src/collections/fields/sharedBlogFields.ts` — Shared field definitions
- `src/collections/TechPosts.ts` — Collection definition (slug: 'tech-posts')
- `src/payload.config.ts` — Collection registration + neonBackup
- `src/app/(frontend)/dev/page.tsx` — List page
- `src/app/(frontend)/dev/[slug]/page.tsx` — Detail page
- `src/app/(frontend)/dev/[slug]/preview/page.tsx` — Live preview
- `src/app/(frontend)/dev/tag/[tag]/page.tsx` — Tag filter
- `src/app/(frontend)/blog/[slug]/PostArticle.tsx` — Added basePath prop
- `src/app/(frontend)/components/BlogRecentStoriesClient.tsx` — Added basePath prop
- `src/app/sitemap.ts` — Added /dev routes
- `src/app/api/revalidate/route.ts` — Added collection param support

### Process Flow

1. User creates a tech post in Payload Admin → "Tech Posts" in sidebar
2. `TechPosts` hooks auto-generate slug (via `translateToSlug`), publish date, and OG image
3. `afterChange` hook revalidates `/dev` and `/dev/[slug]` (local + production webhook)
4. Frontend pages fetch from `tech-posts` collection via Payload Local API
5. Sitemap includes `/dev/[slug]` entries

### Pitfalls

- **Payload migration vs dev mode**: Payload dev mode auto-pushes schema changes, causing `payload migrate` to fail on already-applied migrations. For new collections, direct SQL scripts or `payload push` may be safer than the migration system when dev mode has been used.
- **Type generation required**: After adding a new collection, `pnpm payload generate:types` must be run before build, otherwise TypeScript will reject the new collection slug string in `payload.find()` calls.
- **`_sideprojects` in tsconfig**: The `_sideprojects/` directory was not excluded from TypeScript compilation, causing unrelated build failures. Added to `tsconfig.json` exclude array.
- **Revalidation API extension**: The `/api/revalidate` route now accepts an optional `collection` field. `tech-posts` → revalidates `/dev` paths. Default → `/blog` paths (backwards compatible).
