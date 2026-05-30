# Noe Shiftica Bug History

### [2026-05-30 15:00] Bug: Missing GCS CORS Configuration causing image display failure
- **Error**: Media thumbnail and size preview images displayed as broken icons in both Admin list view and document detail view.
- **Root Cause**: The production Google Cloud Storage (Firebase Storage) bucket had no CORS (Cross-Origin Resource Sharing) configuration applied. When the browser attempted to load or decode GCS assets (`firebasestorage.googleapis.com`) directly from the Admin client-side domain (`noe-shiftica.com` or `localhost`), it was blocked by the browser's cross-origin security rules, resulting in rendering failure for newly uploaded GCS assets.
- **File(s) Modified**: `gcs-cors.json` (applied to bucket), `src/components/AdminThumbnailCell.tsx` (inserted debug logs).
- **Fix Summary**: Created a standard GCS CORS configuration file `gcs-cors.json` allowing wildcard origins (`*`) and all necessary methods/headers, and successfully applied it to the production GCS bucket using `gcloud storage`. Added robust `onLoad`/`onError` console logging to `AdminThumbnailCell.tsx` to simplify future diagnostics.
- **Prevention Note**: Always ensure CORS rules are set up on production GCS buckets when serving assets directly to frontend clients or Admin UIs.

### [2026-05-30 14:52] Bug: Admin Thumbnail Cell loading state freeze
- **Error**: Media thumbnail images in Admin list view remained invisible (stuck at opacity 0/loading shimmer) on some newly uploaded images.
- **Root Cause**: The component was checking for `img.complete` in `useLayoutEffect` and launching an asynchronous `img.decode()` Promise in `useEffect`. If `img.decode()` failed, timed out, or had a race condition with Fast Refresh, `loaded` remained `false` (hidden) because the transition relied on manual DOM manipulation `el.style.opacity = '1'` inside the non-fired or rejected callback.
- **File(s) Modified**: `src/components/AdminThumbnailCell.tsx`
- **Fix Summary**: Simplified the logic by removing manual DOM element style mutation and the fragile `img.decode()` hook. Replaced them with cache-aware React state initialization (`isUrlCached`) and standard `onLoad`/`complete` React properties, making it 100% robust against decode variations and rendering race conditions.
- **Prevention Note**: Avoid manual DOM mutation inside `useEffect` on React components. Rely on pure React states to control layouts/opacities. Avoid complex multi-layer decoders when native img triggers (`onLoad` + `img.complete`) are highly robust.

### [2026-03-20 XX:XX] Bug: Blog shows 0 articles in production
- **Error**: `Failed to fetch posts: Error: connect ECONNREFUSED 127.0.0.1:5432`
- **Root Cause**:
  1. `pg` Pool uses TCP connections and defaults to `localhost:5432` when `DATABASE_URL` is `undefined`. Firebase App Hosting (Cloud Run) does not inject secrets at build time, causing the DB query to fail silently.
  2. `export const revalidate = 12592000` caused the blog page to be statically cached at build time with 0 posts, persisting for ~145 days.
- **File(s) Modified**:
  - `src/lib/db.ts`
  - `src/app/(frontend)/blog/page.tsx`
  - `package.json`
- **Fix Summary**:
  - Replaced `pg` (TCP Pool singleton) with `@neondatabase/serverless` (HTTP-based, serverless-safe).
  - Changed `export const revalidate = 12592000` to `export const dynamic = 'force-dynamic'` to prevent stale build-time caching.
  - Moved `pg`/`@types/pg` to devDependencies (still used by local `check-sql-data.ts` script).
  - Added `@neondatabase/serverless` as a production dependency.
- **Prevention Note**:
  - Never use `pg` Pool directly in serverless environments (Firebase App Hosting / Cloud Run). Always use `@neondatabase/serverless`.
  - For pages that fetch DB data, avoid very long `revalidate` values. Use `force-dynamic` or on-demand revalidation (`revalidatePath`) instead.
  - After this code fix, manually verify `DATABASE_URL` secret is attached to the App Hosting backend: `firebase apphosting:secrets:describe DATABASE_URL`.

### [2026-03-14 23:45] Bug: Production Image Loading Failure & Slowness
- **Error**: Images were return 404 (Not Found) or 403 (Forbidden) in production. Some remained in 'pending' state forever. Hard refresh caused `ReferenceError: process is not defined`. CORS errors blocked direct GCS fetches.
- **Root Cause**:
  1. Missing critical environment variables (`NEXT_PUBLIC_SERVER_URL`, `GCS_BUCKET`) in `apphosting.yaml`.
  2. Firebase Storage rules were set to `allow read: if false`, blocking direct CDN access.
  3. Server-side proxying of images via `/api/media/file` caused timeouts and deadlocks (loopback) in Firebase App Hosting's serverless environment.
  4. Using `process.env` directly in client-side hooks without safety checks.
  5. Missing CORS configuration on the GCS bucket for the production domain.
- **File(s) Modified**:
  - `apphosting.yaml`
  - `storage.rules`
  - `src/lib/GcsImage.tsx`
  - `src/collections/Media.ts`
  - `cors.json` (applied via `gsutil`)
- **Fix Summary**:
  - Added necessary environment variables to `apphosting.yaml`.
  - Updated `storage.rules` to allow public read.
  - Implemented `afterRead` hooks in Payload to return direct Firebase Storage CDN URLs globally.
  - Bypassed Next.js and Payload image proxies in production for direct CDN serving.
  - Added safe guards for `process` in `GcsImage.tsx`.
  - Applied CORS policy to allow direct frontend fetches.
- **Prevention Note**:
  - **Environment**: Always triple-check the `apphosting.yaml` environment variables for production.
  - **Performance**: Never proxy binary data (images/videos) through a serverless function in production; use direct CDN/Storage URLs.
  - **Safe Env Checks**: Always use a safe wrapper like `(typeof process !== 'undefined' ? process.env : {})` for client-side environment variable access.
  - **CORS**: Remember to set GCS CORS when moving to direct-from-browser serving.
### [2026-03-15 01:00] Summary: Image Performance & Navigation Fixes
- **Issues Resolved**:
    1. **Direct CDN Access**: Bypassed proxies to target 0.1s loading from GCS.
    2. **FOIC (Flash of Invisible Content)**: Fixed flickering during hydration by ensuring SSR/Client source consistency and using a session-level URL cache.
    3. **BFCache Restoration**: Fixed images disappearing on "Back/Forward" buttons using `pageshow` listeners and `.complete` status checks.
- **Root Causes**: Source URL mismatches, React state reset on navigation, and `onLoad` not firing for cached assets.
- **Protocol**: Always check `img.complete` on mount and use `loadedUrls` Set for instant display in SPAs.

### [2026-03-17 21:50] Bug: AI Content Optimizer 500 Error & Secret Sync failure
- **Error**: Clicking "âœ¨ AI Content Optimizer" in Admin always returned HTTP 500. Backend logs showed `GEMINI_API_KEY present: false | Length: undefined`.
- **Root Cause**:
  1. **Body parsing failure**: `PayloadRequest` did not support Web API `.json()` in custom endpoints. Switched to `.text()` + `JSON.parse()`.
  2. **Secret Manager vs GUI Variable**: Environment variables set via the Firebase Console (GUI) are treated as plain env vars. If `apphosting.yaml` expects a secret (`secret: GEMINI_API_KEY`), but the value was set as a plain env var in the console, it fails to map correctly to `process.env` in the production runtime, resulting in `undefined`.
  3. **Terminal Hanging**: `firebase apphosting:secrets:set` is interactive by default. When run in an agentic/automated environment without TTY, it hangs waiting for a masked input that never comes.
- **File(s) Modified**:
  - `src/plugins/markdownImport/index.ts`, `src/lib/gemini.ts`, `src/plugins/markdownImport/BlogContentActions.tsx`, `apphosting.yaml`.
- **Fix Summary**: Fixed body parsing. Terminated hanging secret-set processes and refetched key via non-interactive command: `firebase apphosting:secrets:set GEMINI_API_KEY --force --data-file -`.
- **Prevention Note**:
  - **Secrets Management**: Never use the Firebase GUI for API keys/secrets. Use the CLI to register them in Secret Manager directly.
  - **Configuration Sync**: Ensure `apphosting.yaml` maps `variable: NAME` to `secret: NAME` correctly, and that the secret version actually exists in Secret Manager.
  - **Agentic CLI Handling**: Use `--force --data-file -` or piped input (`echo "val" | ...`) to avoid interactive/TTY hangups in automated scripts/agents.
  - **Payload Endpoints**: Always use `.text()` + `JSON.parse()` for body parsing in custom endpoints.
 
