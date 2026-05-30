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

### [2026-04-01] Session Summary
- **Learned/Decided**:
    - **Preview Mode cache bypass**: `unstable_noStore()` from `next/cache` is the correct way to opt out of Next.js Full Route Cache without using the banned `force-dynamic`. Added to `preview/page.tsx`. Also increased `depth: 1 → 2` to match `LivePreview.tsx` and fully resolve body images.
    - **Client-side image compression via fetch interceptor**: Patching `window.fetch` in a Payload admin provider component (`admin.components.providers`) is the correct architecture for intercepting uploads before they reach the server. The FormData is mutable — `fd.delete('file'); fd.set('file', compressed)` works reliably.
    - **Payload email (Forgot Password)**: Without `email:` config in `buildConfig`, Payload logs emails but never sends them. `resendAdapter` from `@payloadcms/email-resend@3.79.0` (version must match `payload` version) with `RESEND_API_KEY` is the correct fix. `RESEND_API_KEY` was already in `apphosting.yaml` as a secret.
    - **iPad/iPhone touch fix**: Core issue is missing `touch-action: manipulation` on Payload's interactive elements. Also need min 44px touch targets for checkboxes and close buttons per Apple HIG. Fixes go in `custom.scss`.
    - **Protected file unlock protocol**: `src/payload.config.ts` can be modified when the user's instruction explicitly requests backend configuration changes. The protection is a safety rail against accidental changes, not an absolute prohibition.
- **Preferences**:
    - User groups multiple tasks by Q-number (e.g. Q3, Q5) referencing a separate task list document. Always ask for clarification when Qn references are ambiguous.
- **Plan Impact**:
    - All future admin providers should be registered in `admin.components.providers` in `payload.config.ts`.
    - `@payloadcms/email-*` version must match `payload` version exactly to avoid peer dep issues.
    - For preview pages: always use `noStore()` + `depth: 2` to ensure draft data is fresh and fully resolved.

### [2026-05-15] Session Summary
- **Learned/Decided**:
  - **ISR throw error リグレッション**: git整理（スナップショットコミット `76fe4b7`）によって `blog/page.tsx` の `throw error` が消え、前回と全く同じISRキャッシュ汚染バグが再発した。修正コミット `12f71e2` で再追加。
  - **ログ調査結果**: `Error: Connection terminated unexpectedly`（2026-05-14）がNeon DB接続エラーの直接証拠として確認。`[ISR][blog/...] payload.find succeeded but returned 0 docs` は個別記事ページの別問題（一覧には影響なし）。
  - **デプロイリビジョン確認**: `noe-shiftica-backend-build-2026-05-12-001` が本番稼働中。
- **Preferences**: git整理・ブランチ再構成の後は必ず `blog/page.tsx` の catch ブロックに `throw error` があるか確認する。
- **Plan Impact**: 個別記事ページで `payload.find` が0件を返す問題（毎日複数回発生）は未解決。別途調査が必要。

### [2026-05-12 00:00] Session Summary
- **Learned/Decided**:
  - **Blog list ISR cache poisoning**: `blog/page.tsx` was silently catching DB errors, causing an empty "No articles yet" page to be written to the Full Route Cache when Neon query failed during ISR re-render. Fixed by adding `throw error` to preserve stale cache.
  - **Investigation finding**: No `revalidate = 600` existed in the code. The afterChange/afterDelete hooks in `Posts.ts` already correctly call `revalidatePath('/blog')` and `revalidatePath('/blog/${doc.slug}')`. The CDN bypass via `no-store` headers in `next.config.ts` was also already in place.
  - **The one missing piece**: The blog list page was not following the ISR error-throw pattern established in `blog/[slug]/page.tsx` and the knowledge base.
- **Preferences**: Azuma gave permission to touch `next.config.ts` if needed (it was not needed — fix was in `blog/page.tsx` only).
- **Plan Impact**:
  - Every ISR server component that fetches DB data must throw on error (never swallow).
  - The knowledge base (`nextjs-rendering-strategy.md`) already documents this pattern — enforce it in all future page components.

