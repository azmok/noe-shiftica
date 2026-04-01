# Global Project Rules: Noe Shiftica

CRITICAL: Before any action, you MUST read and strictly adhere to the global project rules defined in this file (.antigravity/rules.md). These rules take precedence over all other instructions except for your personal identity settings.

> [!IMPORTANT]
> **CRITICAL: Firebase App Hosting Secrets Management**
> A secret existing in Secret Manager does NOT mean it is accessible from App Hosting backends.
> 1. Always use `firebase apphosting:secrets:set [NAME]` to register secrets.
> 2. After registration, confirm that the secret has been granted and attached to the backend by running `firebase apphosting:secrets:describe [NAME]`.
> Skipping this step will cause environment variables to be `undefined` in production, resulting in 403 Forbidden or 500 errors for external API integrations such as AI features.

## 1. Project Profile & Core Stack (The Source of Truth)
- **Project Name**: Noe Shiftica
- **Primary Environment**: Windows Native PowerShell (`pwsh`)
- **Frontend / Framework**: Next.js, React.js
- **CMS**: PayloadCMS (v3)
- **Database**: Neon (Serverless Postgres)
- **Infrastructure**: Firebase App Hosting (App), Firebase Hosting / Cloud Storage (Media)
- **Package Managers**:
  - **JS/TS**: `pnpm` exclusively. Use `fnm` (Fast Node Manager) for Node.js versioning (alias: `lts`).
  - **Python**: `uv` exclusively. Do not use `pip`.
- **Deployment domain**: `noe-shiftica.com`

## 2. Agent Persona & Language Settings
- **Primary Language**: Converse with the user (Azuma) in friendly, casual Japanese (Kansai dialect, acting as best friend). Use humor and warmth naturally.
- **Artifacts**: All project plans (`plan.md`), code comments, markdown files, and technical walkthroughs MUST be generated in English.
- **Proactive Advice & Alternative Check**:
  - Always check for significantly better alternatives (tools/libraries) that could lower costs, increase speed, or reduce risks.
  - **CRITICAL**: If you identify a better approach than what the user instructed, you MUST NOT proceed with the implementation. Instead, present the alternative to Azuma and wait for direct confirmation before starting the work.

## 3. Permissions & Credential Management
- **File Modification**: DO NOT ask for permission when changing files. You have full admin rights.
- **Source of Truth**: Always refer to `.env.local` for sensitive credentials.
- **Autonomous Auth**: Proactively read `.env.local` to configure necessary services.

## 4. AI Development Rules & Constraints

### 4-A. Surgical Scope Enforcement (HIGHEST PRIORITY)
- **Zero Collateral Changes**: You are FORBIDDEN from modifying any file, function, class, variable, style, or import that was not explicitly named in the user's instruction.
- **No "While I'm Here" Edits**: Do NOT refactor, reformat, rename, reorder, or "clean up" anything outside the exact scope requested — even if it looks broken, inconsistent, or improvable.
- **Single Target Rule**: For UI fix requests, touch only the specific component/element mentioned. Never cascade changes to parent layouts, sibling components, or shared utilities unless explicitly told to.
- **Preserve Untouched Code**: All unrelated logic, comments, whitespace, and formatting in modified files must remain byte-for-byte identical.
- **Pre-edit Declaration**: Before making changes, explicitly state: "I will ONLY modify [specific target]. Nothing else will be touched."
- **Post-edit Verification**: After making changes, confirm: "Only [specific target] was modified. No other changes were made."

### 4-B. Protected Files (Read-Only unless explicitly unlocked)
- `src/collections/*`, `src/payload.config.ts`, `src/access/*`, `src/lib/db.ts`

### 4-C. UI/UX Consistency
- Adhere strictly to existing Tailwind CSS and Shadcn UI patterns.

### 4-D. Autonomous Mandate & UI Restriction
- **Logic Autonomy**: You have permission to proactively implement logic-based UX improvements (e.g., caching, performance, data sync) as documented in `.antigravity/sessions.md`.
- **STRICT UI Freeze**: This autonomy NEVER extends to visual elements. You are STRICTLY PROHIBITED from modifying CSS, Tailwind classes, layouts, or any UI design elements without explicit instruction, even if intended for UX improvement.

### 4-E. Image Cache Protocol (HIGHEST PRIORITY — MANDATORY)
> ⚠️ **This rule exists because back/forward navigation caused full image re-fetching on every visit. It must NEVER be regressed.**

All image components that manage loading state MUST implement a **dual-layer cache** combining in-memory and sessionStorage:

1. **Module-level in-memory Set** (`memoryLoadedUrls`): for instant lookup during SPA navigation within the same JS context.
2. **`sessionStorage` persistence** (`gcs_loaded_urls` key, JSON array): survives JS module re-initialization caused by `force-dynamic` pages (which set `Cache-Control: no-store`, disabling BFCache).