### [2026-03-18 00:00] Bug: AI Content Optimizer 403 Forbidden (Secret Not Attached)
- **Error**: Clicking "âœ¨ AI Content Optimizer" in Admin returned HTTP 500. Logs showed `status: 403, statusText: 'Forbidden'` from Gemini API despite API key existing in Secret Manager.
- **Root Cause**:
  - `GEMINI_API_KEY` was present in Google Cloud Secret Manager, but **not associated with the App Hosting backend**.
  - App Hosting results in an empty environment variable if the secret version exists but the backend lacks permission or the specific "attachment" via App Hosting commands.
- **File(s) Modified**:
  - `src/lib/gemini.ts` (added detailed error diag), `src/plugins/markdownImport/index.ts` (error propagation), `.antigravity/rules.md`.
- **Fix Summary**:
  - Re-registered the secret specifically using `firebase apphosting:secrets:set GEMINI_API_KEY`.
  - Confirmed and verified the attachment status using `firebase apphosting:secrets:describe`.
  - Added "API key working" local test script verification.
- **Prevention Note**:
  - **Verification**: Always run `firebase apphosting:secrets:describe [KEY]` to ensure the secret is ENABLED and recognized by the specific project/backend. Values in Secret Manager do NOT mean they are available to App Hosting by default.

### [2026-03-22 03:45] Bug: GoogleAnalytics Component Import Error
- **Error**: `Module '"./components/GoogleAnalytics"' has no exported member 'GoogleAnalytics'.`
- **Root Cause**: The component was created with a `default export`, but imported as a `named export` in `layout.tsx`.
- **File(s) Modified**: `src/app/(frontend)/layout.tsx`
- **Fix Summary**: Changed the import syntax from `{ GoogleAnalytics }` to `GoogleAnalytics`.
- **Prevention Note**: Always verify whether a new component uses `export default` or `export const` before writing the import statement in the layout.

### [2026-03-24 00:20] Bug: Magnetic Cursor Size Mismatch on Hover
- **Error**: The magnetic `<CustomCursor />` component appeared slightly smaller than the target buttons upon hover. It did not perfectly snap to the edges of the button.
- **Root Cause**: The CTA buttons had a CSS animation class `hover:scale-105`. The `<CustomCursor />` measures the element's `getBoundingClientRect()` width and height precisely at the moment of the `mouseover` event (which is before the transition visually completes). As the button scales up visually to 105%, the cursor remains stuck at 100% size, creating a gap between the cursor bounds and the physical button.
- **File(s) Modified**:
  - `src/app/(frontend)/services/page.tsx`
  - `src/app/(frontend)/services/scenarios/page.tsx`
  - `src/app/(frontend)/services/cms-content-operations/page.tsx`
- **Fix Summary**: Removed `hover:scale-105` (and its accompanying `transition-transform`) from the buttons. 
- **Prevention Note**: When using dynamic Javascript-based magnetic cursors that dynamically bind to an element's bounding rect, **avoid using CSS scaling transforms (`scale`) on hover** for those target elements. Doing so causes an inherent state/render mismatch unless the cursor also hooks into `ResizeObserver` or continuously polls the dimension changes (which harms performance).

### [2026-03-29 07:45] Bug: Blog Individual Page Hero Image Not Displayed in Production
- **Error**: Hero image on individual blog post pages (`/blog/[slug]`) shows `BlogFallbackHero` (blank) in production, while the same article's thumbnail displays correctly on the list page (`/blog`).
- **Root Cause**:
  1. **`force-static` + ISR timing mismatch**: The individual page was `force-static`, triggering ISR (on-demand static generation). When a post was first visited before its hero image was uploaded/attached in Payload CMS, the page was statically generated and CDN-cached WITHOUT the hero image.
  2. **Stale-while-revalidate window**: `revalidatePath` was called correctly on `afterChange`, but `x-nextjs-stale-time: 300` meant the CDN served the stale (no-image) version for up to 5 minutes before regenerating.
  3. **List page unaffected**: The blog list page uses `force-dynamic` which fetches fresh data on every request via direct SQL (`getPostsByStatus`), so thumbnails always reflect the latest DB state.
- **File(s) Modified**: `src/app/(frontend)/blog/[slug]/page.tsx`
- **Fix Summary**: Changed `export const dynamic` from `'force-static'` to `'force-dynamic'`. The page now fetches fresh data from Payload on every request, identical to the blog list page behavior.
- **Prevention Note**:
  - **Do NOT use `force-static` for content pages that may be updated post-publish** (e.g., adding images after the initial publish). Use `force-dynamic` instead.
  - The blog list page (`force-dynamic`) was always correct; the individual page had been inconsistent.
  - `generateStaticParams` is now effectively a no-op (ignored by `force-dynamic`), but left in place for potential future use.

### [2026-03-29 17:30] Bug: OG Image Not Appearing in Twitter/X Card Despite ogImage Field Being Set
- **Error**: Twitter/X card showed no image (or incorrect page URL as image) when sharing blog articles, even though `post.ogImage` was populated with a valid GCS URL.
- **Root Cause**:
  1. **Missing `post.ogImage` in metadata**: `page.tsx` line 51 used `cmd.og_image || coverImage.url`, skipping `post.ogImage` entirely.
  2. **Relative path in `customMetaData.og_image`**: Markdown frontmatter set `og_image` to a slug (e.g. `"want-to-mindset-anti-aging-science"`). With `metadataBase: new URL("https://noe-shiftica.com")` in layout, Next.js auto-prefixed this to a page URL, not an image URL.
  3. **All existing published posts had empty `ogImage`**: The `beforeChange` hook was added after articles were published, so existing posts never had `ogImage` populated.
- **File(s) Modified**: `src/app/(frontend)/blog/[slug]/page.tsx`
- **Fix Summary**:
  - Added `post.ogImage` as the second priority in the `ogImage` fallback chain (after `cmd.og_image`).
  - Added URL validation: `cmd.og_image` is only used if it starts with `http://` or `https://`; relative paths are discarded.
  - Batch-updated all 9 existing published posts with heroImage via Admin API to populate their `ogImage` field.
- **Prevention Note**:
  - Whenever adding a new auto-populated field, immediately backfill existing records.
  - `customMetaData` fields from Markdown frontmatter may contain slugs/relative paths. Always validate absolute URL before using as `og:image`.
  - `metadataBase` in layout will silently convert relative strings to absolute page URLs â€” this is a common footgun for OG images.

### [2026-03-29 08:00] Bug: Neon DB Backup Not Triggered on Article Create/Update
- **Error**: Neon DB backup branch was not updated when articles were created or modified via PayloadCMS admin. The backup only ran on code push to `main`.
- **Root Cause**:
  1. `neon-backup.yml` workflow only triggers on `push` to `main` â€” data changes in Payload admin are completely independent of code pushes.
  2. `NEON_API_TOKEN` and `NEON_PROJECT_ID` were not registered in `apphosting.yaml`, so any server-side Neon API calls from production would fail silently.
  3. The GitHub Actions workflow created the backup branch without specifying `parent_id`, relying on Neon's default (which happens to be primary, but was ambiguous).
- **File(s) Modified**:
  - `src/plugins/neon-backup/index.ts` (new file)
  - `src/payload.config.ts`
  - `apphosting.yaml`
  - `.github/workflows/neon-backup.yml`
- **Fix Summary**:
  - Created `neonBackupPlugin`: a Payload plugin that adds an `afterChange` hook to Posts. On every create/update, it calls the Neon API (fire-and-forget) to delete the old `backup/pre-deploy` branch and create a fresh fork from the primary branch.
  - Added `NEON_PROJECT_ID=proud-hall-53361784` to `.env.local` and `apphosting.yaml` (plain value).
  - Added `NEON_API_TOKEN` to `apphosting.yaml` as a Secret Manager reference.
  - Fixed `neon-backup.yml` to explicitly set `parent_id` to the primary branch ID when creating the backup.
- **Prevention Note**:
  - CMS data backups must be triggered by data events (Payload hooks), not code events (git push).
  - Always register all server-side API tokens in `apphosting.yaml` â€” `.env.local`-only vars won't be available in production.
  - Neon branch creation: always specify `parent_id` explicitly to avoid ambiguity.

