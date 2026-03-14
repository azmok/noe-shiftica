# Noe Shiftica: Potential Bug & Risk List (Pre-emptive)

This file contains anticipated bugs and architectural risks based on the project's stack (Next.js, PayloadCMS v3, Firebase App Hosting, Neon DB).

### 1. ISR / On-Demand Revalidation Failure
- **Symptom**: Updates in PayloadCMS don't reflect on the production site immediately.
- **Cause**: The `revalidateTag` or `revalidatePath` call in Payload hooks fails because the `REVALIDATE_SECRET` is mismatched or the App Hosting CDN doesn't propagate the purge request.
- **Check**: Verify webhook delivery logs and Secret Manager credentials.

### 2. Hydration Mismatch (Server vs. Client)
- **Symptom**: Console error "Text content did not match..." and UI flickering.
- **Cause**: Using dynamic data (Dates, Math.random, or browser-only APIs like `window`) inside a React component without `useEffect` or `dynamic()` imports.
- **Prevention**: Use `useEffect` for client-only state or the "mounted" pattern.

### 3. Neon DB Connection Exhaustion (Serverless Scale)
- **Symptom**: `500 Internal Server Error` with "Too many connections" from Neon.
- **Cause**: Firebase App Hosting scales horizontally, and each instance creates new connections. Standard Postgres drivers don't pool well in serverless.
- **Prevention**: Use `@neondatabase/serverless` and ensure the `DATABASE_URL` is using the pooled connection string (usually port 5432 or 6543 with Neon).

### 4. Cold Start & Payload Initializer Timeout
- **Symptom**: First request after inactivity takes >10 seconds or fails with 504.
- **Cause**: PayloadCMS v3 has a significant initialization cost in serverless environments during "Cold Starts".
- **Prevention**: Increase `timeoutSeconds` in `apphosting.yaml` to at least 60s and consider increasing `minInstances` if traffic allows.

### 5. Google Cloud Secret Manager Permission Gap
- **Symptom**: App runs locally but fails in production with "Environment variable X is undefined".
- **Cause**: The Service Account for App Hosting does not have the "Secret Manager Secret Accessor" role for specific secrets.
- **Prevention**: Explicitly grant permissions in the Google Cloud Console for every new secret added.

### 6. Edge Runtime vs. Node.js Runtime Conflict
- **Symptom**: `Module not found: Can't resolve 'fs'` or similar errors during build.
- **Cause**: Payload v3 and some Firebase SDKs require a full Node.js environment and will fail if a Next.js route is forced into `runtime: 'edge'`.
- **Prevention**: Default to `nodejs` runtime unless absolutely necessary and compatible.

### 7. Large Payload Upload Body Limit
- **Symptom**: Uploading large images/files via Payload UI returns `413 Payload Too Large`.
- **Cause**: Firebase App Hosting (Cloud Run) or Next.js body parser has a default limit (often 1MB - 10MB).
- **Prevention**: Configure `api: { bodyParser: { sizeLimit: '20mb' } }` in Next.js routes and check Cloud Run limits.

### 8. Pnpm Lockfile Inconsistency in Build Pipeline
- **Symptom**: "Module not found" or version mismatch ONLY during Firebase deployment.
- **Cause**: Local `pnpm-lock.yaml` is out of sync with `package.json`, or the build environment uses a different Node/Pnpm version.
- **Prevention**: Always run `pnpm install` before committing and ensure `fnm` version matches `engines` in `package.json`.

### 9. Next.js Image Optimization Cache Exhaustion
- **Symptom**: Images stop loading or show 500 error after many uploads.
- **Cause**: Next.js stores optimized images in `.next/cache`. In serverless, this cache is ephemeral and can fill up local disk space.
- **Prevention**: Prefer direct GCS URLs for media or use a dedicated Image CDN (like Cloudinary or Firebase's own Image Resizer extension).

### 10. CORS Policy Block on GCS Signed URLs
- **Symptom**: Media displays on the page but "Download" or "Canvas Processing" fails.
- **Cause**: The GCS bucket doesn't have the correct `Origin` allowed for the production domain `noe-shiftica.com`.
- **Prevention**: Re-apply `gsutil cors set cors.json gs://your-bucket` whenever adding new domains.