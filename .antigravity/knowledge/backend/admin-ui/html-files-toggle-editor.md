# HTML Files Toggle Editor & Sticky Headings

### Implementation Pattern
Implemented an intelligent, toggleable (accordion-style) textarea editor with sticky headings inside the custom field component `MobileFullscreenEditor` for the `html-files` collection. Also enabled seamless real-time Live Preview support for the collection, mimicking the dynamic blog preview experience.

### Files Involved
- `src/collections/HtmlFiles.ts`
- `src/components/MobileFullscreenEditor/index.tsx`
- `src/app/(frontend)/html-files/[id]/preview/page.tsx`
- `src/app/(frontend)/html-files/[id]/preview/client.tsx`

### Process Flow
1. **Live Preview Configuration**:
   - Registered `livePreview` within the `admin` options in `HtmlFiles.ts` pointing to `/html-files/[id]/preview`.
   - Created the Server Component page and Client Component on the frontend that registers the standard `useLivePreview` listener, resolving live edits on text areas dynamically inside a premium dark backdrop layout.
2. **Desktop Accordion Toggle**:
   - Added a React state `isCollapsed` initialized to `true` (closed by default) inside `MobileFullscreenEditor/index.tsx`.
   - Replaced static labels with interactive headers (`cursor: pointer`, `user-select: none`) showcasing visual transitions via a rotating CSS-arrow icon (`▶` to `▼`).
3. **Opaque Sticky Headings**:
   - Configured labels to stay stuck during scroll using `position: sticky` and `top: 56px` to cleanly float beneath Payload CMS v3's static header bar.
   - Employed `background: var(--theme-bg, #0d0f14)` and custom negative margins to ensure content scrolling underneath is cleanly masked rather than showing overlapping transparent layers.

### Gotchas / Notes
- **Sticky Offset**: PayloadCMS v3 employs a fixed top layout bar that measures roughly `56px` (`3.5rem`). Standard `top: 0` sticky parameters will push elements underneath the core layout header. Always specify `top: 56px` for comfortable floating aesthetics in the Admin UI.
- **Strict Scoping Background**: When expanding padding and margins to overflow the default container layout bounds, always match container backgrounds to the current theme elevation vars to preserve a unified grid look.