### [2026-03-24 01:40] Bug: Shadow DOM CSS Scoping Conflict (Dark Theme not applying)
- **Error**: Embedded HTML content displayed with a white background instead of the intended dark theme, despite the CSS being present in the Shadow DOM.
- **Root Cause**:
  1. **Specificity Conflict**: The Shadow Host element (the wrapper `div` in React) had a Tailwind class `bg-transparent`. In CSS specificity rules, styles applied directly to an element from the outer document (like `bg-transparent`) override the internal `:host` styles from within the Shadow DOM.
  2. **Selector Mismatch**: Mapping the `#uploaded-content` ID to `:host` inside the Shadow DOM prevented the rule from reaching the internal root element. Since the host's background was forced to transparent, the intended dark background was lost.
- **File(s) Modified**:
  - `src/collections/HtmlFiles.ts`
  - `src/components/HtmlEmbedBlock.tsx`
- **Fix Summary**:
  - **Backend**: Updated `extractFromHtml` to transform the original `<body>` tag into a `<div id="uploaded-content">`.
  - **Backend**: Rewrote `body` CSS rules to target `#uploaded-content`.
  - **Frontend**: Stopped mapping `#uploaded-content` to `:host` inside the Shadow DOM's `<style>` tag. This allows the internal rule to target the internal root `div` directly, effectively bypassing the host-level transparent background override.
- **Prevention Note**: When styling the root of an embedded Shadow DOM, avoid relying solely on `:host` if the host element is subject to external layout/transparency classes. Instead, transform the content to have a specific root ID and target that ID internally to ensure style dominance within the container.

### [2026-03-30 00:00] Bug: Back/Forward Button Re-fetches Images from Server
- **Error**: On `/blog` (and any `force-dynamic` page), pressing the browser back/forward button caused all `GcsImage` components to show the shimmer/opacity-0 state and re-fetch images from the server, despite being loaded on a prior visit in the same browser session.
- **Root Cause**:
  1. `force-dynamic` pages receive `Cache-Control: no-store` in the HTTP response set by Next.js.
  2. Browsers cannot store pages with `no-store` in BFCache, so back/forward triggers a **full page reload** (not a BFCache restore).
  3. On full reload, all JavaScript module-level variables are re-initialized. The previous `loadedUrls = new Set<string>()` was reset to empty on every reload.
  4. `isLoaded` initialized to `false` â†’ `opacity: 0` and shimmer appeared for all images.
- **File(s) Modified**: `src/lib/GcsImage.tsx`
- **Fix Summary**:
  - Replaced single module-level `Set` with a **dual-layer cache**: in-memory `memoryLoadedUrls` Set + `sessionStorage` persistence (`gcs_loaded_urls` JSON array, capped at 200 entries).
  - `isUrlCached(url)`: checks memory first, then sessionStorage.
  - `markUrlAsLoaded(url)`: writes to both layers atomically.
  - `useState(() => isUrlCached(finalSrc))`: initializes from cache on mount â€” works even after full reload.
- **Prevention Note**:
  - **This pattern is now LAW â€” see `rules.md` Â§ 4-E**. All image cache state that must survive page reloads MUST use sessionStorage, not just in-memory variables.
  - `pageshow` with `event.persisted` only fires for genuine BFCache; it does NOT help on full reloads caused by `no-store`.
  - Never rely on module-level variables alone for state that must persist across `Cache-Control: no-store` page reloads.

### [2026-03-30] Bug: iOS Safari Vertical Scroll Locked in MobileFullscreenEditor
- **Error**: On actual iPhone (local dev + production), the fullscreen HTML editor textarea could not be scrolled vertically. Desktop mobile emulator worked fine.
- **Root Cause**:
  1. **Body scroll not locked**: `document.body` was not fixed when the overlay opened, so iOS Safari interpreted vertical swipes as body scroll bounce events and captured them before they reached the textarea.
  2. **`overflow-y` not explicit**: The textarea had no `overflowY` set (only `flex: 1`). iOS Safari does not reliably enable textarea internal scroll without explicit `overflow-y: scroll`.
  3. **Deprecated property**: `WebkitOverflowScrolling: 'touch'` is ignored on iOS 13+ and does nothing.
  4. **Payload drawer `preventDefault` interference** (decisive root cause): Payload CMS's built-in drawer component attaches a `touchmove` listener to the drawer and calls `preventDefault()` on it. This prevents the browser's default scroll behavior for ALL touchmove events bubbling up from inside the drawer â€” including those originating from the textarea â€” completely killing native textarea scroll even after the first three fixes were applied.
- **File(s) Modified**: `src/components/MobileFullscreenEditor/index.tsx`
- **Fix Summary**:
  - Added `useEffect` body scroll lock: `position: fixed`, `top: -${scrollY}px`, `overflow: hidden` on open; restore + `window.scrollTo` on close.
  - Replaced `WebkitOverflowScrolling: 'touch'` with `overflowY: 'scroll'` and `overscrollBehavior: 'contain'` on textarea.
  - Added `overflow: 'hidden'` to the fixed container div.
  - **Key fix**: Added `{ passive: false }` `touchmove` listener on textarea that calls `e.stopPropagation()`. This prevents the event from bubbling to Payload's drawer handler. `stopPropagation` (NOT `preventDefault`) is used â€” calling `preventDefault` would re-kill the textarea's own native scroll.
- **Prevention Note**:
  - Desktop emulators do NOT reproduce iOS Safari touch event capture issues â€” always test on real device.
  - For any `position: fixed` overlay inside a **Payload CMS drawer** with a scrollable child on iOS: (1) lock body scroll on open, (2) use `overflow-y: scroll` (not `auto`) on the inner scroll target, (3) add `overscroll-behavior: contain`, (4) attach `touchmove` listener with `stopPropagation` on the scrollable element (`{ passive: false }` required).
  - The scroll lock pattern must restore `window.scrollY` on close to avoid position jump.
  - `stopPropagation` vs `preventDefault`: never call `preventDefault` on the textarea's own touchmove â€” that kills its scroll. Only `stopPropagation` to block parent interference.
### [2026-03-31 22:15] Bug: Mobile Menu Close Button Flickering on Page Load
- **Error**: When the page loads, the menu close (X) button briefly flickers/appears for a split second on mobile devices, even when the menu is closed.
- **Root Cause**:
  1. **Redundant Components**: Both \MobileMenuButton.tsx\ and \MobileMenuOverlay.tsx\ rendered their own close buttons.
  2. **Hydration Mismatch**: \AnimatePresence\ and conditional rendering based on \isMobileMenuOpen\ (from context) was triggering briefly before the client-side state was fully synchronized (hydration).
  3. **Z-Index/Position Conflict**: The two buttons had different positions (\ottom-6\ vs \ottom-8\) and sizes (\w-10\ vs \w-14\), making the flicker more jarring as they occupied different spaces.
- **File(s) Modified**:
  - \src/components/MobileMenuButton.tsx\
  - \src/components/MobileMenuOverlay.tsx\
- **Fix Summary**:
  - **Unification**: Removed the close button from \MobileMenuOverlay.tsx\ and moved all visual state (Menu/X) to \MobileMenuButton.tsx\.
  - **Alignment**: Standardized the button size to \w-14 h-14\ and position to \ottom-8 left-8\ for both states.
  - **Hydration Gate**: Added \isMounted\ check to both components to prevent rendering any UI before the client is ready.
  - **Stacking**: Increased \MobileMenuButton\ zIndex to \10001\ to float over the overlay.
- **Prevention Note**:
  - Always use \isMounted\ guards for floating mobile UI and overlays to prevent hydration-induced flickering.
  - Avoid redundant 
Close buttons in separate components; let the primary toggle component own the visual transition.

