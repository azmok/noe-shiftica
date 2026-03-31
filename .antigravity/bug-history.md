# Noe Shiftica Bug History

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
- **Error**: Clicking "✨ AI Content Optimizer" in Admin always returned HTTP 500. Backend logs showed `GEMINI_API_KEY present: false | Length: undefined`.
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
- **Error**: Clicking "✨ AI Content Optimizer" in Admin returned HTTP 500. Logs showed `status: 403, statusText: 'Forbidden'` from Gemini API despite API key existing in Secret Manager.
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
  - `metadataBase` in layout will silently convert relative strings to absolute page URLs — this is a common footgun for OG images.

### [2026-03-29 08:00] Bug: Neon DB Backup Not Triggered on Article Create/Update
- **Error**: Neon DB backup branch was not updated when articles were created or modified via PayloadCMS admin. The backup only ran on code push to `main`.
- **Root Cause**:
  1. `neon-backup.yml` workflow only triggers on `push` to `main` — data changes in Payload admin are completely independent of code pushes.
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
  - Always register all server-side API tokens in `apphosting.yaml` — `.env.local`-only vars won't be available in production.
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
  4. `isLoaded` initialized to `false` → `opacity: 0` and shimmer appeared for all images.
- **File(s) Modified**: `src/lib/GcsImage.tsx`
- **Fix Summary**:
  - Replaced single module-level `Set` with a **dual-layer cache**: in-memory `memoryLoadedUrls` Set + `sessionStorage` persistence (`gcs_loaded_urls` JSON array, capped at 200 entries).
  - `isUrlCached(url)`: checks memory first, then sessionStorage.
  - `markUrlAsLoaded(url)`: writes to both layers atomically.
  - `useState(() => isUrlCached(finalSrc))`: initializes from cache on mount — works even after full reload.
- **Prevention Note**:
  - **This pattern is now LAW — see `rules.md` § 4-E**. All image cache state that must survive page reloads MUST use sessionStorage, not just in-memory variables.
  - `pageshow` with `event.persisted` only fires for genuine BFCache; it does NOT help on full reloads caused by `no-store`.
  - Never rely on module-level variables alone for state that must persist across `Cache-Control: no-store` page reloads.

### [2026-03-30] Bug: iOS Safari Vertical Scroll Locked in MobileFullscreenEditor
- **Error**: On actual iPhone (local dev + production), the fullscreen HTML editor textarea could not be scrolled vertically. Desktop mobile emulator worked fine.
- **Root Cause**:
  1. **Body scroll not locked**: `document.body` was not fixed when the overlay opened, so iOS Safari interpreted vertical swipes as body scroll bounce events and captured them before they reached the textarea.
  2. **`overflow-y` not explicit**: The textarea had no `overflowY` set (only `flex: 1`). iOS Safari does not reliably enable textarea internal scroll without explicit `overflow-y: scroll`.
  3. **Deprecated property**: `WebkitOverflowScrolling: 'touch'` is ignored on iOS 13+ and does nothing.
  4. **Payload drawer `preventDefault` interference** (decisive root cause): Payload CMS's built-in drawer component attaches a `touchmove` listener to the drawer and calls `preventDefault()` on it. This prevents the browser's default scroll behavior for ALL touchmove events bubbling up from inside the drawer — including those originating from the textarea — completely killing native textarea scroll even after the first three fixes were applied.
- **File(s) Modified**: `src/components/MobileFullscreenEditor/index.tsx`
- **Fix Summary**:
  - Added `useEffect` body scroll lock: `position: fixed`, `top: -${scrollY}px`, `overflow: hidden` on open; restore + `window.scrollTo` on close.
  - Replaced `WebkitOverflowScrolling: 'touch'` with `overflowY: 'scroll'` and `overscrollBehavior: 'contain'` on textarea.
  - Added `overflow: 'hidden'` to the fixed container div.
  - **Key fix**: Added `{ passive: false }` `touchmove` listener on textarea that calls `e.stopPropagation()`. This prevents the event from bubbling to Payload's drawer handler. `stopPropagation` (NOT `preventDefault`) is used — calling `preventDefault` would re-kill the textarea's own native scroll.
- **Prevention Note**:
  - Desktop emulators do NOT reproduce iOS Safari touch event capture issues — always test on real device.
  - For any `position: fixed` overlay inside a **Payload CMS drawer** with a scrollable child on iOS: (1) lock body scroll on open, (2) use `overflow-y: scroll` (not `auto`) on the inner scroll target, (3) add `overscroll-behavior: contain`, (4) attach `touchmove` listener with `stopPropagation` on the scrollable element (`{ passive: false }` required).
  - The scroll lock pattern must restore `window.scrollY` on close to avoid position jump.
  - `stopPropagation` vs `preventDefault`: never call `preventDefault` on the textarea's own touchmove — that kills its scroll. Only `stopPropagation` to block parent interference.
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
