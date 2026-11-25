# Reference design audit template

Record the site, locale, audit date, intended use, operating system, browser version, zoom, viewport widths, and light or dark theme. Write what you like in terms of a reader's task, such as scanning a dense list or following a long article.

## Sample the system

Pick a listing and several detail pages with different content structures. Include the compact and expansive variants, heavy media, sparse text, anchored headings, and any unusual modules. Record what each sample adds to the comparison.

| URL | Template or variant | Distinctive modules | Evidence and gaps |
| --- | --- | --- | --- |
| | | | |

## Extract the roles

Inspect the rendered element, its parent, and the neighboring block. Start with viewport widths representative of desktop, tablet in both orientations, and phone. Add measurements on either side of any breakpoint that changes the hierarchy. Wait for fonts and content to settle. For client-rendered areas, capture the populated view or mark the result as a stylesheet probe.

| Role and selector | Viewport | Family and rendered font | Size / leading / weight / tracking | Width and spacing | Color or surface |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Use the browser's Computed and Rendered Fonts panels to distinguish the declared stack from the font that actually rendered. Collect element geometry separately from computed CSS when evaluating margins, padding, gaps, and line measure. This console snippet reads a selected element and its children only through explicit selectors. Adjust the role map per site.

```js
const roles = { body: 'article p', title: 'article h1', caption: 'article figcaption' };
await document.fonts.ready;
console.table(Object.entries(roles).flatMap(([role, selector]) => {
  const element = document.querySelector(selector);
  if (!element) return [];
  const style = getComputedStyle(element);
  return [{
    role, selector, viewport: innerWidth, locale: document.documentElement.lang,
    family: style.fontFamily, size: style.fontSize, leading: style.lineHeight,
    weight: style.fontWeight, tracking: style.letterSpacing, features: style.fontFeatureSettings,
    lineBreak: style.lineBreak, width: element.getBoundingClientRect().width,
    margin: style.margin, padding: style.padding, gap: style.gap,
    color: style.color, background: style.backgroundColor,
  }];
}));
```

Sample paragraph width in full-width character equivalents by dividing the content width by the body font size. Check an actual Japanese paragraph as well, since Latin text, punctuation, kerning, and font metrics change how many characters fit.

## Decide what transfers

Explain how the repeated measurements relate to the reading experience. Keep one-off values tied to their template. Record the adopted roles, target components, responsive behavior, and intentional departures. Verify real content, long titles, keyboard navigation, zoom, narrow screens, and wide media before calling the adaptation ready.