### [2026-04-02 18:00] Bug: Admin relationship/upload fields return 401 in production build (`pnpm start`)
- **Error**: `ERROR: There was an error building form state` / `Unauthorized, you must be logged in to make this request.` (status 401). Triggered by clicking any relationship or upload field (e.g., heroImage "Create New", author selector) in the Payload admin panel.
- **Root Cause**: `payload.config.ts` used `process.env.PAYLOAD_PUBLIC_SERVER_URL` as the primary source for `serverURL`, but `.env.local` only defines `NEXT_PUBLIC_SERVER_URL`. When running `pnpm start`, `NODE_ENV=production`, so the fallback resolved to `'https://noe-shiftica.com'`. Payload's admin UI client-side components then sent API requests (`/api/users`, `/api/media`, etc.) to the production domain instead of `localhost:3000`. Since the browser's auth cookies are scoped to `localhost`, they were not sent to `noe-shiftica.com`, causing 401.
- **File(s) Modified**: `src/payload.config.ts`
- **Fix Summary**: Added `process.env.NEXT_PUBLIC_SERVER_URL` as a fallback between `PAYLOAD_PUBLIC_SERVER_URL` and the NODE_ENV-based hardcoded URL. The `serverURL` priority chain is now: `PAYLOAD_PUBLIC_SERVER_URL` â†’ `NEXT_PUBLIC_SERVER_URL` â†’ hardcoded fallback.
- **Prevention Note**:
  - `pnpm dev` sets `NODE_ENV=development`, so the fallback was always `http://localhost:3000` â€” this masked the bug entirely during normal development.
  - `pnpm start` sets `NODE_ENV=production`, so the fallback was `https://noe-shiftica.com` â€” any relationship/upload field in admin would 401.
  - Always ensure `payload.config.ts` `serverURL` reads from the same env variable defined in `.env.local`. The canonical variable for this project is `NEXT_PUBLIC_SERVER_URL`.
  - This bug is silent in production (Firebase App Hosting) because `apphosting.yaml` defines `NEXT_PUBLIC_SERVER_URL` pointing to the correct domain.

### [2026-05-08 XX:XX] Bug: Blog Post Page Returns 404 After ISR Re-generation
- **Error**: Individual blog post pages (`/blog/[slug]`) showed correctly right after publish, but became 404 after on-demand ISR revalidation triggered by `revalidatePath`.
- **Root Cause**:
  1. **Missing `overrideAccess: true`**: All `payload.find()` calls in `blog/[slug]/page.tsx` lacked `overrideAccess: true`. ISR background regeneration workers have no authenticated user context. Payload v3 Local API applies collection access control based on the caller's context. Without `overrideAccess`, the query may return 0 docs even for published posts.
  2. **No distinction between DB errors and "post not found"**: If `payload.find()` threw an error or returned empty due to Neon cold start / timeout, the code immediately called `notFound()`, caching a 404 page. All future requests then served the cached 404 until next revalidation (which would also 404, perpetuating the cycle).
  3. **Missing `draft: false`**: Not explicitly setting `draft: false` left open the possibility of draft version interference in Payload v3's versioning system.
  4. **Context asymmetry**: `blog/page.tsx` uses raw SQL (`getPostsByStatus`) and bypasses Payload entirely â€” always worked. `blog/[slug]/page.tsx` used `payload.find()` â€” failed during ISR.
- **File(s) Modified**: `src/app/(frontend)/blog/[slug]/page.tsx`
- **Fix Summary**:
  - Added `overrideAccess: true` to ALL `payload.find()` calls in `BlogPostPage` and `generateStaticParams` and `generateMetadata`.
  - Added `draft: false` explicitly to the main post fetch.
  - Wrapped the main `payload.find()` in try/catch: DB errors `throw` (preserving stale cached page), while `notFound()` is only called when the query succeeds but returns 0 docs (post genuinely not published).
  - Added `console.error` / `console.warn` for Cloud Run log diagnostics.
- **Prevention Note**:
  - **ALWAYS add `overrideAccess: true` to `payload.find()` calls in Server Components and ISR paths.** The Local API runs server-side and does not need user-level access control for public content reads.
  - **Never call `notFound()` inside a bare `payload.find()` without try/catch.** DB errors and "not found" are different failure modes; conflating them causes 404 cache poisoning.
  - The blog list page (`blog/page.tsx`) uses raw SQL as a workaround â€” the individual post page now correctly uses `overrideAccess: true` to achieve equivalent reliability through the Payload Local API.

### [2026-05-12 00:00] Bug: Blog list loses new article ~10 minutes after publish
- **Error**: Newly published article disappears from /blog list after ~10 minutes. DB status remains `published` throughout.
- **Root Cause**: `blog/page.tsx` catches DB errors silently (no `throw`). When `getPostsByStatus('published')` throws during ISR re-render (e.g., Neon cold start after idle period), the catch block swallows the error, `posts` stays `[]`, and the "No articles yet" empty page is written to the Full Route Cache. This empty page is then served until the next successful revalidation.
- **File(s) Modified**: `src/app/(frontend)/blog/page.tsx`
- **Fix Summary**: Added `throw error` in the catch block. When DB fails during ISR re-render, Next.js now preserves the stale cached page (which still shows the article) instead of caching the empty result. This matches the established pattern in `blog/[slug]/page.tsx` and the knowledge base ISR error handling rules.
- **Prevention Note**:
  - ALL ISR server components that fetch DB data must THROW on error, never swallow silently.
  - Silent catches cause "cache poisoning" â€” the bad state (empty page) gets cached and persists.
  - Pattern: `console.error("[ISR][/route] DB failed â€” preserving stale cache:", error); throw error;`
  - Reference: `.antigravity/knowledge/frontend/logic/nextjs-rendering-strategy.md` (ISR error handling section)

### [2026-05-15] Bug: Blog list loses articles again (~10 min after publish) â€” regression
- **Error**: Same symptom as 2026-05-12: `/blog` list page shows "No articles yet" ~10 minutes after a new post is published. DB and individual post pages unaffected.
- **Root Cause**: The `throw error` fix from commit `80b3926` was absent from the snapshot commit `76fe4b7` created during a git cleanup/reorganization. The catch block in `blog/page.tsx` reverted to silently swallowing DB errors, causing ISR cache poisoning (empty `posts = []` written to Full Route Cache on Neon cold start).
- **Confirmed via logs**:
  - `Error: Connection terminated unexpectedly` (2026-05-14 10:49) â€” DB connection drop during ISR
  - `[ISR][blog/...] payload.find succeeded but returned 0 docs` â€” recurring individual post ISR issue (separate)
- **File(s) Modified**: `src/app/(frontend)/blog/page.tsx`
- **Fix Summary**: Re-added `throw error` (with `[ISR][/blog]`-prefixed console.error) to the catch block. Commit `12f71e2`.
- **Prevention Note**:
  - **This is a regression from a git reorganization.** Whenever large git restructuring (branch merges, snapshots, rebases) is done, verify that `blog/page.tsx` catch block still contains `throw error`.
  - The correct pattern is immutable: `console.error("[ISR][/blog] DB query failed â€” preserving stale cache:", error); throw error;`
  - Consider adding a lint rule or test to prevent silent catch in ISR server components.

### [2026-05-19] Bug: Blog list reverts to build-time snapshot after ~10 min inactivity
- **Error**: Blog list shows old article titles and missing recent posts ~10 minutes after publish. Local dev always shows correct data.
- **Root Cause**: `minInstances: 0` in `apphosting.yaml` causes Cloud Run to scale to zero after ~10 minutes of no traffic. New instance boots with the build-time static `.next/` artifact (old snapshot). The ISR-updated in-memory cache is ephemeral and lost on scale-to-zero. Additionally, Neon DB also cold-starts simultaneously, causing ISR background re-renders to fail, making `throw error` preserve the build-time (old) snapshot for even longer.
- **File(s) Modified**: `src/app/(frontend)/blog/page.tsx`
- **Fix Summary**: Added `unstable_noStore()` (imported as `noStore`) at the top of `BlogPage()`. This opts the page out of Next.js Full Route Cache entirely, forcing a live DB query on every request. This is safe because: (1) `Cache-Control: no-store` is already set in `next.config.ts` for `/blog`, so no CDN caching is introduced; (2) `getPostsByStatus` uses `@neondatabase/serverless` (HTTP-based, serverless-safe).
- **Prevention Note**:
  - With `minInstances: 0`, any ISR cache is ephemeral. Pages that must reflect live CMS data and already have `no-store` HTTP headers should use `unstable_noStore()` rather than relying on ISR + `revalidatePath`.
  - `unstable_noStore()` is the project-established pattern for opting out of caching without the banned `force-dynamic` keyword (see `preview/page.tsx`).
  - The `throw error` in the catch block is still correct â€” if DB fails on a dynamic request, the error propagates to the user (brief error), which is better than persistently serving 10-minute-old data.

