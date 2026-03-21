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
