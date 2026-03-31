# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

### [2026-03-13 20:12] Session Summary
- **Learned/Decided**: Found that `styled-jsx` in the Next.js App Router environment can cause CSS leakage and inconsistent sizing for absolutely positioned SVGs in production. Decided to migrate such components to pure Tailwind CSS for better build-time stability.
- **Preferences**: The user prefers robust production-grade fixes (even if it means migrating styling libraries) over quick patches when layout issues occur on the deployed site.
- **Plan Impact**: Future UI components should prioritize Tailwind CSS classes over `styled-jsx` to avoid "oversized icon" issues in production. Always add explicit `w-* h-*` classes to SVGs regardless of `width`/`height` attributes.

### [2026-03-14 17:42] Session Summary
- **Learned/Decided**: The user (Azuma) has set a strict "Hands-Hands-Off" rule for `src/app/(frontend)/components/Footer.tsx`. 
- **Preferences**: This file must NEVER be modified unless an explicit instruction for it is given. It is a protected component for now.
- **Plan Impact**: Even if the footer looks broken or inconsistent during other UI tasks, skip it entirely.

### [2026-03-14 15:30] Session Summary
- **Learned/Decided**: 
    - Fixed FOIC (Flash of Invisible Content) by implementing a session-based URL cache in `GcsImage`.
    - Resolved image disappearance on back/forward buttons using `pageshow` event listeners (BFCache).
    - Discovered that hydration flicker is often caused by `finalSrc` mismatches between SSR and Client; unified this using `NEXT_PUBLIC_` variables.
- **Preferences**: 
    - Confirmed green text for Git reports: "Gitプッシュしたで".
- **Plan Impact**: All critical image performance issues are now resolved. Future media-heavy components should leverage the `loadedUrls` pattern.

### [2026-03-14 18:15] Session Summary
- **Learned/Decided**: Adjusted the site-wide base font size to 16px (from 18px). Recalculated blog typography to maintain the Airbnb Newsroom targets on the new base: H1 (46px / 2.875rem), H2 (32px / 2rem), H3/Body (18px / 1.125rem).
- **Preferences**: Azuma prefers keeping specific absolute pixel targets for readability/aesthetics even when the root font size changes.
- **Plan Impact**: Assume a 16px base for all future typography work and use verified rem ratios to hit Airbnb-style targets.

### [2026-03-17 22:45] Session Summary
- **Learned/Decided**: 
    - **Payload Custom Endpoints**: `PayloadRequest` does not support the Web API `.json()` method reliably. Custom endpoints should use `await req.text()` then `JSON.parse(text)` for robustness.
    - **Firebase App Hosting Secrets**: Environment variables set in the Firebase Console GUI are **NOT** recognized as secrets by `apphosting.yaml`. 機密情報 (Secrets) must be registered via the Firebase CLI to be accessible when referenced via `secret: NAME`.
    - **CLI Agentic Blockage**: The Firebase CLI hangs indefinitely on interactive prompts (like masking secret input) when run in a non-TTY agentic terminal. 
- **Preferences**: 
    - Azuma prefers utilizing the host-side TTY (PowerShell) for interactive CLI tasks, while the agent focuses on non-interactive automated fixes using `--force` and pipes.
- **Plan Impact**: 
    - AI Content Optimizer is now operational in production. 
    - Future secret management tasks should default to non-interactive CLI patterns or request user host-side execution to avoid hangups.
    - Always verify environment variable presence via backend logs (`[AI-ENRICH]` tagged logs added).

### [2026-03-18 10:00] Session Summary
- **Learned/Decided**: Established and confirmed the structured knowledge base hierarchy within `.antigravity/knowledge/PayloadCMS/`.
- **Preferences**: The folder roles are strictly divided as follows:
    - `PayloadCMS/README.md` → Root knowledge.
    - `frontend/ui/` → Next.js components, styles, layouts.
    - `frontend/logic/` → Client-side API calls, state management, hooks.
    - `backend/admin-ui/` → Payload Admin Panel customization.
    - `backend/logic/` → Collection definitions, API routes, DB operations.