### [2026-05-15] Bug: payload.find returns 0 docs for old/renamed slugs (daily ISR log noise + SEO risk)
- **Error**: `[ISR][blog/why-rich-and-luxury-websites-are-obsolete] payload.find succeeded but returned 0 docs.` â€” appearing almost daily in Cloud Run logs.
- **Root Cause**: Post id=19 had its slug renamed from `why-rich-and-luxury-websites-are-obsolete` to `rich-lavish-websites-outdated-reason`. The old URL remained in the Next.js ISR cache and was being re-crawled daily by Google bots. Each visit triggered an ISR background re-render â†’ `payload.find` found no post with the old slug â†’ `notFound()` â†’ 404 cached. The other 3 failing slugs (`freelancer-vs-noeshiftica-web-production-guide`, `freelancer-website-total-cost`, `why-neo-shiftica-is-affordable-and-fast`) had no records in `posts` OR `_posts_v` â€” completely stale/deleted routes returning correct 404s.
- **File(s) Modified**: `next.config.ts`
- **Fix Summary**: Added a permanent (301) redirect from `/blog/why-rich-and-luxury-websites-are-obsolete` to `/blog/rich-lavish-websites-outdated-reason` in `next.config.ts`. Google will pass link equity to the canonical URL and stop crawling the old one.
- **Prevention Note**:
  - When a post's slug is changed in PayloadCMS admin, the old URL is NOT automatically redirected. Always add a redirect in `next.config.ts` when renaming a post that may be indexed or linked externally.
  - `revalidatePath` only handles the NEW slug; the old slug cache persists until a visitor/bot triggers ISR re-render (which correctly 404s, but wastes crawl budget).
  - The 3 other failing slugs (no DB records) return 404 correctly â€” no action needed.

### [2026-05-22 22:05] Bug: duplicate 'post' variable declaration build error in dev/[slug]/page.tsx
- **Error**: the name \post\ is defined multiple times
- **Root Cause**: While introducing slug history check, \let post = posts.docs?.[0] || null;\ was defined near the top. However, the original declaration \const post = posts.docs[0];\ near the bottom of the fetch block was left behind, resulting in a duplicate local scope variable definition error during build.
- **File(s) Modified**: \src/app/(frontend)/dev/[slug]/page.tsx\`n- **Fix Summary**: Deleted the duplicate \const post = posts.docs[0];\ line so that the rest of the component uses the properly checked \post\ variable declared above.
- **Prevention Note**: Always double-check block-scoped variable declarations when updating fetch flow structures to ensure no stray old assignments remain.

### [2026-05-24 XX:XX] Bug: sessions.md ã�« UTF-16 LE ã�Œæ··å…¥ã�—ã�¦æ–‡å­—åŒ–ã�‘
- **Error**: sessions.md ã�® 2026-05-17 ã‚»ãƒƒã‚·ãƒ§ãƒ³ä»¥é™�ã�Œ "# # # [ 2 0 2 6..." ã�®ã‚ˆã�†ã�ªæ–‡å­—åŒ–ã�‘ã�§è¡¨ç¤ºã�•ã‚Œã‚‹ã€‚null ãƒ�ã‚¤ãƒˆã�Œ 480 å€‹æ··åœ¨ã€‚
- **Root Cause**: ä½•ã‚‰ã�‹ã�®ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã�§ PowerShell ã�® `Out-File` ã�¾ã�Ÿã�¯ Claude Code ã�®æ›¸ã��è¾¼ã�¿ã�Œ UTF-16 LE ã‚¨ãƒ³ã‚³ãƒ¼ãƒ‡ã‚£ãƒ³ã‚°ã�§ sessions.md ã�«è¿½è¨˜ã�—ã�Ÿã€‚UTF-8 ãƒ•ã‚¡ã‚¤ãƒ«ã�®é€”ä¸­ï¼ˆbyte 24574ï¼‰ã�‹ã‚‰ UTF-16 LE ãƒ�ã‚¤ãƒˆåˆ—ã�Œæ··å…¥ã€‚
- **File(s) Modified**: `.antigravity/sessions.md`
- **Fix Summary**: ãƒ�ã‚¤ãƒˆè§£æž�ã�§æ··å…¥ä½�ç½®ã‚’ç‰¹å®šï¼ˆ24574 bytesç›®ï¼‰ã�—ã€�UTF-16 LE éƒ¨åˆ†ï¼ˆ24574ã€œ26329ï¼‰ã‚’ Python ã�® `[System.Text.Encoding]::Unicode.GetString()` ã�§ãƒ‡ã‚³ãƒ¼ãƒ‰ã�—ã�¦ UTF-8 ã�«çµ±å�ˆã€‚WriteAllText ã�§ BOM ã�ªã�— UTF-8 ã�¨ã�—ã�¦å†�æ›¸ã��è¾¼ã�¿ã€‚
- **Prevention Note**: PowerShell ãƒ—ãƒ­ãƒ•ã‚¡ã‚¤ãƒ«ã�« `$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8NoBOM'` ã‚’è¿½åŠ ã�—ã�¦ã€�ã�™ã�¹ã�¦ã�® Out-File/Set-Content/Add-Content ã�®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚¨ãƒ³ã‚³ãƒ¼ãƒ‡ã‚£ãƒ³ã‚°ã‚’ UTF-8 NoBOM ã�«å›ºå®šã�™ã‚‹ã�“ã�¨ã€‚Claude Code global settings.json ã�« `"env": { "PYTHONUTF8": "1" }` ã‚’è¿½åŠ ã�—ã�¦ Python ã‚µãƒ–ãƒ—ãƒ­ã‚»ã‚¹ã�® encoding ã‚‚ UTF-8 ã�«å›ºå®šã€‚

### [2026-05-24 XX:XX] Bug: Anti-Gravity CLI (Claude Code) ã�Œ Windows ã�§é€”ä¸­ãƒ•ãƒªãƒ¼ã‚º
- **Error**: Claude Code ã�Œå®Ÿè¡Œä¸­ã�«å…¥åŠ›ã‚’å�—ã�‘ä»˜ã�‘ã�ªã��ã�ªã‚Šãƒ•ãƒªãƒ¼ã‚ºã�™ã‚‹ã€‚
- **Root Cause**: v2.1.30+ ã�§å°Žå…¥ã�•ã‚Œã�Ÿ useInterval ãƒ™ãƒ¼ã‚¹ã�®ã‚¢ãƒ‹ãƒ¡ãƒ¼ã‚·ãƒ§ãƒ³ãƒ•ãƒƒã‚¯ã�Œ Windows Terminal ã�® ConPTY ãƒ¬ã‚¤ãƒ¤ãƒ¼ã�§æ€¥é€Ÿã�ª ANSI ã‚·ãƒ¼ã‚±ãƒ³ã‚¹æ›¸ã��è¾¼ã�¿ã‚’ç™ºç”Ÿã�•ã�›ã€�React ã�®å†�ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã�Œ ConPTY ã‚’åœ§å€’ã�™ã‚‹ï¼ˆGitHub issue #23211, #27360ï¼‰ã€‚ã�¾ã�Ÿã€�v2.1.124+ ã�§æ—¥æœ¬èªžãƒ­ã‚±ãƒ¼ãƒ«ç’°å¢ƒã�§ã�® PowerShell ãƒ„ãƒ¼ãƒ«ã�®ã‚³ãƒžãƒ³ãƒ‰ãƒ©ã‚¤ãƒ³æ§‹ç¯‰ã�« regression ã�Œç™ºç”Ÿï¼ˆissue #55727ï¼‰ã€‚
- **File(s) Modified**: `~/.claude/settings.json`ï¼ˆPYTHONUTF8 è¿½åŠ ï¼‰
- **Fix Summary**: 
  1. `~/.claude/settings.json` ã�« `env.PYTHONUTF8=1` ã‚’è¿½åŠ ï¼ˆPython ã‚µãƒ–ãƒ—ãƒ­ã‚»ã‚¹ã�®æ–‡å­—åŒ–ã�‘é˜²æ­¢ï¼‰
  2. PowerShell ãƒ—ãƒ­ãƒ•ã‚¡ã‚¤ãƒ«ã�« `chcp 65001`ã€�`$PSDefaultParameterValues` ã‚¨ãƒ³ã‚³ãƒ¼ãƒ‡ã‚£ãƒ³ã‚°ã€�`$env:PYTHONUTF8='1'`ã€�`$env:TERM='xterm-256color'` ã‚’è¿½åŠ ï¼ˆâ†’ãƒ¦ãƒ¼ã‚¶ãƒ¼æ‰‹å‹•é�©ç”¨ã�Œå¿…è¦�ï¼‰
  3. ConPTY ãƒ•ãƒªãƒ¼ã‚ºæœ¬ä½“ã�¯ Anthropic å�´ã�® upstream ä¿®æ­£å¾…ã�¡ã€‚å›žé�¿ç­–: ãƒ•ãƒªãƒ¼ã‚ºæ™‚ã�¯ `claude --resume` ã�§å†�é–‹ã€‚ã‚»ãƒƒã‚·ãƒ§ãƒ³ä¸­ã�¯å®šæœŸçš„ã�« `/compact` å®Ÿè¡Œã€‚