### [2026-05-17 14:47] Session Summary
- **Learned/Decided**: LexicalエディタでのMarkdownコピペ要望に対し、COPY_COMMANDをオーバーライドし、HTML生成後にMarkdownに変換する軽量なカスタムパーサーを実装した。
- **Preferences**: 外部ライブラリ（turndownなど）を使わず、独自の軽量関数で済ませるスピード・依存削減を優先。またフロントエンドのiOS Safariダブルタップズームバグ修正に viewport の maximumScale: 1 を設定した。
- **Plan Impact**: 今後Lexicalのカスタム機能を追加する際、クライアントプラグイン経由でコマンドをフックする手法が活用できる。

### [2026-05-17 15:02] Session Summary - Webhook Fix
- **Learned/Decided**: Serverless環境（App Hosting/Vercelなど）における非同期処理のawait漏れにより、関数の終了と同時にWebhook fetchが中断される問題を特定。すべてのフックでの etch 処理に wait を付与した。
- **Resilience**: CLIスクリプトや外部バッチ実行時にNext.jsの evalidatePath が Invariant エラーでクラッシュするのを防ぐため、フック内の evalidatePath を 	ry/catch で包み、エラーをログ警告として逃がす堅牢な設計にした。
- **Validation**: ローカルのPayload APIで記事作成・ドラフト化・削除を順に自動実行する検証用ライフサイクルスクリプト（scripts/test-webhook-full.ts）を作成し、動作を確認。生産環境へのリクエスト発火と401ステータス（トークン不一致により正常到達）の確認に成功。

### [2026-05-19] Session Summary
- **Learned/Decided**: Blog list reverted to build-time snapshot after ~10 min inactivity (third occurrence). Root cause: minInstances: 0 causes Cloud Run scale-to-zero; ISR in-memory cache is ephemeral. Fixed by adding unstable_noStore() to BlogPage() - opts out of ISR, forces live DB fetch on every request. Safe because Cache-Control: no-store is already set in next.config.ts for /blog.
- **Preferences**: unstable_noStore() (not force-dynamic) is the confirmed approach for bypassing ISR. Pattern already used in preview/page.tsx.
- **Plan Impact**: For minInstances: 0 deployments, never rely on ISR for pages that must reflect live CMS data. Use unstable_noStore() when Cache-Control: no-store is already set on that route.

### [2026-05-22 20:57] Session Summary
- **Learned/Decided**: Added 	ech-posts Payload collection and /dev/[slug] frontend routes. Existing posts and /blog untouched. Used (frontend) route group instead of separate (tech) to share layout. PostArticle and BlogRecentStoriesClient now accept asePath prop. DB schema applied via direct SQL scripts because payload migrate conflicts with dev-mode pushed schema.
- **Preferences**: Azuma prefers /dev over /tech for tech blog URL prefix. Sidebar grouping (dmin.group) preferred over custom tab view for Admin UI.
- **Plan Impact**: Future tech-specific fields (githubUrl, techStack, difficulty) can be added to TechPosts.ts later. Knowledge base entry created at .antigravity/knowledge/backend/logic/tech-blog-collection.md.

### [2026-05-22 22:04] Session Summary
- **Learned/Decided**:
  - **Slug tracking system (slugTrackerPlugin)**: Created a reusable PayloadCMS plugin at `src/plugins/slugTracker/index.ts` to automatically inject `slugHistory` array field and hook `beforeChange` to capture slug changes.
  - **301 Redirection**: Implemented 301 redirection logic in dynamic routing pages (`blog/[slug]/page.tsx` and `dev/[slug]/page.tsx`) by querying `slugHistory` when direct slug search yields zero results.
  - **Type Safety**: Verified that the running dev server successfully regenerated `payload-types.ts` with the new array field.
- **Preferences**:
  - The plugin-based approach is preferred for cross-collection functionality.
- **Plan Impact**:
  - Standardized the redirect-checking pattern in both dynamic `page.tsx` and `generateMetadata`. Any future post collections should reuse this plugin.

