# Article design catalog

From the repository root, start the local preview with Node.js.

```powershell
node apps/design-catalog/serve.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Set `CATALOG_PORT` if that port is occupied. The server binds to loopback and serves the catalog directory. The preview uses local images and needs no package installation, CMS connection, or internet access.

Open a sample in one panel, or switch to two or three panels to compare it. Each panel has its own theme, width, column layout, adjustments, and analysis note. Fixed width presets scale down to fit the available panel. The automatic column mode uses two columns at a preview width of 768px or more. The spread fits successive groups of text and media into two reading slots per column. Both columns stay in place and advance continuously on the same scrollbar. Scrolling by half the frame advances the visible groups from 1–2 / 3–4 to 2–3 / 4–5. The right frame shows the end of the article at the bottom of the scroll range. Panel synchronization separately matches the scroll percentage across comparison panels.

Open **編集パネル** to change the selected panel's editorial theme, layout, type, spacing, and notes. Use **編集対象** to switch among comparison panels. Each preview's **調整** button opens the editor for that preview. Close it with the toggle, close button, or Escape.

**ライト** and **ダーク** change both the workspace and all article previews, independently of the editorial themes. The browser remembers the current comparison. Use **JSONで保存** to keep or share an experiment and **JSONを読み込む** to reopen it. A saved comparison includes all panel settings, the appearance, the sample selection, and the analysis notes.

## Sources and extensions

- Research lives in [docs/design-catalog](../../docs/design-catalog/README.md). Use its template when measuring a new reference site.
- Add a preset to [themes.mjs](themes.mjs) and its palette to [catalog.css](catalog.css). The theme picker reads all registered presets. A preset supplies viewport-based defaults and a short explanation of the design.
- [samples/index.json](samples/index.json) contains three editorial snapshots from the [public Noe Shiftica blog](https://noe-shiftica.com/blog). Each sample records its canonical source URL and keeps its published body text, headings, links, images, and tables. Snapshot markup is limited to editorial elements and the public images are packaged in `samples/media/`. Keep scripts, widgets, embeds, and source CSS out of sample markup. JSON comparison imports accept only settings and notes.
