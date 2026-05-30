# Dev Route CDN Caching & Lexical Image Resolution

### Implementation Pattern
Resolved a discrepancy between the local and production environments where inline Lexical images failed to appear on dynamic `/dev/[slug]` article pages. The solution addressed both Firebase App Hosting CDN caching and Next.js PayloadCMS resolver depth issues.

### Files Involved
- `next.config.ts`
- `src/app/(frontend)/dev/[slug]/page.tsx`

### Process Flow
1. **CDN Caching Fix**: Added standard dynamic cache-busting headers (`Cache-Control: no-store, must-revalidate`) for `/dev` and `/dev/:path*` routes inside `next.config.ts`, mirroring the pattern already established for `/blog` routes. This prevents Firebase App Hosting CDN from caching static pages and ignoring manual revalidation.
2. **Lexical Inline Image Node Resolution**: Bumped the retrieval `depth` from `1` to `2` in the dynamic post page query (`payload.find()`). This ensures that nested Lexical block structures (specifically custom image/upload nodes inside the dynamic `content` field) are fully expanded and resolved, containing their corresponding file path values rather than unresolved reference IDs.

### Gotchas / Notes
- **Next.js ISR vs CDN Cache**: Standard Next.js `revalidatePath()` only invalidates the internal Next.js Full Route Cache. On Firebase App Hosting, a CDN layer acts on top. Response headers must explicitly specify `no-store` for highly dynamic routes like preview paths or frequently updated blogs to bypass this edge caching layer.
- **Payload CMS Query Depth**: Embedded block types or custom components (like inline images/uploads in Lexical editor) require at least `depth: 2` to populate their nested structure. `depth: 1` will return unresolved relationships, showing empty visual areas on the frontend.
