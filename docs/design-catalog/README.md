# Design catalog

Use this catalog to turn a reference site into measurable design decisions that can be reused in Noe Shiftica.

| Reference | What to reuse | Evidence |
| --- | --- | --- |
| [Apple Newsroom Japan](apple-newsroom-jp.md) | Japanese editorial typography, text measure, media rhythm, and card hierarchy | Homepage stylesheet probes, topic listings, and 11 article snapshots at four viewport widths |
| [Airbnb Newsroom Japan](airbnb-newsroom-jp.md) | Relaxed leading, lighter headings, and section spacing | One Japanese feature article snapshot at four viewport widths |
| [Webflow Blog](reproduction-guide.md) | Split header, steep type scale, side rail, fluid sizing | One article measured live at 1440, 820, and 390 px |
| [Awwwards UI General](awwwards-ui-general.md) | Dark surface architecture, pill controls, warm task cards, monochrome technical lists, grid docks, editorial indices | Six live Awwwards references measured via Firecrawl branding/screenshot capture on 2026-11-26 |

Start with the [reproduction guide](reproduction-guide.md) (日本語) for the design essence, the font matching, and the verification steps. Machine-readable values are in [tokens.json](tokens.json), and the measuring scripts are in [tools/](tools/).

Open the [local comparison app](../../apps/design-catalog/README.md) to test the presets with the same sample article.

Start a new site entry with the [reference audit template](template.md). Keep the source URL, capture date, viewports, and role selectors beside each set of values. Add the entry to this index when the evidence and the project adaptation are both documented.

The Noe Shiftica page previews (top, services, works, about, article list, article) are at `pages.html` in the same app.
