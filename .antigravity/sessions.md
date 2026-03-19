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