- **Prevention Note**: ãƒ•ãƒªãƒ¼ã‚ºã�—ã�Ÿã‚‰ Ctrl+C â†’ `claude --resume` ã�§ä¼šè©±ã‚’ç¶™ç¶šã�§ã��ã‚‹ã€‚é•·ã�„å‡¦ç�†ä¸­ã�¯å®šæœŸçš„ã�« `/compact` ã‚’ä½¿ã�£ã�¦ context ã‚’åœ§ç¸®ã�™ã‚‹ã�“ã�¨ã€‚

### [2026-05-29 10:30] Bug: Lexical editor ã�§ Blockquote ã�Œ + ãƒœã‚¿ãƒ³/ã‚¹ãƒ©ãƒƒã‚·ãƒ¥ã‚³ãƒžãƒ³ãƒ‰ã�‹ã‚‰æŒ¿å…¥ã�§ã��ã�ªã�„
- **Error**: PayloadCMS admin ã�® Lexical ã‚¨ãƒ‡ã‚£ã‚¿ã�§ã€Œ+ã€�ãƒœã‚¿ãƒ³ã‚„ã‚¹ãƒ©ãƒƒã‚·ãƒ¥ã‚³ãƒžãƒ³ãƒ‰ã�‹ã‚‰ã€Œãƒ–ãƒ­ãƒƒã‚¯ã‚¯ã‚©ãƒ¼ãƒˆã€�ã‚’æŒ¿å…¥ã�§ã��ã�ªã�„ï¼ˆCodeBlock ãƒ—ãƒ©ã‚°ã‚¤ãƒ³ä½œæˆ�ä¸­ã�«ç™ºè¦šï¼‰ã€‚
- **Root Cause**:
  1. `payload.config.ts` ã�® `lexicalEditor()` ã�® `features` å¼•æ•°ã�Œã€�æŽ¨å¥¨ã�®é–¢æ•°ã‚³ãƒ¼ãƒ«ãƒ�ãƒƒã‚¯å½¢å¼� `({ defaultFeatures }) => [...defaultFeatures, ...]` ã�‹ã‚‰ã€�`defaultEditorFeatures` ã‚’ç›´æŽ¥ import ã�—ã�¦ spread ã�™ã‚‹é…�åˆ—å½¢å¼�ã�«åˆ‡ã‚Šæ›¿ã‚�ã�£ã�¦ã�„ã�Ÿã€‚
  2. ã��ã�®ä¸Šã�§ `BlockquoteFeature()`, `UploadFeature({...})`, `HorizontalRuleFeature()` ã�Œ `defaultEditorFeatures` ã�«æ—¢ã�«å�«ã�¾ã‚Œã�¦ã�„ã‚‹ã�®ã�«äºŒé‡�ç™»éŒ²ã�•ã‚Œã�¦ã�„ã�Ÿã€‚`loader.js` ã�® dedup ãƒ­ã‚¸ãƒƒã‚¯ï¼ˆ"å¾Œå‹�ã�¡"ï¼‰ã�«ã‚ˆã‚Š defaultFeatures å�´ã�®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã�Œæ�¨ã�¦ã‚‰ã‚Œã€�ãƒ¦ãƒ¼ã‚¶ãƒ¼å®šç¾©ã�®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã�«ç½®ã��æ�›ã‚�ã‚‹ã€‚ç‰¹ã�« `UploadFeature({ collections: { media: { fields: [] } } })` ã�¯ default ã�® sensible ã�ªãƒ•ã‚£ãƒ¼ãƒ«ãƒ‰æ§‹æˆ�ã‚’ç©ºé…�åˆ—ã�§ä¸Šæ›¸ã��ã�—ã�¦ã�Šã‚Šã€�`BlocksFeature` å�«ã‚€å¾Œæ®µã�® feature è§£æ±ºã�«å‰¯ä½œç”¨ã�Œå‡ºã�¦ã�„ã�Ÿå�¯èƒ½æ€§ã�Œé«˜ã�„ï¼ˆ`generate:importmap` ã�§ `BlocksFeatureClient` ã‚¨ãƒ³ãƒˆãƒªã�Œæ›¸ã��è¾¼ã�¾ã‚Œã�ªã�„ç—‡çŠ¶ã�§ç¢ºèª�ï¼‰ã€‚
- **File(s) Modified**: `src/payload.config.ts`, `src/app/(payload)/admin/importMap.js`
- **Fix Summary**:
  1. `features: ({ defaultFeatures }) => [...defaultFeatures, ...]` å½¢å¼�ã�«æˆ»ã�—ã�Ÿï¼ˆæŽ¨å¥¨ãƒ‘ã‚¿ãƒ¼ãƒ³ï¼‰ã€‚
  2. äºŒé‡�ç™»éŒ²ã�® `BlockquoteFeature()` / `UploadFeature({...})` ã‚’å‰Šé™¤ã€‚`HorizontalRuleFeature()` ã�¯å…ƒã�® config ã�«æ—¢ã�«æ˜Žç¤ºç™»éŒ²ã�•ã‚Œã�¦ã�„ã�Ÿã�Ÿã‚�ç¶­æŒ�ã€‚
  3. æœªä½¿ç”¨ import (`defaultEditorFeatures`, `UploadFeature`, `BlockquoteFeature`, `CodeBlock`) ã‚’å‰Šé™¤ã€‚
  4. `pnpm payload generate:importmap` ã‚’å®Ÿè¡Œã�—ã�¦ `importMap.js` ã‚’å†�ç”Ÿæˆ�ã€‚
- **Prevention Note**:
  - Payload v3 ã�® `lexicalEditor({ features })` ã�¯ **é–¢æ•°ã‚³ãƒ¼ãƒ«ãƒ�ãƒƒã‚¯å½¢å¼�ã‚’ä½¿ã�†ã�“ã�¨**ã€‚`defaultEditorFeatures` ã�®ç›´æŽ¥ sprea### [2026-05-30 01:40] Bug: Custom Monaco Code Block button does not appear or fails to insert in editor toolbar
- **Error**:
  1. The custom toolbar button to insert the Monaco Code Block did not render.
  2. Once rendered, clicking it threw: `Failed to insert Monaco Code Block node: Error: parseEditorState: type "block" not found`.
  3. Once selection issues were fixed, dispatching a newly created `INSERT_BLOCK_COMMAND` still resulted in no reaction.
- **Root Cause**:
  1. **Visual Mismatch / DOM Injection Failure**: Attempting to force-inject button elements via React portals / DOM manipulation directly into `.fixed-toolbar` fails visually because the container has `overflow: hidden`, clipping out any injected elements.
  2. **Double Package Loading Mismatch**: The button click handler imported standard Lexical functions directly from the `"lexical"` package. Due to Next.js (Turbopack/Webpack) bundler dependency resolution and multiple `node_modules` symlinks (via pnpm), a second duplicate instance of `"lexical"` got loaded in the browser. Therefore:
     - `$parseSerializedNode` traversed a completely empty node registry map (belonging to the duplicate bundle) instead of the active editor's registry, throwing a `"type block not found"` error.
     - Creating a custom `INSERT_BLOCK_COMMAND` made a unique object reference belonging to the duplicate bundle, causing Payload's built-in `BlocksPlugin` handler to ignore the dispatched command.
     - Clicking the button without `onMouseDown={(e) => e.preventDefault()}` moved browser focus to the button element, destroying the editor's active RangeSelection before the click event fired.
- **File(s) Modified**: `src/features/markdownPaste/client.tsx`
- **Fix Summary**:
  - **Official Integration**: Refactored the toolbar button to use Payload's official `toolbarFixed.groups` API, mimicking the working `HtmlSource` pattern.
  - **Focus Preservation**: Added `onMouseDown={(e) => e.preventDefault()}` to the button, ensuring the active selection state remains completely intact on the editor.
  - **Unified Proxy Imports**: Unified all core Lexical imports in `client.tsx` to use Payload's shared proxy export `"@payloadcms/richtext-lexical/lexical"` instead of raw `"lexical"`.
  - **AST Insertion**: Restored the original, clean `$parseSerializedNode` insertion flow. With duplicate bundles eliminated, `$parseSerializedNode(blockNode)` successfully resolves Payload's registered `'block'` type and inserts it instantly via `$insertNodes`.