- **Plan Impact**: All future documentation relating to specific functional logic or UI must be added to these respective directories under `.antigravity/knowledge/PayloadCMS/` using markdown files named after the feature/function name.

### [2026-03-18 11:30] Session Summary
- **Learned/Decided**:
    - PSI mobile LCP 108.6s の根本原因を特定・修正。原因は4層構造：①LCP要素(`<h1>`)がframer-motionの`initial="hidden"`でopacity:0スタート、②Three.js/PastelTopologyがクリティカルパスに含まれ初期JSバンドルを圧迫、③TypeKitスクリプトが`<head>`でrender-blocking、④OxaniumがGoogle Fonts直接リンクでrender-blocking。
    - `initial={false}`はframer-motionのSSR済み要素に対して「初期アニメーションをスキップし、animate値を即反映」する正しいイディオム。LCP要素には必ず使うべき。
    - `next/dynamic({ ssr: false, loading: () => null })`でWebGLコンポーネント(Three.js)を遅延ロードすることで、初期バンドルから除外できる。
    - next/font/googleで読み込んだフォントはfont-familyが`__FontName_hash`形式にリネームされる。CSSで`"FontName"`直接参照は無効になるため、必ず`var(--font-variable)`に変更する必要がある。
    - TypeKitは`<Script strategy="afterInteractive">`で`<body>`末尾に移動するとrender-blockingが解消される。Adobe FontsのFOUT（フォント置換チラつき）はLCP 108sと比べ無視できるトレードオフ。
- **Preferences**: LCPに関わるパフォーマンス改善はUI Freezeルールの例外と判断して対応（ただしvisual designは維持）。
- **Plan Impact**: 今後のヒーローセクション実装では①above-the-foldのmotion要素は`initial={false}`を使う、②重いWebGLや外部ライブラリは`next/dynamic`で遅延ロード、③フォントは全てnext/fontで管理 をデフォルトとする。

### [2026-03-18 10:20] Session Summary
- **Learned/Decided**: Next.js (App Router) confirms that placing JSON-LD via `next/script` directly within the `return` of a Server Component (effectively inside `<body>`) is the modern best practice. It ensures reliability, avoids duplication issues in `<head>`, and integrates seamlessly with Server Components.
- **Preferences**: For future structured data additions, use the component-based approach (`JsonLd.tsx`) pattern rather than the Metadata API's `other` field for better flexibility.
- **Plan Impact**: Documented this pattern as a persistent knowledge asset in `.antigravity/knowledge/PayloadCMS/frontend/logic/seo-json-ld.md`.

### [2026-03-20 05:48] Session Summary
- **Learned/Decided**: 
    - The correct "Source of Truth" for the PC Header background on scroll is a **Gradient Backdrop-Filter** (Glassmorphism) effect, NOT a solid `bg-white`.
    - Component Rule: Use `bg-transparent` for the main header container on non-blog pages. 
    - Backdrop Logic: Use an absolute-positioned `div` with `maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'` and `backdropFilter: 'blur(40px) saturate(180%)'`.
    - Scroll Transition: Set the backdrop layer to `opacity-0` when not scrolled and `opacity-100` when `isScrolled` is true.
- **Preferences**: Azuma confirmed this is the "default" (規定値) for PC access.
- **Plan Impact**: Any future UI fixes that accidentally change the header background to a solid color must be rejected or reverted to this standard.

### [2026-03-22 03:45] Session Summary
- **Learned/Decided**: 
    - Successfully integrated Google Analytics (GA4) using a client-side component and `next/script`.
    - Confirmed that `.env.local` can store the GA Measurement ID while `apphosting.yaml` exposes it to the production environment.
    - Verification with `pnpm build` confirmed that the script injection doesn't break the build or hydration.
