# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

### [2026-03-13 20:12] Session Summary
- **Learned/Decided**: Found that `styled-jsx` in the Next.js App Router environment can cause CSS leakage and inconsistent sizing for absolutely positioned SVGs in production. Decided to migrate such components to pure Tailwind CSS for better build-time stability.
- **Preferences**: The user prefers robust production-grade fixes (even if it means migrating styling libraries) over quick patches when layout issues occur on the deployed site.
- **Plan Impact**: Future UI components should prioritize Tailwind CSS classes over `styled-jsx` to avoid "oversized icon" issues in production. Always add explicit `w-* h-*` classes to SVGs regardless of `width`/`height` attributes.
