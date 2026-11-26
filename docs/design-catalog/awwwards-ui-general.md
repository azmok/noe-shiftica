# Awwwards UI General Audit (2026-11-26)

Measured live on **2026-11-26** using Firecrawl (`branding` token extraction + desktop viewport screenshots) across six Awwwards-recognized sites spanning **Site of the Day (SOTD)** and **UI Design / Minimal / Clean** nominees.

The interactive catalog lives at `apps/design-catalog/ui.html` with local screenshots in `apps/design-catalog/ui/media/`.

## Taxonomy (6 Categories)

| Category | Reference Site | Award / Recognition | Primary Transferable Pattern |
| --- | --- | --- | --- |
| Surface & Dark Architecture | [Factura](https://getfactura.app/) | Awwwards UI Design Nominee (Tubik PRO) | Near-black canvas (`#08090A`), recessed input (`#050607`), hairline border (`#303031`), single terracotta accent (`#BA5539`), Geist sans, zero drop shadows |
| Pill Controls & Ambient AI UI | [Cheese AI](https://ai.cheesedesign.kr/) | Awwwards Minimal & Clean Nominee | Pure black canvas (`#000000`), restrained bottom indigo ambient glow, `999px` pill input & primary action (`#0071E3`), Pretendard CJK-friendly sans |
| Task & Warm Light Cards | [Tirus](https://tirus.app/) | Awwwards UI Design Nominee | Warm stone paper (`#F8F6F0`), deep charcoal ink (`#161616`), floating white pill nav bar, `16px` cards / `12px` ink CTA, pastel metadata accents, DM Sans |
| Technical Mono & Inverted Lists | [Artemii Lebedev](https://artemiilebedev.com/) | **Awwwards SOTD 7.27/10** (Nov 22, 2026) | `Fragment Mono`, `0–2px` sharp geometry, full black/white inverted active row, tabular right-aligned metadata, Swiss counter panel |
| Grid Coordinates & Floating Dock | [Studio Loum](https://www.studioloum.com/) | Awwwards UI Design & Minimal Nominee | Hairline 1px grid with `+` intersection crosshairs, generous whitespace, frosted bottom floating pill dock with numbered index and live clock |
| Editorial Contrast & Numbered Index | [Creative Reference Library](https://crl-2026.webflow.io/) | **Awwwards SOTD 7.44/10** (Nov 10, 2026) | Extreme type scale contrast (`16px` index metadata vs `120px` display), `Neue Haas Grotesk`, `(1)` `(2)` hanging-indent reference notation |

## Extracted Core Principles for Generative UI Reports

1. **Zero noisy borders or emoji icons**: Replace thick colored left/top borders and raw emoji markers with 1px hairline borders (`rgba(255,255,255,0.08)` in dark / `rgba(22,22,22,0.09)` in light), subtle surface elevation steps, and consistent stroke Lucide SVG icons.
2. **Restrained single-accent discipline**: Keep 90%+ of surfaces neutral (obsidian/charcoal or warm stone), reserving semantic accents strictly for status badges, active indicators, and primary CTAs.
3. **Typography & tabular rhythm**: Pair a crisp geometric sans (Inter / Geist / Noto Sans JP) with a technical monospace (`Fragment Mono` / `JetBrains Mono`) and `font-variant-numeric: tabular-nums` for counts, timestamps, and verification metrics.
4. **Tactile micro-interactions**: Use 150–260ms `cubic-bezier(0.16, 1, 0.3, 1)` transitions, inverted or elevated active rows, interactive filters, and instant copy confirmation feedback, respecting `prefers-reduced-motion`.