- **Preferences**: 
    - User prefers using standard `next/script` patterns for third-party integrations (as per Step 1 in the request).
- **Plan Impact**: 
    - GA measurement is now active and configurable via environment variables in Firebase App Hosting.

### [2026-03-29 17:15] Session Summary
- **Learned/Decided**:
    - **ogImage Population**: Using an `afterChange` hook with `payload.update` in Payload v3 can cause "Canceled" network errors and UI instability. The correct and atomic approach is using a `beforeChange` hook to set the value on the `data` object.
    - **Media URLs in Hooks**: Direct GCS URLs for media are generated in the `Media` collection's `afterRead` hook. In `beforeChange` hooks of other collections, use `payload.findByID` on the `media` collection to trigger its hooks and retrieve the generated URL.
    - **Scope Exception**: As recorded, the user (Azuma) allowed modifying `src/collections/Posts.ts` and `src/payload.config.ts` specifically for this fix.
- **Preferences**:
    - **STRICT SCOPE LOCK**: For all future tasks, the rule of "NOT touching `src/collections/*` or protected files" is RE-INSTATED. This task was a one-time exception only.
- **Plan Impact**:
    - Always prioritize `beforeChange` for field auto-population to ensure atomicity and avoid UI sync issues.

### [2026-03-29 18:19] Session Summary
- **Learned/Decided**:
    - **Mobile Scroll Lock (Safari)**: `HtmlEmbedBlock.tsx` injects external HTML into a Shadow DOM. Mobile Safari can allow `<style id="...">` tags and direct `document.body.classList` manipulation from inside the shadow to affect the outer document. This caused `overflow: hidden !important` to lock the page scroll on iOS.
    - **Root Cause was in Content, not Code**: The embedded HTML file (`noe-blog-vs-freelance-1.html`) itself contained `<body class="antigravity-scroll-lock">` and the corresponding `<style>` and JS. The `src/` codebase had no `antigravity-scroll-lock` references.
    - **Fix Strategy**: Added defensive sanitization in `HtmlEmbedBlock.tsx` after `shadow.innerHTML`: removes scroll-lock `<style>` by ID, strips scroll-lock classes, skips matching scripts. The TOC navigation (`handleLinkClick`) was NOT touched.
    - **Reports**: Created `.antigravity/error-log-scroll-lock.txt` and `.antigravity/bug-report-scroll-lock.md`.
- **Preferences**:
    - For future HTML imports, avoid applying `overflow: hidden` to `body`/`html` or using `document.body.classList` for scroll state — these escape Shadow DOM on mobile Safari.
- **Plan Impact**:
    - `HtmlEmbedBlock.tsx` now defensively sanitizes scroll-lock artifacts from all embedded HTML.

### [2026-03-30] Session Summary
- **Learned/Decided**:
    - **iOS Safari textarea scroll in fixed overlay (Payload drawer)**: Desktop mobile emulators bypass OS-level touch event handling, so scroll works fine there. Real iPhone fails because body scroll is not locked AND because Payload's drawer calls `preventDefault` on bubbled `touchmove` events.
    - **The 4-rule pattern for iOS fixed overlays inside Payload drawer**: (1) Lock body on open via `position:fixed + top:-${scrollY}px + overflow:hidden`, (2) use `overflow-y:scroll` (not `auto`) on the textarea, (3) add `overscroll-behavior:contain`, (4) attach `touchmove` listener on the textarea with `e.stopPropagation()` and `{ passive: false }` to block Payload's drawer from calling `preventDefault`.
    - **`WebkitOverflowScrolling: 'touch'` is dead**: Deprecated since iOS 13, does nothing on modern devices.
    - **`stopPropagation` vs `preventDefault`**: On the textarea's touchmove, use `stopPropagation` ONLY. Calling `preventDefault` would kill the textarea's own native scroll.
- **Preferences**: Always test iOS scroll behavior on real device — emulators are not reliable for this class of bug.
- **Plan Impact**: All future fullscreen/modal overlays inside Payload CMS drawers that include a scrollable child must apply this 4-rule pattern.

