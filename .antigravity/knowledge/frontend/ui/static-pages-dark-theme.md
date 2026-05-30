# Static Pages Premium Dark Theme Unification

### Implementation Pattern
Unified the styling of administrative static pages (Tokusho, Terms, Privacy) into the site's signature "Premium Dark Void" theme, utilizing mesh gradient overlays, SVG noise filters, transparent dark glass cards, and brand lime (`#E2FF3D`) accents.

### Files Involved
- `src/app/(frontend)/tokusho/page.tsx`
- `src/app/(frontend)/terms/page.tsx`
- `src/app/(frontend)/privacy/page.tsx`

### Process Flow
1. **Background & Atmosphere**: Replaced the static `bg-white text-slate-800` wrapper with `bg-background-void text-slate-300 relative overflow-hidden` and embedded the premium animated mesh gradient blobs alongside the global `noiseFilterDetail` SVG noise texture.
2. **Glassmorphism Container**: Swapped the light-neumorphic `neu-flat` card wrappers for a modern transparent dark card: `bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl` to embed the text contents beautifully.
3. **Typography & Brand Accents**:
   - Upgraded main headings to a bold sans-serif: `text-white font-sans font-bold tracking-tight`.
   - Enhanced subheadings (h2) with a strong border-left using the brand accent color: `text-white border-l-4 border-[#E2FF3D] pl-4`.
4. **Dark Table & Markdown Components**:
   - Styled tabular data elements using translucent backgrounds (`bg-white/[0.02]`) and explicit borders (`border-white/10`) to match the void environment.
   - Refined paragraph, blockquote, and list structures with `text-slate-300` and `leading-relaxed` for maximum readability against dark backgrounds.
5. **Interactive Controls**: Modified back-to-home links to employ standard premium button patterns: `bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-slate-300`.

### Gotchas / Notes
- **Text Visibility**: Ensure that inline markdown renderers (e.g. `renderMarkdown` or `renderBody`) do not output static `text-slate-600` or `text-slate-700` colors, as they become practically invisible on the dark void background. Always override inline text render utilities to map paragraphs/lists strictly to `text-slate-300`.
- **SVG Filters**: Next.js SVG noise overlays must be placed within a hidden `<svg className="hidden">` element inside each page's return structure to correctly apply the noise filter under dynamic rendering.
