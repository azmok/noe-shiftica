# Apple Newsroom Japan

Audited November 25, 2026. Scope includes the [Newsroom homepage](https://www.apple.com/jp/newsroom/), the [Store News](https://www.apple.com/jp/newsroom/topics/store-news/), [Company News](https://www.apple.com/jp/newsroom/topics/company-news/), and [Apple Stories](https://www.apple.com/jp/newsroom/apple-stories/) listings, plus 11 distinct article pages. Measurements use Windows Chromium at 1440, 1024, 768, and 390 CSS px, at default zoom with `lang="ja-JP"`. Article and topic measurements use downloaded HTML and its Newsroom CSS. The homepage loads its feed with JavaScript, so homepage card values are computed from minimal class probes using its published stylesheets. Apple webfonts, imagery, and JavaScript were excluded from the offline run. Font families below describe the declared CSS stack. Image measurements describe box widths and margins.

## Article type and spacing

Values within a cell are **font size / line height / weight / letter spacing**. Sizes and leading are rounded to the nearest CSS px. A tracking value of 0 includes computed `normal`. Medium and small styles switch at 1068px and 734px respectively in the reference CSS.

| Role and selector | 1440px | 1024px and 768px | 390px |
| --- | --- | --- | --- |
| Standard title `.pagetitle .hero-headline` | 48 / 55 / 700 / 0 | 40 / 47 / 700 / 0 | 32 / 39 / 700 / 0 |
| Featured story or photo title, same selector | 64 / 71 / 700 / 0 | 56 / 63 / 700 / 0 | 32 / 39 / 700 / 0 |
| Retail title, same selector | 56 / 63 / 700 / 0 | 48 / 55 / 700 / 0 | 32 / 39 / 700 / 0 |
| Standard deck `.article-subhead .component-content` | 24 / 30 / 500 / .009em | 21 / 26 / 500 / .011em | 21 / 26 / 500 / .011em |
| Featured deck `.featured-subhead .component-content` | 24 / 30 / 600 / .009em | 21 / 26 / 600 / .011em | 21 / 26 / 500 / .011em |
| Body `.pagebody-copy` | 19 / 26 / 400 / .012em | 17 / 23 / 400 / 0 | 17 / 23 / 400 / 0 |
| Section heading `.pagebody-header` | 24 / 30 / 700 / .009em | 21 / 26 / 700 / .011em | 21 / 26 / 700 / .011em |
| Standard category `.category-eyebrow` | 12 / 17 / 700 / 0 | Same | Same |
| Standard date `.category-eyebrow__date` | 14 / 19 / 600 / 0 | Same | Same |
| Image caption `.image-caption` | 12 / 17 / 600 / 0 | Same | Same |
| Legal copy `.sosumi .component-content` | 12 / 17 / 400 / 0 | Same | Same |

- **Font stack.** Japanese display roles and standard body declare SF Pro JP, SF Pro Display, SF Pro Icons, Hiragino Kaku Gothic Pro, ヒラギノ角ゴ Pro W3, メイリオ, Meiryo, ＭＳ Ｐゴシック, Helvetica Neue, Helvetica, Arial, sans-serif. Small text roles substitute SF Pro Text for SF Pro Display. The sampled paragraph has normal font features and automatic line breaking. The regular copy uses light-theme `#1d1d1f` or dark-theme `#f5f5f7`. Captions use `#6e6e73` or `#86868b`, respectively.
- **Text measure.** Standard body width is 653px on desktop, 576px at both sampled tablet widths, and 341.25px on the 390px phone. These are about 34, 34, and 20 full-width character equivalents. The first two values are almost identical when normalized by type size. Quick Read uses effectively the same measure, with small fractional differences.
- **Vertical rhythm.** Ordinary paragraphs give the next paragraph about one line of space, 26px or 23.26px. Standard section headings have 16px after the heading. Measured space above a desktop heading ranged from 8px at the start of a module to 52px within a longer module. Typical large media blocks have 44px vertical margins on desktop, 36px at tablet widths, and 32px on small screens. Standard date follows its category with a 4px top margin.
- **Media width.** Product release media can use a 980px desktop frame while its main prose uses a 653px rail. The retail and film stories also use full viewport media. Quick Read confines its image to the text rail. Captions often inset by 24px on each side of the copy measure, yielding 605px in the standard desktop case. Some full-bleed modules use the whole caption rail.
- **Tone and emphasis.** Product and finance copy is regular weight with selective bold emphasis. Featured stories use a heavier deck, wider display headline, and occasional large quotes. The Cherokee education story renders its desktop pullquote at 40px / 51px / 400. The theme can change without changing the default paragraph rhythm.

## Listing styles

The homepage stylesheet probes use the Japanese pinned hero and standard 2-up and 3-up feed card roles. The Store News listing supplies a cross-check from populated HTML. Special gradients and overlays can have different text colors and padding.

| Role | 1440px | 1024px and 768px | 390px |
| --- | --- | --- | --- |
| Homepage pinned hero title | 48 / 55 / 700 / 0 | 40 / 47 / 700 / 0 | 24 / 30 / 700 / 0 |
| Homepage pinned hero content inset | 36px sides and bottom | 24px sides and bottom | 24px sides and bottom |
| Standard 2-up feed headline | 24 / 30 / 700 / .009em | 21 / 26 / 700 / .011em | 21 / 26 / 700 / .011em |
| Standard 2-up caption panel inset | 32px | 24px | 24px |
| Standard 2-up category | 14 / 19 / 700 / 0 | 12 / 17 / 700 / 0 | 12 / 17 / 700 / 0 |
| Standard 2-up date | 17 / 21 / 600 / 0 | 14 / 19 / 600 / 0 | 14 / 19 / 600 / 0 |
| Standard 3-up feed headline | 21 / 26 / 700 / .011em | Same | Same |

The desktop Store News feature uses a 980px card with a 40px / 47px / 700 title and 36px lower inset. Its 303px 3-up cards use a 21px / 26px / 700 headline and 24px padding. Standard feed headlines use `#1d1d1f` and supporting metadata uses `#6e6e73`. Compact 2-up feed headlines start 8px below their metadata, compared with 12px at desktop. Date typically starts 12px below the headline. Scaling the headline and internal padding by card priority lets readers scan the hierarchy before reading each label.

## Article sample matrix

All 11 share the same ordinary body size, leading, weight, and tracking at the four measured widths. Hero metrics below are size and leading at 1440px. Module counts refer to structural elements in the saved HTML.

| Article | Template and hero | What changes in the layout |
| --- | --- | --- |
| [iPhone Air announcement](https://www.apple.com/jp/newsroom/2025/09/introducing-iphone-air-a-powerful-new-iphone-with-a-breakthrough-design/) | Light release, 48/55 | Deck, 10 body modules, three galleries, product video, pricing and legal copy. Alternates the narrow prose rail with wide media. |
| [Apple at 50](https://www.apple.com/jp/newsroom/2026/03/apple-to-celebrate-50-years-of-thinking-different/) | Light update, 48/55 | One illustration followed by one continuous copy module with no deck. |
| [Shopping for the September lineup](https://www.apple.com/jp/newsroom/2025/09/get-ready-to-discover-the-next-generation-of-iphone-apple-watch-and-airpods/) | Light service update, 48/55 | Deck, eight copy modules, five galleries, and repeatable product headings organize a long mixed-content guide. |
| [Lineup arrival photo essay](https://www.apple.com/jp/newsroom/2026/09/the-latest-iphone-apple-watch-and-airpods-lineups-arrive-in-stores-worldwide/) | Dark image feature, 64/71 | One copy module leads into 41 large image modules and five pullquotes. Captions and visual sequence carry the story. |
| [AirPods Quick Read](https://www.apple.com/jp/newsroom/2025/06/airpods-now-more-versatile-with-studio-quality-audio-recording-and-camera-remote/) | Light short format, 48/55 | Slimmer page chrome, 14px category treatment, one media block aligned with the prose, and one body module. |
| [Developing hearing health](https://www.apple.com/jp/newsroom/2024/10/how-apple-developed-the-worlds-first-end-to-end-hearing-health-experience/) | Dark feature, 64/71 | Prominent deck, drop-cap module, soundbite, gallery, and video interleaved with copy. |
| [Apple Umeda opening](https://www.apple.com/jp/newsroom/2025/07/apple-umeda-opens-saturday-offering-customers-a-new-retail-destination-in-osaka/) | Dark retail release, 56/63 | Midpoint headline scale, viewport-wide architectural lead, two galleries, and a conventional press-release body. |
| [MAMI Select filmmakers](https://www.apple.com/jp/newsroom/2026/05/how-filmmakers-are-redefining-the-art-form-with-mami-select-filmed-on-iphone/) | Dark film feature, 64/71 | Full-bleed video, drop-cap lead, three galleries, and three tertiary navigation modules for the film chapters. |
| [Cherokee language learners](https://www.apple.com/jp/newsroom/2026/05/cherokee-language-learners-bridge-generations-with-ipad-and-mac/) | Dark education feature, 64/71 | Full-bleed video, paired photo grid, two galleries, and a wide pullquote punctuate a narrow reading rail. |
| [3D-printed watch cases](https://www.apple.com/jp/newsroom/2025/11/mapping-the-future-with-3d-printed-titanium-apple-watch-cases/) | Dark process feature, 64/71 | Full-bleed video, inline process images, pullquote, and a separate gallery with an autoplay video variant. |
| [Fourth-quarter results](https://www.apple.com/jp/newsroom/2026/11/apple-reports-fourth-quarter-results/) | Light financial release, 48/55 | Short deck and one copy module, followed by investor, legal, and press information. No editorial media module in the body. |

## Applying the reference in an article preview

Use the body scale, line spacing, tracking, weight, heading hierarchy, and caption scale as a common reading system. Keep titles and media free to vary with the article. The practical inference from Apple is that limiting prose width and spacing content by role can keep reading predictable across templates with very different visual density.

For an isolated catalog sample, try the measured Japanese type scale with locally available fonts. The optional spread layout balances two columns by rendered height on desktop and tablet, and keeps a single column on phones. Both columns share the page scroll. Reading proceeds down the left and continues at the top of the right. The two-column spread is a separate experiment from the reference typography and can be compared with a single-column sample.

Primary CSS sources include [articlev2.built.css](https://www.apple.com/newsroom/styles/articlev2.built.css), [quick-read.built.css](https://www.apple.com/newsroom/styles/quick-read.built.css), [pinned-hero-landing.built.css](https://www.apple.com/newsroom/styles/pinned-hero-landing.built.css), [everyday-feed.built.css](https://www.apple.com/newsroom/styles/everyday-feed.built.css), and [tiles.built.css](https://www.apple.com/newsroom/styles/tiles.built.css).