### [2026-03-29 20:00] Session Summary
- **Learned/Decided**:
    - **HtmlSourcePlugin textarea (Safari)**: `minHeight` on textarea causes page-level scroll in Safari admin panel. Replacing with fixed `height: calc(100vh - 180px)` + `overflowY: auto` creates a properly scrollable full-screen editor.
    - **Preview page + Safari ITP**: `payload.find({ draft: true })` without `overrideAccess: true` can fail when Safari blocks admin session cookies in the preview iframe context. Adding `overrideAccess: true` ensures drafts are always accessible regardless of auth state.
    - **GcsImage preOptimized bug**: `shouldDisableOptimization = preOptimized && src.includes('thumbnail')` was incorrect — medium/large Payload-generated variants were still going through the Next.js proxy (2-hop) instead of being served directly from GCS CDN (1-hop). Removed the `thumbnail` check so all `preOptimized: true` images bypass the proxy.
    - **AVIF vs WebP**: Changed `formats` to `["image/webp"]` only. AVIF encodes ~10x slower than WebP on first request, causing >1s waits. For the 0.5s target, WebP is the better default.
- **Preferences**: Sub-0.5s image loading requires both format selection (WebP over AVIF) AND avoiding proxy hops (preOptimized direct CDN).
- **Plan Impact**: Future image optimization: always use `preOptimized: true` for Payload-generated variants (medium/large/thumbnail) for direct CDN serving.

### [2026-03-31] Session Summary
- **Learned/Decided**:
    - **Vitest setup for Next.js App Router (ESM)**: Use `vitest` + `vite-tsconfig-paths`. Config: `environment: 'node'`, `globals: true`. No `@vitejs/plugin-react` needed for non-JSX unit/API tests.
    - **Mocking Next.js classes**: `vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))` works fine. `NextRequest`/`NextResponse` work in Node 20+ without mocking — Web API `Request`/`Response` are available globally.
    - **Mocking constructable classes (e.g. Resend)**: Arrow functions cannot be used as constructors. Use `vi.hoisted(() => vi.fn())` for the mock fn + a `class` in the `vi.mock` factory that references the hoisted fn. This is required when the class is instantiated at module load time (top-level `new Resend(...)`).
    - **Test scope**: Pure utility functions (`calculateReadingTime`, `slugify`, `containsCJK`) and API route logic (`/api/revalidate` auth, `/api/contact` validation + Resend error paths) covered by 38 tests in 4 files.
- **Preferences**: Azuma wants tests added to the existing project; not a separate test project. Keep test files under `src/__tests__/`.
- **Plan Impact**: Future API routes should be structured to be testable: avoid module-level side effects that are hard to mock (e.g., top-level class instantiation). Consider lazy initialization patterns for external SDK clients.

### [2026-03-31 18:48] Session Summary
- **Learned/Decided**:
    - **Mobile Menu UX**: Shifting the close button to the bottom-left on mobile improves reachability for one-handed use on modern large screens.
    - **Responsive Height**: Using `min-h-dvh` (Dynamic Viewport Height) is the most robust way to handle the browser's dynamic chrome (address bar) and prevent layout jumping in full-screen overlays.
    - **Resume/Reset Integration**: Centralizing these functions within the navigation menu outside the specific tool flow (Hearing Sheet) creates a consistent experience across the entire site.
- **Preferences**:
    - User confirmed a strong preference for high-impact, premium typography (`font-black`, uppercase) in navigation.
    - Confirmed requirement for explicit confirmation before destructive data resets.
- **Plan Impact**:
    - All future mobile overlays should consider the bottom-left/right placement of close buttons for better ergonomic usability.
    - Use `min-h-dvh` for all full-screen immersive layouts going forward.

