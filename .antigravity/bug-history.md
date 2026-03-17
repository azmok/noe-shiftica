# Noe Shiftica Bug History

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

### [2026-03-17 21:50] Bug: AI Content Optimizer 500 Error
- **Error**: Clicking "✨ AI Content Optimizer" in Admin always returned HTTP 500 `{"error":"Failed to enrich content","details":"Failed to enrich content with AI"}`. The endpoint responded in ~273ms — far too fast for any AI API call.
- **Root Cause**:
  1. **Body parsing failure**: `plugins/markdownImport/index.ts` used `(req as unknown as Request).json()` to parse the request body. Payload's `PayloadRequest` does not support `.json()` the same way as Web API `Request`, causing a silent parse error that triggered the catch block before Gemini was ever called.
  2. **Missing production env vars**: `GEMINI_API_KEY` and `GITHUB_TOKEN` were not in `apphosting.yaml`, so AI features were broken in production regardless.
  3. **Silent errors**: Client only showed generic "AI Optimization failed." with no details visible.
- **File(s) Modified**:
  - `src/plugins/markdownImport/index.ts` — body parsing fix (`.text()` + `JSON.parse()`) + debug logging
  - `src/lib/gemini.ts` — kept `gemini-2.5-flash` (confirmed working), improved comments
  - `src/plugins/markdownImport/BlogContentActions.tsx` — detailed HTTP error logging on client
  - `apphosting.yaml` — added `GEMINI_API_KEY` and `GITHUB_TOKEN` as Secret Manager secrets
- **Fix Summary**: Changed body parsing from `.json()` to `.text()` + `JSON.parse()` (matching the working `/convert-markdown` pattern). Registered secrets in Firebase Secret Manager + `apphosting.yaml`. Endpoint now returns HTTP 200 with full Gemini enrichment.
- **Prevention Note**:
  - **Payload Endpoints**: Never assume `PayloadRequest` supports Web `.json()` — always use `.text()` + `JSON.parse()` for body parsing in Payload custom endpoint handlers.
  - **Env Vars**: Any API key in `.env.local` MUST also be in `apphosting.yaml` as a Secret Manager reference for production.
  - **Error Visibility**: Always log full error details (status + body) on both client and server for faster debugging.
