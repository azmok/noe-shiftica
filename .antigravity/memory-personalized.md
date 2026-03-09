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
    - **Lexical Programmatic Updates**: When writing custom Payload components that programmatically update a Lexical RichText field, `setValue` from `useField` updates the form state, but Lexical may not immediately reflect it visually. To force a re-render, use `form.dispatchFields({ type: 'UPDATE', path: 'target_field', value: data, initialValue: data })`. Setting `initialValue` compels Lexical to re-initialize internally.
    - **Lexical Dependencies (2026-03-08)**: Matches `@payloadcms/richtext-lexical@3.79.0` with `lexical@0.41.0`. Installed `lexical`, `@lexical/markdown`, `@lexical/headless`, `@lexical/html`, and `@lexical/react` at version `0.41.0`.
    - **TypeScript Types**: Added `@types/pg` explicitly to resolve `Module not found` errors during `next build` involving database connection logic.
    - **Payload v3 Pathing**: In Windows Native, verify `src/app/(payload)/admin/importMap.js` relative paths. Avoid WSL-style `/mnt/c/` pathing in configuration files.

- **Environment Alignment (2026-03-09)**:
    - **Node/pnpm Pinning**: To ensure consistent builds between local and Firebase App Hosting, pin versions in `package.json` (`engines`, `packageManager`) and `apphosting.yaml` (`runtime`). Used Node.js `20` and pnpm `9.12.3`.
    - **Build Failure Diagnosis**: If a build fails in Firebase but passes locally, check for version mismatches in the lockfile or environment variables. Standardizing versions is the first step in stabilization.

- **Framer Motion Variants (ease property)**:
    - For complex variant structures in TypeScript, use `as const` (e.g., `ease: [0.16, 1, 0.3, 1] as const`) to satisfy the `BezierDefinition` type. Avoid `as any` as it can mask other structural mismatches in the `Transition` interface.

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

## Design References & Inspiration
- **Airbnb News (https://news.airbnb.com/ja/)**: 
    - **Characteristics**: Clean typography (Japanese), spacious layouts, subtle borders, high-quality imagery, and a refined grid system. 
    - **Individual Content Style (https://news.airbnb.com/ja/2025-winter-trend/)**: 
        - **Lists (`<ul>`)**: Minimalist bullet points or numbered lists with generous line-height, subtle markers, and high-contrast text.
    - **Application**: Use as a primary reference for "Premium Minimalist" UI, specifically for Japanese text hierarchy, footer structures, and list styling.

- **Security & Version Pinning**:
    - **Next.js**: Keep version at `15.1.9` or higher to mitigate CVE-2025-66478.
    - **Payload**: Pinned at `3.79.0` for maximum compatibility with Current Next.js / Firebase App Hosting stack.

### [2026-03-09 03:20] Session Summary
- **Learned/Decided**: 
  1. Alignment of Node.js and pnpm versions between local and Firebase is critical for build stability. Pinning them in `package.json` and `apphosting.yaml` resolves "Ghost" errors during deployment.
  2. The `clsx` error in `page.tsx` was likely a side effect of environment mismatch during type checking. Standardizing the environment resolved it.
  3. Strict TypeScript enforcement in Framer Motion requires `as const` for bezier arrays to match `Transition` easing types.
- **Plan Impact**: All future changes requiring a pnpm update MUST be mirrored in `package.json` and `apphosting.yaml` to prevent deployment regression.
### [2026-03-10 06:45] Session Summary
- **Learned/Decided**: 
  1. **Footer Alignment**: Removed px-5 from navigation/support links in Footer.tsx to align first letters with section titles.
  2. **Persistence Rule**: The user explicitly requested that this alignment must be maintained across all future edits. Do NOT add horizontal padding back to these list items unless specifically instructed.
- **Preferences**: Left-aligned text hierarchy for footer navigation is preferred over 'pill-style' centered padding.
- **Plan Impact**: All future global UI refactors MUST preserve this specific alignment in Footer.tsx.

### [2026-03-10 06:50] Session Summary
- **Learned/Decided**: 
  1. **Footer Mobile Optimization**: Increased section title size (12px), decreased item text size (12px), and tightened vertical spacing (space-y-1.5/1) for better mobile legibility and compact design.
- **Preferences**: Footer link items should feel distinctly smaller and more compact than their section headers on mobile devices.

### [2026-03-10 08:00] Session Summary (CRITICAL: Markdown Import Post-Mortem)
- **Learned/Decided**: 
  1. **Markdown Import Failure Cause**: Early truncations and missing frontmatter often occur when using the standard `file.text()` due to encoding conflicts. More importantly, the imported content failed to render immediately in the PayloadCMS UI because the Lexical RichText editor does NOT automatically re-initialize when its form `value` is updated via standard `useField().setValue()` hooks. This creates a desync where the form holds the data but the editor remains blank until a "Save Draft" reloads the component.
  2. **Resolution & Core Pattern**: 
     - Replaced `file.text()` with `FileReader` specifically bound to `UTF-8` encoding to guarantee 100% accurate file reading.
     - Resolved the Lexical UI rendering issue by utilizing `form.dispatchFields({ type: 'UPDATE', path: 'target', value: data, initialValue: data })`. **Setting `initialValue` simultaneously with `value` is the critical trigger** that forcefully remounts Lexical's internal React components, making the new content appear instantly.
  3. **Persistence Rule**: The markdown import feature (`ImportButton.tsx` and `/api/convert-markdown`) is now considered perfectly tuned and stable. The user has explicitly instructed to **NEVER** modify this logic again unless absolutely commanded to.
- **Plan Impact**: Do not touch the Markdown Import components. If programmatic updates to any Lexical field are required in the future for a different feature, strictly adhere to the `dispatchFields({ initialValue })` pattern.

### [2026-03-10 08:15] Session Summary
- **Learned/Decided**: 
  1. **Header PC Blur Issue**: When `bottom-0` (mobile) and `md:top-0` (desktop) are both applied to a fixed element without an explicit height constraint, it stretches to 100vh on desktop. This caused the header to expand fully when scrolling back to the top (removing `md:h-12` conditionally), creating a full-screen blur.
  2. **Resolution**: Added `md:bottom-auto` and `md:h-12` to the base `className` of the header, ensuring it maintains a fixed 48px height at all scroll positions on desktop.
- **Preferences**: Clean, visually stable transitions without layout shifts or unexpected overlay stretching.
- **Plan Impact**: When styling cross-device fixed elements (like headers/footers) in Tailwind, always ensure explicit height or opposite-edge `auto` properties (e.g., `md:bottom-auto`) are set for the desktop breakpoints to avoid unintended 100% stretching from mobile classes.

