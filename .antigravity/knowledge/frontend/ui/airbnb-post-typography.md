# Airbnb-Style Blog Typography Implementation (Tailwind CSS)

## Overview
This knowledge item defines the exact styling metrics required to achieve the "Airbnb Newsroom" aesthetic for individual blog post content. It translates the legacy CSS rules previously used into modern Tailwind CSS classes.

### Core Philosophy
- **Breathability**: Massive top margins for headings to create a sense of premium space.
- **Fixed Targets**: Maintaining absolute pixel targets (46px Title, 18px Body) regardless of the root font size changes.
- **Controlled Weights**: Heavy use of `font-medium` (500) to keep a sophisticated, urban feel.

---

## Typography Metrics & Tailwind Mappings

Assume a **16px base font size** for all `rem` calculations.

### Desktop (PC) Styles
| Element | Pixel Target | Tailwind Class / CSS | Notes |
| :--- | :--- | :--- | :--- |
| **Wrapper** | 872px Max-Width | `max-w-[872px]` | The "Golden Width" for readability. |
| **Title (H1)** | 46px | `text-[2.875rem]` | `leading-[1.13]` / `font-medium` |
| **H2 Heading** | 32px | `text-[2.0rem]` | `mt-[3.5rem]` / `mb-[1.5rem]` / `leading-[1.125]` |
| **H3 Heading** | 18px | `text-[1.125rem]` | `mt-[2.5rem]` / `mb-[1.25rem]` / `leading-[1.22]` |
| **Paragraph (P)** | 18px | `text-[1.125rem]` | `mb-[1.75rem]` / `leading-[1.55]` |
| **Lists (UL/LI)** | - | `pl-8` (32px) | `mb-3` (12px) per list item |

### Mobile Styles
| Element | Pixel Target | Tailwind Class | Notes |
| :--- | :--- | :--- | :--- |
| **Title (H1)** | 26px | `text-[26px]` | `leading-[30px]` / `mb-6` |
| **H2 Heading** | 26px | `text-[26px]` | `mt-8` / `mb-5` |
| **H3 Heading** | 18px | `text-[18px]` | `mt-6` / `mb-4` |
| **Paragraph (P)** | 16px | `text-[16px]` | `mb-6` / `leading-6` |
| **Lead Paragraph** | 16px | `font-semibold` | First paragraph in content is bold on mobile. |

---

## Implementation Example (React/Tailwind)

To implement this style, apply the following `prose` modifiers to the content wrapper in `PostArticle.tsx`.

```tsx
<article className="
  /* Layout */
  mx-auto max-w-[872px] px-6
  
  /* Global Prose Reset & Base Body Settings */
  prose prose-invert
  prose-p:text-[1.125rem] prose-p:leading-[1.55] prose-p:mb-[1.75rem]
  
  /* Headings */
  prose-h1:text-[2.875rem] prose-h1:leading-[1.13] prose-h1:font-sans prose-h1:font-medium prose-h1:mb-8
  prose-h2:text-[2rem] prose-h2:leading-[1.125] prose-h2:mt-14 prose-h2:mb-6 prose-h2:font-sans prose-h2:font-medium
  prose-h3:text-[1.125rem] prose-h3:leading-[1.22] prose-h3:mt-10 prose-h3:mb-5 prose-h3:font-sans prose-h3:font-medium
  
  /* Lists */
  prose-ul:pl-8 prose-ul:list-disc
  prose-li:mb-3 prose-li:leading-[1.55]
  
  /* Media & Tables */
  prose-img:rounded-2xl prose-img:my-8
  prose-table:border-separate prose-table:border-spacing-0 prose-table:border prose-table:border-white/10
  prose-table:rounded-2xl prose-table:overflow-hidden
  prose-th:px-8 prose-th:py-5 prose-th:bg-white/5
  prose-td:px-8 prose-td:py-5 prose-td:border-t prose-td:border-white/10
  
  /* Mobile Overrides (below 768px) */
  md:prose-p:text-[1.125rem] 
  max-md:prose-p:text-[16px] max-md:prose-p:mb-6
  max-md:prose-h1:text-[26px] max-md:prose-h2:text-[26px]
  max-md:prose-headings:font-sans
  max-md:prose-img:my-10
">
  {content}
</article>
```


---

## Design Refinements for Dark Theme
1. **Text Contrast**: Use `text-white/90` for paragraphs to reduce eye strain against pure black backgrounds.
2. **Table Glow**: On hover, apply a subtle glow or background shift using `hover:bg-white/5` for table rows.
3. **Link Animation**: (CSS required)
   ```css
   .prose a {
     background-image: linear-gradient(var(--color-primary), var(--color-primary));
     background-position: 0% 100%;
     background-repeat: no-repeat;
     background-size: 0% 1.5px;
     transition: background-size 0.3s ease;
   }
   .prose a:hover {
     background-size: 100% 1.5px;
   }
   ```

## Document History
- **2026-04-03**: Created by Antigravity (Oje). Migrated from legacy CSS at commit `486e8c5`.