- **Prevention Note**:
  - In Payload CMS Lexical plugin environments, **always import standard Lexical core functions from "@payloadcms/richtext-lexical/lexical"** rather than importing raw `"lexical"`. Doing so avoids package duplication in bundlers, resolving type mismatch and command-dispatch issues natively.
½åŠ ã�™ã‚‹éš›ã�¯ã€�`admin.importMap.generators` ã�« `BlocksFeatureClient` æ˜Žç¤ºç™»éŒ²ã‚¸ã‚§ãƒ�ãƒ¬ãƒ¼ã‚¿ãƒ¼ã‚’å�ˆã‚�ã�›ã�¦è¿½åŠ ã�™ã‚‹ã�“ã�¨ã€‚
  - `generate:importmap` å®Ÿè¡Œå¾Œã�« `grep BlocksFeatureClient src/app/(payload)/admin/importMap.js` ã�§ç™»éŒ²ç¢ºèª�ã�™ã‚‹ã�“ã�¨ã€‚

### [2026-05-30 01:40] Bug: Custom Monaco Code Block button does not appear or fails to insert in editor toolbar
- **Error**:
  1. The custom toolbar button to insert the Monaco Code Block did not render.
  2. Once rendered, clicking it threw: `Failed to insert Monaco Code Block node: Error: parseEditorState: type "block" not found`.
- **Root Cause**:
  1. **Visual Mismatch / DOM Injection Failure**: Attempting to force-inject button elements via React portals / DOM manipulation directly into `.fixed-toolbar` fails visually because the container has `overflow: hidden`, clipping out any injected elements.
  2. **Insertion API Mismatch**: The button click handler used Lexical's `$parseSerializedNode` on raw `{ type: 'block' }` serialized state. In some client contexts (or toolbar scopes), the active `editor` does not have the `BlockNode` schema fully populated in its parsing registry, causing Lexical to throw a "type 'block' not found" error.
- **File(s) Modified**: `src/features/markdownPaste/client.tsx`
- **Fix Summary**:
  1. **Official Integration**: Refactored the toolbar button to use Payload's official `toolbarFixed.groups` API, mimicking the working `HtmlSource` pattern, ensuring native fixed toolbar integration and perfect visual layout.
  2. **Native Command Dispatch**: Replaced low-level `$parseSerializedNode` parsing with Lexical's native `INSERT_BLOCK_COMMAND` (dispatched on the active editor context). Payload's built-in `BlocksPlugin` catches this and uses its registered internal React classes, bypassing serialized node schema resolution.
- **Prevention Note**:
  - Always register custom toolbar buttons using the official `toolbarFixed` or `toolbarInline` schemas to avoid layout/overflow issues with direct DOM portals.
  - When programmatically inserting custom Blocks from toolbar buttons or plugins, **do NOT manually parse serialized JSON block nodes**. Always dispatch `INSERT_BLOCK_COMMAND` (specifically, `const INSERT_BLOCK_COMMAND = createCommand<any>('INSERT_BLOCK_COMMAND')`) with `{ blockType, ...fields }` to leverage Payload's native block insertion orchestration.

### [2026-05-30 01:50] Bug: HTML Source exit throws "Create node: Type horizontalrule ... does not match registered node"
- **Error**: Returning from HTML Source Mode to Rich Text Mode throws: `Error: Create node: Type horizontalrule in node Nt does not match registered node _e with the same type` in `htmlToLexical (conversion.ts:133)`.
- **Root Cause**: The HTML conversion logic parsed DOM nodes via Lexical's `$generateNodesFromDOM`. PayloadCMS v3 registers its own custom `HorizontalRuleNode` implementation (inside `@payloadcms/richtext-lexical`'s compilation scope) instead of using the default Lexical HorizontalRuleNode. When `$generateNodesFromDOM` encounters an `<hr>` tag, its hardcoded internal mapping rules attempt to instantiate the default standard HorizontalRuleNode. Since this standard class differs from the custom horizontal rule registered on the editor instance, Lexical throws a strict type/class mismatch error.
- **File(s) Modified**: `src/plugins/htmlSource/conversion.ts`, `src/plugins/htmlSource/feature.client.tsx`
- **Fix Summary**:
  - **DOM-level Bypass**: Implemented a regex preprocessor that replaces all `<hr>` tags with simple `<p>__OJE_HR_PLACEHOLDER__</p>` paragraphs before DOMParser runs, preventing `$generateNodesFromDOM` from ever triggering standard HorizontalRuleNode class resolution.
  - **AST Reconstruction**: After inserting the generated nodes into the Lexical editor, the postprocessor traverses the root nodes, detects the `__OJE_HR_PLACEHOLDER__` paragraph, and dynamically replaces it with a genuine HorizontalRuleNode using the editor's active schema resolution: `$parseSerializedNode({ type: 'horizontalrule', version: 1 })`.
  - Commented out verbose console logs and console groups in `conversion.ts` and `feature.client.tsx` to clean up output noise while retaining them for future developer debugging.
- **Prevention Note**:
  - Standard Lexical HTML generator mapping rules (`$generateNodesFromDOM`) are rigid. If a CMS/framework registers a custom implementation of a default block (such as HorizontalRule), parsing DOM representations directly will trigger type mismatch errors.
  - To solve this, **always bypass DOM-level generation of conflicting native nodes** by converting them into plain placeholders, then restore them securely via `$parseSerializedNode` using the editor's runtime schema registry.

### [2026-05-30 02:45] Bug: Critical "Cannot read properties of undefined (reading 'blockReferences')" Crash on Toolbar Monaco Insertion & SSR Build Failure
- **Error**:
  1. Clicking the Monaco Code Block toolbar button crashed the admin UI with `Cannot read properties of undefined (reading 'blockReferences')`.
  2. The Next.js production build (`pnpm run build`) failed during static page generation with `TypeError: c.default.useEffect is not a function` at `PostArticle.tsx`.
- **Root Cause**:
  1. **Editor Config Override in Plugins**: The `markdownCopyPlugin` (`src/plugins/markdownCopyPlugin/index.ts`) completely overrode the `content` rich-text field's `editor` settings for the `posts` and `tech-posts` collections. This custom override omitted `BlocksFeature({ blocks: [CustomCodeBlock] })`. As a result, when loading the editor for posts/tech-posts, the `resolvedFeatureMap` for blocks was completely empty (`undefined`), causing the Lexical `BlockComponent` renderer to crash when trying to read `.blockReferences` on render.
  2. **Static ImportMap Generator Deletion**: Payload v3's static analysis tool (`payload generate:importmap`) builds `importMap.js`. However, `payload.config.ts` resolved its `configPromise` by immediately deleting the `generators` function to prevent RSC serialization errors. This meant `generators` (which manually registers `BlocksFeatureClient`) was cleared *before* the generator could write it to the map.
  3. **RSC Hook Violation**: The frontend blog renderer `PostArticle.tsx` was a Server Component (RSC) but directly executed a diagnostic `React.useEffect` hook, crashing Next.js's static prerendering worker with a TypeError during static page generation.
- **File(s) Modified**:
  - `src/plugins/markdownCopyPlugin/index.ts`
  - `src/payload.config.ts`
  - `src/app/(frontend)/blog/[slug]/PostArticle.tsx`
  - `src/features/markdownPaste/client.tsx` (restored Monaco click handler and diagnostics)
- **Fix Summary**:
  1. **Plugin Override Restoration**: Restored `BlocksFeature({ blocks: [CustomCodeBlock] })` inside the `markdownCopyPlugin`'s custom `lexicalEditor` features list, allowing the editor to fully resolve the `'blocks'` feature.
  2. **ImportMap Generator Preservation**: Updated `payload.config.ts` to only delete `generators` when Next.js server runtime is active, preserving it during `generate:importmap` CLI commands. Added a dummy top-level static editor config (`_dummyForStaticAnalysis`) to force Payload's scanner to detect and preserve `BlocksFeatureClient` in `importMap.js`.
  3. **RSC Hook Cleanup**: Deleted the unused, diagnostic `React.useEffect` hook from `PostArticle.tsx` to align with Server Component requirements.
- **Prevention Note**:
  - **CRITICAL (PLUGINS)**: If you use custom plugins that override collection fields or rich-text editor instances (like `markdownCopyPlugin`), **always ensure that all globally required Lexical features (like `BlocksFeature`) are duplicated inside the plugin's custom `lexicalEditor` features list.** Otherwise, global editor features will be silently overwritten and deleted from specific collections.
  - **CRITICAL (RSC)**: In React 19 / Next.js Server Components, **never call React hooks (like `useEffect`) directly inside Server Components.** If debug scans are needed, either declare `'use client'` at the top of the file or remove hooks completely before deploying.
