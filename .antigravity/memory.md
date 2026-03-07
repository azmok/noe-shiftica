# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

## Induction & Troubleshooting Lessons
- *HTML Source Editor (Lexical Payload v3)*: When registering custom Lexical toolbar items in Payload v3, use the `Component` property instead of `ChildComponent`. Using `ChildComponent` causes Payload to wrap the custom element in a standard `<button>`, leading to invalid nested buttons that React refuses to render.
- *Lexical Feature State Management*: Avoid "Split-Brain" state issues in custom features. Toggle states (like `isSourceMode`) should be managed in the top-level Plugin/Overlay component and passed down as controlled props to child components (`HtmlSourcePlugin`). This ensures UI and logic stay perfectly in sync.
- *Payload v3 importMap Pathing*: Payload's `npx payload generate:importmap` can sometimes produce incorrect relative paths for custom features in complex directory structures. If the production build fails with `Module Not Found` referencing `importMap.js`, manually correct the relative depth (e.g., `../../../` vs `../../`) in that file to fix the build.
