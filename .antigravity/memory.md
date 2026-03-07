# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

## Induction & Troubleshooting Lessons
- **HTML Source Editor (Lexical Payload v3)**: 
    - When registering custom Lexical toolbar items in Payload v3, use the `Component` property instead of `ChildComponent`. Using `ChildComponent` causes Payload to wrap the custom element in a standard `<button>`, leading to invalid nested buttons that React refuses to render.
    - **Controlled Component Pattern**: For Lexical plugins that involve external triggers (like a separate toolbar component), use a controlled pattern where the parent plugin manages the state.
    - **State Synchronization**: Use custom window events (e.g., `htmlsource:sync`) to synchronize state between the Lexical toolbar items and the editor overlay/plugin components, ensuring consistency across the UI.
    - **Payload Managed Imports**: `src/app/(payload)/admin/importMap.js` can sometimes generate incorrect relative paths in specific environments like WSL. Manually verifying and correcting these paths (e.g., ensuring the right number of `../` levels) is often necessary to resolve persistent "Module Not Found" build errors in Turbopack.
    - **Bidirectional Sync**: When updating the Lexical editor state from HTML source, wrap the conversion logic (e.g., `$generateNodesFromDOM`) strictly inside an `editor.update()` block to ensure the internal state and DOM remain in sync.
- **Framer Motion Variants (ease property)**:
    - In TypeScript, `framer-motion`'s `ease` property can be ambiguous. While it accepts a `number[]` for cubic-bezier, TypeScript often widens this to `number[]` and incorrectly matches it against `Easing[]` (an array of easings) instead of a single `Easing` (which is a union including `number[]`).
    - If `as const` fails to narrow the type correctly for the `Transition` interface, use `as any` specifically for the `ease` property as a last resort to bypass the complex union type resolution failure, especially in deep variant structures.
- **Neon Database Synchronization**:
    - When performing schema migrations in restricted or custom environments (like Windows/WSL vs. Neon API limits), direct SQL execution via a Node.js script and the `pg` driver is more robust than relying on the Neon HTTP API for complex DDL.
    - **Next.js Compatibility**: Ensure `next` and `eslint-config-next` versions are aligned with Payload's current stable requirements (currently `15.1.9` for Payload `3.79.0`).
- **Lockfile Synchronization (npm ci)**:
    - Firebase App Hosting uses `npm ci` for builds, which fails if `package.json` and `package-lock.json` are not perfectly synchronized. Always run `npm install` after manual `package.json` edits to update the lockfile before pushing to production.
- **Security Vulnerability Management (CVE-2025-66478)**:
    - Critical RCE vulnerabilities in Next.js (like CVE-2025-66478) can lead to silent deployment blockages on platforms like Firebase App Hosting. Always check for security-related patches (e.g., upgrading to `15.1.9` or higher) even if the local build is passing.