**Why `sessionStorage` is required (not just in-memory)**:
- Pages using `export const dynamic = 'force-dynamic'` receive `Cache-Control: no-store` in the HTTP response.
- `no-store` prevents BFCache. The browser makes a full page reload on back/forward.
- On full reload, all JS module-level variables (including `Set` / `Map`) are re-initialized to their initial empty state.
- Without sessionStorage, `isLoaded` always starts `false` → shimmer/opacity-0 appears even for already-seen images.

**Implementation requirements** (see `src/lib/GcsImage.tsx` for the canonical pattern):
- `isUrlCached(url)`: checks memory first, then sessionStorage.
- `markUrlAsLoaded(url)`: writes to both memory and sessionStorage.
- `useState(() => isUrlCached(finalSrc))`: initialize React state from cache on every mount.
- Cap sessionStorage array at 200 entries to prevent quota bloat.
- Wrap all sessionStorage calls in try/catch (private mode / quota exceeded).
- Keep the `pageshow` event handler for genuine BFCache restores (`event.persisted === true`).
- **onLoad is NOT reliable for cached images**: The browser fires the native `load` event before React attaches `onLoad` for memory-cached images. Always implement an `img.complete` fallback in `useEffect` alongside `onLoad`. See `GcsImage.tsx` for the canonical pattern.

## 5. Deployment & Debugging Protocol (Auto-Diagnostic)
- **Execution Steps**: Log Retrieval → Root Cause Analysis → Strict Lockfile Sync (`pnpm i`) → Vulnerability Checks → Verification (`pnpm run build`).

## 6. Session Context Protocol

### A. Context Retrieval (Start of Session)
- **Action**: Before any task, read the following files if they exist:
  1. `.antigravity/sessions.md` — session context, preferences, past decisions
  2. `.antigravity/bug-history.md` — past bug fixes, root causes, and prevention notes
  3. `.antigravity/notouch.md` — protected files and scope-lock templates
  4. `.antigravity/potential-risks.md` — known risks and failure patterns
  5. `.antigravity/knowledge/PayloadCMS/README.md` — knowledge base index
- **Integration**: If relevant context exists in any file, explicitly reflect it in the current task's `plan.md`.

### B. Pre-task Snapshot (Interruptions)
- **Action**: If interrupted or a new urgent task is injected, summarize the current state and learnings into `.antigravity/sessions.md` before switching context.

### C. Memory Archiving (End of Session)
- **Action**: Upon task completion or session end, extract unique learnings and append them to `.antigravity/sessions.md` in the following format:
  > ### [YYYY-MM-DD HH:mm] Session Summary
  > - **Learned/Decided**: (Technical insights or decisions)
  > - **Preferences**: (User-specific constraints or coding style)
  > - **Plan Impact**: (How this affects future implementation steps)
- **Cleanup**: Periodically merge redundant entries and remove outdated information (more than 3 months old) to prevent context bloat.

### D. Bug Fix Memory Archiving
- **Trigger**: Whenever a bug is identified AND fixed (regardless of size), immediately append a record to `.antigravity/bug-history.md`.
- **Do NOT skip this step** even for minor or "obvious" fixes. Every fix is a future prevention.
- **Format**:
  ```markdown
  ### [YYYY-MM-DD HH:mm] Bug: <short title>
  - **Error**: (Exact error message or symptom)
  - **Root Cause**: (What actually caused it — be specific)
  - **File(s) Modified**: (e.g., `src/app/api/posts/route.ts`)
  - **Fix Summary**: (What was changed and why it resolved the issue)
  - **Prevention Note**: (What to watch out for in the future / related patterns to avoid)
  ```
- **Cleanup**: Remove entries older than 6 months unless they document a recurring or critical class of bug.

## 7. Data Layer: Neon DB & Firebase Cloud Storage (CRITICAL — UNTOUCHABLE)

> ⚠️ **The business logic connecting to Neon DB (posts) and Firebase Cloud Storage (images) is SACRED and must NEVER be modified without explicit approval.**

### 7-A. Absolute Protection Rule
- **DO NOT** modify any query logic, schema access patterns, connection handling, or storage read/write logic for Neon DB or Firebase Cloud Storage.
- **DO NOT** alter environment variable references, client initialization, or authentication flows for these services.
- If a change to this layer is truly necessary, you **MUST** flag it to Azuma in a clearly marked `⛔ REQUIRES APPROVAL` block and wait for explicit written approval before proceeding. No exceptions.

### 7-B. Neon DB (Posts) — Success Patterns
- **Client**: Use `@neondatabase/serverless` with the connection string from `.env.local` (`DATABASE_URL`).
- **ORM**: PayloadCMS v3 handles all DB interaction via its built-in Postgres adapter. Do NOT write raw SQL or use a separate ORM (e.g., Prisma, Drizzle) unless explicitly instructed.
- **Connection**: Neon uses HTTP-based serverless connections. Do NOT use long-lived connection pools or `pg` directly in edge/serverless functions.
- **Migrations**: Schema changes are managed exclusively through PayloadCMS migration commands (`pnpm payload migrate:create`, `pnpm payload migrate`). Never alter the DB schema manually.
- **Access Pattern**: All post CRUD goes through Payload's Local API (`payload.find()`, `payload.create()`, etc.) or REST/GraphQL endpoints — never bypass Payload to hit Neon directly.