### [2026-03-31 19:07] Session Summary
- **Learned/Decided**:
    - **Visual Consistency**: High-end brand feel is best maintained by using 10% opacity accent backgrounds (`#E2FF3D/10`) for resting states, and 100% solid opacity with inverted text (`black`) for hover.
    - **Interactive Feedback**: Combining `scale-110` with color-shifting makes the secondary navigation (SNS) feel alive and polished.
- **Preferences**:
    - User confirmed the new `#E2FF3D` lime as the primary accent color across all interactive components (menu, footer icons).
- **Plan Impact**:
    - Apply this "Accent-Tinted" pattern to all future social/utility icon groups.

### [2026-03-31 19:19] Session Summary
- **Learned/Decided**:
    - **ProgressBar Positioning**: Relocating the progress bar to the **bottom** on mobile devices is a great way to avoid visual conflicts with mobile top-navigation and provide a native feel.
    - **Gradient Branding**: Using `NProgress` to implement brand-specific gradients requires an `!important` background override on `#nprogress .bar`.
- **Preferences**:
    - User preferred a specific `hsla`-based pink-to-blue gradient for the global loader.
    - Thickened the loader to `5px` for higher contrast.
- **Plan Impact**:
    - Future global UI loaders should consider bottom-positioning on mobile to match this established pattern.

### [2026-03-31 19:27] Session Summary
- **Learned/Decided**:
    - **Bulk Actions Customization**: To reposition Payload v3's floating bulk actions bar, you must use `position: relative !important`, `top: auto`, `right: auto`, and `transform: none` on the `.bulk-actions` class.
    - **Global Theme Variables**: Targeting `.btn:not(.bulk-actions__action--delete)` and `.bulk-actions__action--delete` with `var(--theme-success-500)` and `var(--theme-error-500)` respectively creates a high-contrast, user-friendly interface.
- **Preferences**:
    - User wants to apply these "Success Green" and "Error Red" UX patterns globally across all Admin Panel collections.
- **Plan Impact**:
    - Continue adding collection-independent Admin UI improvements to `src/app/(payload)/custom.scss`.

### [2026-03-31 20:00] Session Summary
- **Learned/Decided**:
    - **`force-dynamic` is ABSOLUTELY BANNED**: `export const dynamic = 'force-dynamic'` must never be used in this project. It kills CDN caching, disables BFCache, and destroys the CMS performance goals.
    - Removed from 4 files: `src/app/sitemap.ts`, `src/app/(frontend)/blog/page.tsx`, `src/app/(frontend)/blog/[slug]/page.tsx`, `src/app/(frontend)/blog/[slug]/preview/page.tsx`.
    - Correct pattern: use on-demand ISR via `revalidatePath()` (already wired in `/api/revalidate`). For preview/draft pages, Payload's auth cookie lookup automatically opts Next.js out of static rendering — no `force-dynamic` needed.
- **Preferences**:
    - Azuma explicitly mandated: if `force-dynamic` is found anywhere in the codebase, delete it immediately. Never add it in future.
- **Plan Impact**:
    - All future blog/CMS route implementations must NOT use `force-dynamic`. Rely on SSG + on-demand revalidation for published content, and trust Next.js cookie detection for auth-gated pages.
    - Knowledge documented at: `.antigravity/knowledge/frontend/logic/nextjs-rendering-strategy.md`
### [2026-03-31 22:00] Session Summary
- **Learned/Decided**:
    - **Mobile Menu Unification**: Split menu button logic (MobileMenuButton and MobileMenuOverlay) causes visual flickering and alignment issues. Unifying the toggle icon (Menu/X) into a single component with higher zIndex (z-10001) is the most robust approach.
    - **Hydration Safety**: Use an isMounted state in client components that render conditional UI based on shared context to prevent SSR/CSR mismatch flashes on page load.
- **Preferences**:
    - User preferred a larger, more premium button size (w-14) for the menu mobile toggle.
- **Plan Impact**:
    - Always use isMounted gates for mobile overlays and floating buttons to ensure a flicker-free load experience.
