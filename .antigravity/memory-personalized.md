# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

## Infrastructure & Environment Lessons
- **Windows Native Optimization (2026-03-08)**:
    - Moved development environment from WSL to Windows Native PowerShell (pwsh) for maximum stability with Antigravity (Antyigravity) IDE and MCP servers.
    - **Node.js Management**: Switched to `fnm` (Fast Node Manager). Added `fnm alias <version> lts` to ensure consistent versioning across sessions.
    - **Package Management**: Adopted `pnpm` (v10+) for disk efficiency and strict dependency resolution. This aligns with Python's `uv` workflow.

- **MCP Connectivity Verified (2026-03-08)**:
    - Neon MCP successfully authenticated via Windows Native process. Connected to `noe-shiftica-db` in `aws-ap-southeast-1`.
    - Firebase MCP successfully authenticated. 
    - **Troubleshooting**: If `EADDRINUSE` occurs on port 26646 (Neon), use pwsh: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 26646).OwningProcess -Force`.

- **Package Manager Synchronization**:
    - **Strict Lockfiles**: Firebase App Hosting uses `pnpm install --frozen-lockfile` (equivalent to `npm ci`). Ensure `pnpm-lock.yaml` is updated and committed after every `package.json` change.
    - **Migration from Bun/npm**: To resolve "Ghost Dependencies" or lockfile conflicts, run: `Remove-Item -Path node_modules, pnpm-lock.yaml, bun.lockb, package-lock.json -Recurse -Force; pnpm i`.

## Frontend & CMS Development Lessons
- **HTML Source Editor (Lexical Payload v3)**:
    - **Component Property**: Use the `Component` property instead of `ChildComponent` when registering custom toolbar items to prevent invalid nested `<button>` elements.
    - **State Synchronization**: Use custom window events (e.g., `htmlsource:sync`) to bridge Lexical toolbar items and the editor overlay.
    - **Lexical Dependencies (2026-03-08)**: Matches `@payloadcms/richtext-lexical@3.79.0` with `lexical@0.41.0`. Installed `lexical`, `@lexical/markdown`, `@lexical/headless`, `@lexical/html`, and `@lexical/react` at version `0.41.0`.
    - **TypeScript Types**: Added `@types/pg` explicitly to resolve `Module not found` errors during `next build` involving database connection logic.
    - **Payload v3 Pathing**: In Windows Native, verify `src/app/(payload)/admin/importMap.js` relative paths. Avoid WSL-style `/mnt/c/` pathing in configuration files.

- **Framer Motion Variants (ease property)**:
    - For complex variant structures in TypeScript, use `as const` or, as a last resort, `ease: [...] as any` to bypass complex union type resolution failures in the `Transition` interface.

## Database & Deployment Lessons
- **Neon Database Synchronization (2026-03-08)**:
    - **Schema Sync**: Use `payload migrate` to sync schema. If "already exists" errors occur, make the migration idempotent with `IF NOT EXISTS` and `DO` blocks.
    - **Data Sync**: Since `pg_dump` may be unavailable and Neon restricts `session_replication_role`, use a custom Node.js script with `pg` to sync tables in dependency order (parents first, then children) while clearing in reverse order.

- **Premium Typography & Readability (2026-03-08)**:
    - **Hierarchy**: Use 46px (2.875rem) for main titles (H1) with a tight `line-height` (1.13) to create "visual weight".
    - **Body Text**: Opt for 18px (1.125rem) base size with a generous `line-height` (1.55) and a soft black color (e.g., `#222222`) to reduce eye strain and feel premium.
    - **Content Width**: Restrict the main reading area to ~872px (`max-w-4xl`) to prevent long line lengths that disrupt scanning patterns.
    - **Whitespace**: Use "luxury" spacing (e.g., 80px+ horizontal padding on desktop, 48px-120px vertical gaps) to separate distinct information blocks.
    - **Media Polish**: Apply 12px-16px border radius to all images and use neutral background containers (e.g., `bg-slate-100`) to frame media.

- **Security & Version Pinning**:
    - **Next.js**: Keep version at `15.1.9` or higher to mitigate CVE-2025-66478.
    - **Payload**: Pinned at `3.79.0` for maximum compatibility with Current Next.js / Firebase App Hosting stack.

### [2026-03-08 04:40] Session Summary
- **Learned/Decided**: 
  1. Firebase App Hosting hangs when Next.js `Image` attempts to optimize images hosted on local API routes (e.g., Payload's `/api/media/file/*`). This loopback deadlock causes infinite loading in production. **Fix:** Use `unoptimized={true}` for local Payload media routes in `next/image`. Payload already generates responsive sizes via Sharp, preventing performance loss.
  2. Avoid executing Payload's `useLivePreview` unconditionally inside a component rendered for regular users. If `NEXT_PUBLIC_SERVER_URL` is omitted, it defaults to polling `localhost:3000`, causing hydration blockages and infinite loading. **Fix:** Extracted live preview logic into a wrapper and strictly render it only when `isPreview` is true.
- **Plan Impact**: Future implementations involving Payload CMS media and Next.js `Image` on Firebase App Hosting MUST bypass `next/image` optimization for local media routes. Future live preview implementations MUST conditionally render the `useLivePreview` wrapper.