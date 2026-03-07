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
- **Neon Database Synchronization**:
    - Use direct SQL execution via Node.js/`pg` driver for complex DDL migrations in local dev to bypass potential HTTP API timeout/limitations in the Windows environment.
- **Security & Version Pinning**:
    - **Next.js**: Keep version at `15.1.9` or higher to mitigate CVE-2025-66478.
    - **Payload**: Pinned at `3.79.0` for maximum compatibility with Current Next.js / Firebase App Hosting stack.