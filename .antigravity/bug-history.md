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