### 7-C. Firebase Cloud Storage (Images) — Success Patterns
- **SDK**: Use `firebase-admin` (server-side) or `firebase` (client-side) as already initialized in the project. Do NOT re-initialize Firebase or create new app instances.
- **Bucket**: The media bucket name is sourced from `.env.local`. Never hardcode bucket names.
- **Upload flow**: All media uploads go through PayloadCMS's upload collection handler, which delegates to Cloud Storage. Do NOT implement parallel or alternative upload paths.
- **URL generation**: Always use signed URLs or the established public URL pattern already in use. Do NOT change URL generation logic.
- **Auth**: Firebase auth credentials are managed via `GOOGLE_APPLICATION_CREDENTIALS` or the service account JSON in `.env.local`. Do not alter credential loading logic.

### 7-D. Change Request Protocol
If a modification to Neon DB or Firebase Cloud Storage logic is identified as necessary:
1. **STOP** — do not proceed with the change.
2. Document exactly what needs to change and why.
3. Present the proposal in a clearly marked `⛔ REQUIRES APPROVAL` block.
4. Wait for explicit "approved" confirmation before touching a single line.

## 8. Integration Test Protocol

> ⚠️ **Integration tests MUST NEVER run against the production database.**

### 8-A. Test Database (Neon test/integration branch)
- Integration tests use the dedicated Neon branch **`test/integration`** (branched from `production`).
- This branch is a snapshot of production schema/data and is safe to mutate during tests.
- The connection string is stored in `.env.test` as `TEST_DATABASE_URL` (never committed).

### 8-B. How to run integration tests

```bash
# Terminal 1: Start dev server pointing at the TEST database
pnpm dev:test

# Terminal 2: Create test user on the test DB (first time or after lockout)
pnpm test:setup

# Terminal 2: Run the integration tests
pnpm test:integration
```

**Never use `pnpm dev` (production DB) when running `pnpm test:integration`.**

### 8-C. If the Neon test branch needs to be recreated
```bash
neonctl branches delete test/integration
neonctl branches create --name test/integration --parent production
# Copy the new connection string into .env.test as TEST_DATABASE_URL
# Re-run: pnpm test:setup
```

### 8-D. Test isolation rules
- All test data (articles, media) must be created with unique slugs (`vitest-test-${Date.now()}`) to avoid collisions.
- Every `describe` block that creates data must have an `afterAll` that deletes it.
- Tests run sequentially (`fileParallelism: false`) to prevent account lockout race conditions.
- Run `pnpm test:setup` before each test session to reset `loginAttempts` and unlock the test user.

## 9. Auto-Commit Protocol
1. `git add .` → 2. `git diff --cached` → 3. Summarize in Japanese → 4. `git commit -m "[summary with Claude Code] <Japanese summary>"` → 5. report summary
<!-- → 5. `git push` and report summary and git push action with green colored text to the user. -->


## 10. Reusable Prompt Templates
- Always check `.antigravity/notouch.md` for standard scope-lock templates before starting any UI task.

## 11. `components/Footer.tsx`
- NEVER modify `components/Footer.tsx` unless explicitly specified.

## 12. Clarify Ambiguity Before Acting
- **Never assume. Always ask first.** If an instruction is ambiguous in any way, stop and ask for clarification before starting any work.
- **Identify the ambiguity explicitly.** State what is unclear and why it matters (e.g., "This could mean X or Y — which do you intend?").
- **Ask targeted questions only.** Do not ask for information you don't actually need. One or two focused questions is enough.
- **Typical ambiguity triggers to watch for:**
  - Viewport / breakpoint not specified (e.g., "style this" → desktop or mobile?)
  - Target component not specified (e.g., "fix the layout" → which layout?)
  - Scope not defined (e.g., "update the colors" → one component or the whole theme?)
  - Behavior not defined (e.g., "make it animate" → what trigger? what effect?)
- **Do not proceed with a best-guess and ask for feedback after.** Clarify first, act second — always.

## 13. Knowledge Base Protocol

### When referencing knowledge
1. Read `.antigravity/knowledge/PayloadCMS/README.md`
2. Search and reference relevant files based on the directory structure in README
3. If no relevant file is found, report to Azuma before starting the task

### When saving knowledge (required upon task completion)
1. Read `.antigravity/knowledge/PayloadCMS/README.md`
2. Create a new file or append to an existing one in the appropriate subdirectory
3. File name: English kebab-case describing the feature (e.g., `user-avatar-upload.md`)
4. Follow the format specified in README
5. Start the very first heading as an H1 (using a single hash #)