# Article design catalog

From the repository root, start the local preview with Node.js.

```powershell
node apps/design-catalog/serve.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Set `CATALOG_PORT` if that port is occupied. The server binds to loopback and serves the catalog directory. The preview uses local images and needs no package installation or CMS connection. The fonts come from Google Fonts, so the matched typography needs internet access. Run `node apps/design-catalog/build-fonts.mjs` to regenerate `fonts.css`.

Open a sample in one panel, or switch to two or three panels to compare it. Each panel has its own theme, width, column layout, adjustments, and analysis note. Fixed width presets scale down to fit the available panel. The automatic column mode uses two columns at a preview width of 768px or more. In spread mode, the article keeps its natural typography and spacing without shrinking text or forcing fixed slots; left and right panes stay fixed with a 1:1 continuous offset equal to the visible column height so the right column always continues immediately after the left column, media and tables align cleanly past column seams, and the end of the article reaches the bottom of the right pane at the end of the scroll range. Panel synchronization separately matches the scroll percentage across comparison panels.

Open **数値を調整** to change the selected panel's editorial theme, layout, type, spacing, and notes. Use **編集対象** to switch among comparison panels. Each preview's **調整** button opens the editor for that preview. Close it with the toggle, close button, or Escape.

Use the expand icon on a preview to read it across the window. The first fullscreen visit shows an Escape shortcut hint. Press Escape or use the collapse icon to return to the catalog.

**ライト** and **ダーク** change both the workspace and all article previews, independently of the editorial themes. The browser remembers the current comparison. Use **JSONで保存** to keep or share an experiment and **JSONを読み込む** to reopen it. A saved comparison includes all panel settings, the appearance, the sample selection, and the analysis notes.

## Sources and extensions

- Research lives in [docs/design-catalog](../../docs/design-catalog/README.md). Use its template when measuring a new reference site.
- Add a preset to [themes.mjs](themes.mjs) and its palette to [catalog.css](catalog.css). The theme picker reads all registered presets. A preset supplies viewport-based defaults and a short explanation of the design.
- [samples/index.json](samples/index.json) contains three editorial snapshots from the [public Noe Shiftica blog](https://noe-shiftica.com/blog). Each sample records its canonical source URL and keeps its published body text, headings, links, images, and tables. Snapshot markup is limited to editorial elements and the public images are packaged in `samples/media/`. Keep scripts, widgets, embeds, and source CSS out of sample markup. JSON comparison imports accept only settings and notes.

Open `/pages.html` for the Noe Shiftica page previews in the Apple, Airbnb, and Webflow themes. View one theme on desktop and phone, or compare all three themes side by side. Links inside a preview move every frame. Each theme has its own page structure in `site/<theme>.mjs` and `site/<theme>.css`; the copy is shared in `site/content.mjs`. Article images load from the published site storage, so they need internet access.

Open `/ui.html` for the **UI全般（Awwwards UI Pattern Catalog）** section. It organizes six measured Awwwards references (SOTD and UI Design / Minimal / Clean nominees) into six reusable UI categories with live interactive demos, local screenshots (`ui/media/`), natural-language design notes, extracted CSS tokens/snippets, and extracted JS micro-interactions. Research evidence lives in [docs/design-catalog/awwwards-ui-general.md](../../docs/design-catalog/awwwards-ui-general.md).