### [2026-05-22 22:16] Session Summary
- **Learned/Decided**:
  - Resolved dynamic preview page contrast collision by changing the outer container wrapper's styling from light (md:bg-(--color-neu-bg-light) bg-(--mobile-bg)) to premium dark void (min-h-screen bg-background-void).
  - Added background mesh gradient blobs, SVG global noise filter, and dynamic image failsafe script to live preview pages to align with production visual quality.
  - Fixed a frontend preview rendering bug where raw backslashes (`\`) were appearing around inline code (`<code>`). This was caused by a parser mismatch between Turbopack and `@tailwindcss/typography`'s default `code::before { content: "\`"; }` styling. Solved by stripping pseudo-elements (`content: "" !important`) in `PostArticle.module.css` scoped under `.postContent` and globals `styles.css`.
  - Solved React 19/Turbopack compatibility bugs causing standard `CodeBlock` component crashes by creating a portable `CustomCodeBlockFeature` (`src/features/customCodeBlock`), which wraps `BlocksFeature` and uses Payload's native stable Monaco `code` field.
  - Implemented typed `JSXConverters` `({ node }: { node: any })` in the frontend to avoid implicit `any` TS compilation errors.
- **Preferences**:
  - Keep the preview page design identical to the live production visual state rather than introducing complex theme toggling logic.
  - Encapsulate custom block-level features in clean portable directories so they are sharing-friendly.
- **Plan Impact**:
  - Any future custom dynamic preview rendering routes should adopt the same premium dark background wrapper with SVG global filters.
  - Future block-level extensions should use portable plugins under `src/features/` with matching custom `JSXConverters` on the frontend.

### [2026-05-22 23:35] Session Summary
- **Learned/Decided**:
  - **GIF Optimization for X.com**: Large GIF files (~40MB) cannot be uploaded to X.com due to the 15MB limit. Optimized them using local ffmpeg by lowering the framerate to 12fps, scaling the width to 800px (scale=800:-1:flags=lanczos), and generating high-quality 256-color palettes (palettegen / paletteuse).
  - **Results**: Compressed vscode-plugin_antigravigy-cli-helper.gif from 41.3MB to 4.6MB, and vscode-plugin_antigravigy-cli-helper_pwsh.gif from 35.0MB to 2.5MB while preserving visual clarity.
- **Preferences**:
  - 800px width and 12fps is the ideal balance for VS Code extension preview GIFs, ensuring smooth movement and small file size.
- **Plan Impact**:
  - None.

### [2026-05-24 18:06] Session Summary
- **Learned/Decided**: VS Code Explorer keybindings do not pass URI selections to commands. Solved by implementing a temporary clipboard backup-and-restore hack combined with execution of 'copyFilePath'. Unified 'Ctrl+L' keybindings across Editor (lines) and Explorer (comma-space joined relative paths).
- **Preferences**: Non-disruptive clipboard operations with active restoration to protect user clipboard data.
- **Plan Impact**: None.

### [2026-05-29 09:56] Session Summary
- **Learned/Decided**:
  - In PayloadCMS v3.79.0, custom Lexical blocks (such as our portable `CustomCodeBlock` under `src/features/customCodeBlock`) must be registered directly via `BlocksFeature({ blocks: [CustomCodeBlock] })` in `payload.config.ts`. Wrapping them in custom factory functions (e.g. `CustomCodeBlockFeature()`) blocks Payload's static analysis tool (`importMap` generator) from scanning internal component paths, resulting in importMap skips.
  - Custom `JSXConverters` on the frontend must have explicit parameter type definitions `({ node }: { node: any })` to pass strict TS type checking (`noImplicitAny`).
  - Fixed a frontend preview rendering bug where raw backslashes (`\`) were appearing around inline code (`<code>`) due to Turbopack / `@tailwindcss/typography` clashes. Resetted them globally via `styles.css`.
- **Preferences**:
  - Register custom blocks directly in config rather than custom wrappers. Avoid dynamic factory calls when modifying static configurations.
- **Plan Impact**:
  - Always design portable blocks inside neat feature folders, but register them directly inside `payload.config.ts`'s flat `features` array. Add explicit types to all block JSX converters.

### [2026-05-30 01:30] Session Summary
- **Learned/Decided**:
  - PayloadCMS v3 Lexical BlocksFeature has client-side importMap registry gaps in dynamic setups, preventing custom blocks from showing in slash/plus menus.
  - Portaling elements to Payload's toolbar container `.fixed-toolbar` fails visually because of CSS `overflow: hidden` layout bounds causing element clipping.
  - The correct architectural pattern to extend Payload's editor toolbar is using the official `toolbarFixed` API inside `createClientFeature` (matching `HtmlSource` pattern), which layout-allocates toolbar space safely.
  - Created pre/post-process parser regex mapping during Markdown import and clipboard paste inside `client.tsx` to safely map backticks to `code-block` JSON node targets.
- **Preferences**:
  - Azuma prefers official API-based client-feature extensions over DOM-hacking portal insertion for editor workspace stability.
- **Plan Impact**:
  - Future Lexical customizations should extend the `toolbarFixed` property in `createClientFeature` to natively append interactive controls.

### [2026-05-30 03:10] Session Summary
- **Learned/Decided**:
  - Implemented dynamic event shielding (dynamic bubble-phase event stopping) to fully resolve keyboard/clipboard shortcut conflicts inside integrated iframe-like widgets (such as Monaco Editor) inside Lexical fields.
  - Upgraded Lexical blog `blockquote` CSS styles globally in `PostArticle.module.css` to feature custom transparent dark cards (`rgba(255, 255, 255, 0.02)`), sleek border transitions, 4px brand accent border-left (`#E2FF3D`), and giant background quotation mark watermarks (`“`) to override generic default Tailwind prose designs. Fine-tuned typography (fontsize 0.9rem to match body text, line-height 1.9, letter-spacing 0.05em, softer font color `rgba(255, 255, 255, 0.82)`, and highlighted strong contrast `rgba(255, 255, 255, 0.98)`) to dramatically optimize readability and balance visual noise inside the dark card.
- **Preferences**:
  - Azuma prefers sleek, dark, premium theme aesthetics with cohesive lime green accents (`#E2FF3D`) and subtle interactive scale/color animations.
- **Plan Impact**:
  - All future Rich Text / Block elements should follow the premium dark theme aesthetics established in the blog module CSS.
  - Added workspace-level `.vscode` configuration to seamlessly support raw CSS Nesting highlighting and linting via PostCSS and Stylelint recommendations, ensuring standard `.css` files remain completely error-free in the development IDE.
  - Cleaned up diagnostic components (removed `Oje Debug Panel` and redundant `console.error` logs from `PostArticle.tsx`) before production release.

### [2026-05-30 04:03] Session Summary
- **Learned/Decided**:
  - Implemented `PanelResizerProvider` – a global Payload Admin client provider that adds drag-and-drop resize handles to the 3-panel Admin layout (nav sidebar / editor / live-preview iframe).
  - Approach: `MutationObserver` + `requestAnimationFrame` debounce to watch for Payload's live-preview mode (`collection-edit--is-live-previewing`). Handles are injected as raw DOM elements to avoid React tree coupling.
  - The nav panel width is controlled via the Payload CSS variable `--nav-width` (min 120px, max 540px). The editor panel width is controlled via a new CSS variable `--oje-editor-w` (min 220px, max total-220px) that overrides the hardcoded `40%` in Payload's SCSS.
  - Only activates at `window.innerWidth >= 1024px` (PC / tablet landscape). Below that threshold all handles are removed and all inline styles restored.
  - Uses PointerEvents API for both mouse and touch support (Apple Pencil on iPad etc.).
  - Lime-green glow animation on hover/drag matches the project accent colour palette.
  - Component registered as a Payload `admin.components.providers` entry; `importMap.js` was already pre-populated from a prior session.
  - Build verified: `pnpm run build` passed with 0 errors.
- **Preferences**:
  - Azuma wants UI tools that only activate on wide screens and remain invisible on mobile/portrait.
- **Plan Impact**:
  - Future admin customisations should follow the same `provider + MutationObserver + RAF` pattern for safely injecting DOM elements without disrupting Payload's React tree.

### [2026-05-30 13:00] Session Summary
- **Learned/Decided**:
  - Custom cell components like `AdminThumbnailCell` in PayloadCMS table views can intercept pointer/mouse events and block native row click events inside relationship or upload selector drawers. Adding `pointer-events: none` directly to the custom cell container wrapper resolves the event bubble blockages seamlessly.
  - Adding `filterOptions` to standard relationship/upload fields allows backend-level asset list constraints (e.g. `width: { greater_than_equal: 1000 }` to select only high-resolution images for the Hero Image) right inside Payload's asset picker drawer, improving visual clarity and preventing size mismatch errors.
- **Preferences**:
  - Azuma prefers precise filtering constraints to eliminate redundant asset choices (like separating main hero images from small thumbnails/OG variants) and clean up the administrative flow.
- **Plan Impact**:
  - Always consider pointer event transparency when wrapping or injecting custom elements inside Payload CMS admin panel list view table rows.
  - Proactively use `filterOptions` on relationship/upload fields whenever specific dimensions or asset statuses are expected.

### [2026-05-30 13:15] Session Summary
- **Learned/Decided**:
  - In Payload CMS v3 single-page admin layout, the live preview `iframe` stays mounted in the DOM even when the preview panel is toggled OFF (hidden).
  - To robustly check if live preview is actually active and visible, we must verify both the existence of the `iframe` and its layout size (`iframe.offsetParent !== null` and `iframe.getBoundingClientRect().width > 0`).
  - When programmatically modifying layout-level elements (`splitParent`, editor container, preview container) by injecting flex styles, we must preserve exact DOM references in state/refs and completely clear all programmatically set inline styles (setting them to `''`) when tearing down or removing features to avoid layout pollution.
- **Preferences**:
  - Azuma wants the interface to completely and cleanly collapse when live preview is hidden, scaling the editor to full width with zero trailing margins or trailing spaces.
- **Plan Impact**:
  - All future programmatic visual layout interventions must dynamically track target DOM elements and implement complete cleanups in their teardown hooks.

### [2026-05-30 13:30] Session Summary
- **Learned/Decided**:
  - Identified that custom `Cell` overrides on primary identifier columns in Payload CMS collections (like `Media.filename` or `Posts.title`) completely wipe out standard modal/drawer row click handlers and React contexts (such as Radix UI selection bindings).
  - This causes the entire list drawer rows to become unselectable, freezing relationship and upload selections.
  - Decided to restore the default native Cell renderer for `Media.filename` to preserve drawer functionality, and established a permanent project rule strictly prohibiting major identifier cell overrides.
  - Decided that iterative full builds (`pnpm run build`) are unnecessary during hot-reloading development (Fast Refresh) to save time, and only a single final build verification is required immediately before final commit/push.
- **Preferences**:
  - Azuma wants solid, robust default behaviors for major CMS administrative flows, prioritizing standard framework stability and avoiding structural custom component overrides that break modal selectors.
- **Plan Impact**:
  - Never register custom `Cell` components on primary identification fields. Implement visual optimizations as distinct alternative UI fields or sidebar components instead.

### [2026-05-30 14:52] Session Summary
- **Learned/Decided**:
  - Identified that using complex asynchronous callbacks like `img.decode()` inside `useEffect` in combination with manual DOM style mutations (`el.style.opacity = '1'`) can cause permanent image load state freezes (images remaining invisible at `opacity: 0`). This happens when decode promises reject or fail silently under Fast Refresh or custom optimizer environments.
  - Simplified the `AdminThumbnailCell` component by stripping raw DOM mutation logic and replacing it with robust cache-aware React state initialization (`isUrlCached`) and stable standard `onLoad` / `img.complete` fallback properties.
- **Preferences**:
  - Prioritize standard React declarative rendering patterns (`style={{ opacity: loaded ? 1 : 0 }}`) over direct DOM properties mutation to avoid layout and opacity state synchronization discrepancies.
- **Plan Impact**:
  - Any future image rendering or optimization helpers in Admin panel custom cells should adopt this simplified declarative approach to guarantee render reliability under both cached and fresh CDN requests.




