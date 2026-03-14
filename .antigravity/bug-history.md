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
### [2026-03-14 15:15] Bug: FOIC (Flash of Invisible Content) & BFCache Image Disappearance
- **Error**: Images flicker (become invisible via opacity: 0) during hydration or disappear when navigating back/forward.
- **Root Cause**: 
    1. Server/Client `finalSrc` mismatch: `process.env` checks differed between environments, causing URL changes during hydration.
    2. React State Loss: `isLoaded` reset to `false` during navigation even if the browser already had the image in cache.
- **File(s) Modified**: `src/lib/GcsImage.tsx`, `.env.local`
- **Fix Summary**: 
    - Forced consistent `finalSrc` calculation using `NEXT_PUBLIC_GCS_BUCKET`.
    - Implemented a session-level `loadedUrls` cache (`Set<string>`) to initialize `isLoaded` state.
    - Added `pageshow` listener to handle BFCache restoration.
- **Prevention Note**: Always ensure `finalSrc` is identical between SSR and Client. Use global session sets to track "already loaded" assets in SPA navigation.
### [2026-03-15 00:08] Bug: Images invisible on back/forward navigation or hydration
- **Error**: Images occasionally stay blank (opacity: 0) when using browser back/forward buttons or on initial page load (shimmmer visible or just empty).
- **Root Cause**: React state (`isLoaded`) resets to `false` on navigation/hydration, but the `onLoad` event may not fire if the browser already has the image in cache and it's marked as 'complete'.
- **File(s) Modified**: `src/lib/GcsImage.tsx`
- **Fix Summary**: Added `img.complete` check inside `useEffect` with a small timer fallback to catch already-loaded images during hydration. Also added a `pageshow` listener to handle BFCache restoration specifically.
- **Prevention Note**: Always check for `.complete` status on client-side components that hide elements until loaded, as `onLoad` is not guaranteed for cached resources.