### [2026-05-30 03:05] Bug: Monaco Editor keyboard shortcuts and clipboard commands (Ctrl+A, copy, paste, cut) not working inside Payload Lexical Blocks
- **Error**: `Ctrl+A`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X` do not trigger native editor selections or clipboard actions inside Monaco Code Block textareas in the Payload CMS editor.
- **Root Cause**:
  - The previous event-interception listeners (`handleShortcutInterception` and `handleClipboardInterception` in `src/features/markdownPaste/client.tsx`) were using `e.stopPropagation()` in the event "capture phase" (`capture: true`).
  - Halting event propagation in the capture phase prevents the event from ever reaching the target element (the Monaco textarea/input) entirely.
  - Since Monaco Editor relies on native event listeners on its DOM textarea to intercept and orchestrate key/clipboard bindings (like Select All, Copy, Cut, Paste), it failed to receive these events, resulting in shortcut freeze.
- **File(s) Modified**:
  - `src/features/markdownPaste/client.tsx`
- **Fix Summary**:
  - Migrated the event-shielding mechanism to a **dynamic bubble-phase shield**.
  - The capture phase event listeners now simply identify the target (or its parent `.monaco-editor` container) and dynamically attach standard bubble-phase `stopPropagation()` listeners (shield) to that container/element. They no longer call `e.stopPropagation()` in the capture phase itself.
  - As a result, the event is allowed to descend to the Monaco target successfully, giving Monaco Editor 100% control to execute shortcuts natively. When the event bubbles back up, the attached shield catches and terminates propagation before it can reach the parent Lexical editor and cause conflicts.
- **Prevention Note**:
  - Be extremely careful when using `e.stopPropagation()` in the capture phase, as it completely hides events from target DOM nodes.
  - Dynamic bubble-phase event shielding (binding `stopPropagation` to the target/container during the capture phase and letting the event propagate natively first) is a highly robust and reusable pattern when you need to let a nested 3rd-party widget handle events completely while hiding them from an outer framework container.

### [2026-05-30 13:00] Bug: Media Drawer Click and Filter issue for Hero Image
- **Error**: Clicking media items in Payload's Choose from Existing drawer did not select the item, and the list included small/incorrectly sized images (thumbnails, OGs).
- **Root Cause**:
  1. **Click Event Blockage**: The custom table cell component `AdminThumbnailCell` was intercepting pointer events, which prevented the click event from bubbling up to Payload's native row element (button) that handles item selection inside the drawer.
  2. **No Filter on Relationship**: The `heroImage` field in both `Posts.ts` and `sharedBlogFields.ts` had no `filterOptions` configured. As a result, all small thumbnail images or distinct OG-sized images uploaded individually were displayed together in the picker drawer, leading to duplication and incorrect size options.
- **File(s) Modified**:
  - `src/components/AdminThumbnailCell.tsx`
  - `src/collections/fields/sharedBlogFields.ts`
  - `src/collections/Posts.ts`
- **Fix Summary**:
  - Added `pointerEvents: 'none'` to the container wrapper of `AdminThumbnailCell` so all mouse click events seamlessly pass through to Payload's native table row button, restoring selecting functionality instantly.
  - Added `filterOptions: { width: { greater_than_equal: 1000 } }` to the `heroImage` upload field definition in both `Posts.ts` and `sharedBlogFields.ts` so only high-resolution images (width >= 1000px) are displayed in the selection drawer.
- **Prevention Note**:
  - **Clickable cell elements**: In Payload CMS v3, if you implement a custom `Cell` component for a table view that will be displayed in relationship/drawer selectors, always ensure its outer wrapper uses `pointer-events: none` to prevent it from swallowing the row-level selection clicks.
  - **Asset isolation**: Use `filterOptions` strategically to restrict uploaded assets based on width/height/mime-type for fields like Hero Image or Avatar to improve CMS usability and eliminate duplicate visual choices.

### [2026-05-30 13:15] Bug: Live Preview Resizer Toggle Inversion & Sidebar Empty Whitespace
- **Error**: The resize drag handle (icon) display and the actual live preview toggle state were inverted. Additionally, when the live preview panel was closed/hidden, a huge empty whitespace remained on the right side of the screen instead of collapsing the editor to 100% full width.
- **Root Cause**:
  1. **Strict Toggle Visibility State Mismatch**: The visibility check `inLivePreview = !!document.querySelector('iframe')` only verified the existence of the iframe in the DOM. However, Payload CMS keeps the iframe element in the DOM even when the preview is hidden (toggle OFF). This caused the resizer to permanently believe it was in preview mode.
  2. **Missing Inline Styles Cleanup**: The `removeEditorHandle()` function deleted the handle element but failed to clear the inline style overrides (`display: flex`, `flex-direction: row` on `splitParent`, `width: var(--oje-editor-w, 50%)` on the editor container, and `flex-grow/flex-shrink/width` on the preview container). The browser continued to render the layout under the flex split rules with a 50% editor width, leading to the giant empty whitespace on the right.
- **File(s) Modified**:
  - `src/plugins/panelResizer/Provider.tsx`
- **Fix Summary**:
  - Modified the `inLivePreview` visibility check to check both the existence of the `iframe` AND its visual state (`iframe.offsetParent !== null` and `iframe.getBoundingClientRect().width > 0`). This ensures handles are only injected when live preview is actually active and displayed.
  - Kept local references inside `useEffect` to `activeSplitParent`, `activeEditorContainer`, and `activePreviewContainer` on handle creation.
  - Extended `removeEditorHandle()` to completely clear the injected inline styles on those elements (setting them to `''`) when the preview is closed, returning the workspace to 100% full-width editor layout and leaving no whitespace.
- **Prevention Note**:
  - **DOM Presence !== Visibility**: In Next.js/Payload CMS v3 single-page environments, elements (like iframes or drawers) might remain mounted in the DOM while being styled away with `display: none` or scale. Always verify visual presence using `.offsetParent` and bounding rect width/height checks.
  - **Inline Override Hygiene**: If a custom script programmatically injects flex properties (`display: flex`, `flex-direction`, explicit widths) onto framework-managed containers, ensure you cleanly wipe those styles to `''` during the teardown block to prevent layout leakage.

### [2026-05-30 13:30] Bug: Relationship Drawer Item Selection Completely Freezes on All Rows
- **Error**: Clicking images or any text rows in the Payload CMS "Choose from Existing" relationship/upload drawer did not select the item, and the drawer failed to close or load the selected asset.
- **Root Cause**:
  - **Click Selection Trigger Erasure**: Payload CMS v3's `ListDrawer` relies on a built-in selection trigger element (often a Radix-UI modal action wrapper or click handler) nested strictly inside the default cell renderer for the primary column (`filename` for the `media` collection).
  - By registering a custom `Cell` component (`AdminThumbnailCell`) on the `filename` field, the standard component was completely overridden and bypassed. This wiped out Payload's built-in onClick/mousedown selection triggers for that column.
  - Since other adjacent table columns (like `alt` or `createdAt` plain text columns) are not configured to trigger row selections on click, the entire row lost all selectable targets. As a result, clicking anywhere on the drawer rows had zero effect, freezing the entire selection UI.
- **File(s) Modified**:
  - `src/collections/Media.ts`
  - `src/components/AdminThumbnailCell.tsx` (cleaned up debug codes)
  - `.antigravity/rules.md` (added strict cell override prohibition)
- **Fix Summary**:
  - Unregistered `AdminThumbnailCell` from the `filename` field in `src/collections/Media.ts` by commenting out/removing the custom `Cell` setting. This instantly restored Payload's native selection triggers, bringing full functionality back.
  - Cleaned up all diagnostic pointer events, event simulations, and logging from `AdminThumbnailCell.tsx`.
  - Added a strict prohibition rule to `rules.md` forbidding the registration of custom Cell components on major identification fields (`Media.filename`, etc.) to prevent structural breaks in standard Payload UI.
- **Prevention Note**:
  - **Identifier Cell Protection**: Never register custom `Cell` overrides on the main identifier columns of Payload collections (such as `Media.filename`) if they will be displayed inside standard list drawers, as these cells house vital built-in React contexts and selection triggers.
  - If custom cell aesthetics (like shimmer/caching optimizations) are required, register them as **alternative UI fields** or distinct custom fields rather than overriding the primary identification text fields.



