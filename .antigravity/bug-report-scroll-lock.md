# Bug Report: Mobile Scroll Lock on Blog Post with HTML Embed

**Date**: 2026-03-29
**Status**: ✅ Fixed
**Affected Page**: `/blog/freelancer-vs-noeshiftica-web-production-guide`
**Environment**: Mobile Safari (iOS) only

---

## Summary

A mobile-only scroll lock was observed on a specific blog post that uses the `htmlEmbed` feature. On page load, the `<body>` received `overflow: hidden !important`, preventing all scroll. Tapping the screen removed the lock. The issue did not affect desktop or other posts.

## Affected Component

| Component | Type |
|---|---|
| `src/components/HtmlEmbedBlock.tsx` | Client Component |
| `noe-blog-vs-freelance-1.html` (Firebase Storage) | Embedded Content |

## Root Cause

The embedded HTML file (`noe-blog-vs-freelance-1.html`) hosted on Firebase Storage contained:
- `<style id="antigravity-scroll-lock-style">` → sets `overflow: hidden !important` on body
- `<body class="antigravity-scroll-lock">` → activates that style
- Inline JavaScript → toggled this class based on touch events

When `HtmlEmbedBlock.tsx` injected this content into a Shadow DOM, mobile Safari allowed these styles/scripts to affect the outer `document.body` (Shadow DOM isolation is weaker on mobile Safari in certain cases, especially for `id`-targeted styles and direct `document.body` manipulation via JS).

## Fix

**File**: `src/components/HtmlEmbedBlock.tsx`

Added a sanitization pass immediately after `shadow.innerHTML` is set:

```typescript
// Remove scroll-lock <style> tag
shadow.getElementById('antigravity-scroll-lock-style')?.remove()

// Strip scroll-lock classes from shadow DOM elements
shadow.querySelectorAll('[class*="scroll-lock"]').forEach(el => {
  el.className = el.className.replace(/\S*scroll-lock\S*/g, '').trim()
})
```

And in `runScripts`, added a guard to skip any scripts containing the scroll-lock pattern:

```typescript
if (/scroll-lock|antigravity-scroll-lock/i.test(scriptSrc + scriptContent)) {
  oldScript.remove()
  continue
}
```

## Why This Is Targeted

- The TOC fragment navigation (`handleLinkClick`) was **not changed**.
- Other HTML embeds are unaffected (they don't contain scroll-lock markup).
- The fix is defensive (ID + class-based) and won't over-strip legitimate scroll handling.

## Prevention

When creating embedded HTML files for import into this system, avoid:
- Applying `overflow: hidden` to `body` or `html`
- Using JavaScript that directly manipulates `document.body.style.overflow`
- Using `document.body.classList` to toggle scroll state

These patterns are incompatible with Shadow DOM injection and cause side-effects in mobile Safari.
