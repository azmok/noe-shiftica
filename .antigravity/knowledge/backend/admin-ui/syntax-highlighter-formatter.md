# Admin UI Custom Syntax Highlighter, Formatter & Error Visualizer

### Implementation Pattern
Designed and integrated a premium, portable custom code editor with syntax highlighting, automatic code formatting, and VS Code-style inline error visualizers inside the PayloadCMS Admin UI.

### Files Involved
- `src/components/MobileFullscreenEditor/index.tsx`

---

## [2026-05-30] Migration: Prism.js → CodeMirror 6

### Why Migrated
The original Prism.js overlay approach (transparent textarea + `<pre>` layer) was fundamentally slow and buggy:
- `Prism.highlight()` reprocessed the entire text on every keystroke (O(n))
- The `position: absolute` overlay caused scroll sync misalignment
- `dangerouslySetInnerHTML` triggered full DOM rewrites on every change

### New Implementation: CodeMirror 6 via `@uiw/react-codemirror`

**Packages installed:**
```
pnpm add @uiw/react-codemirror @codemirror/lang-html @codemirror/lang-css @uiw/codemirror-theme-vscode @codemirror/view
```

**Key implementation pattern:**
```tsx
const CodeMirrorEditor = dynamic(
  async () => {
    const [{ default: CM }, { html }, { css }, { vscodeDarkInit }] = await Promise.all([
      import('@uiw/react-codemirror'),
      import('@codemirror/lang-html'),
      import('@codemirror/lang-css'),
      import('@uiw/codemirror-theme-vscode'),
    ])

    // Use vscodeDarkInit with settings overrides — not a separate extension
    const editorTheme = vscodeDarkInit({
      settings: {
        selection: '#e2ff3d3a',     // E2FF3D @ ~0.23 alpha
        selectionMatch: '#e2ff3d24',
      },
    })

    function EditorCore({ language, value, onChange }) {
      const extensions = useMemo(
        () => (language === 'css' ? [css()] : [html()]),
        [language]
      )
      return (
        <CM
          value={value}
          onChange={(val) => onChange(val)}
          extensions={extensions}
          theme={editorTheme}
          minHeight="400px"
          basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: true, autocompletion: true }}
        />
      )
    }
    return EditorCore
  },
  { ssr: false }
)
```

### Process Flow
1. **Dynamic Controls Portal**: React Portal (`createPortal`) injects controls into `.doc-controls__content` header.
2. **CodeMirror Editor**: Replaces the old textarea/pre overlay. Manages its own internal state (incremental highlighting, virtual rendering). Only `value` prop syncs from outside.
3. **Debounced Payload sync + error analysis**: `setValue(localVal)` fires immediately; error check (`checkHtmlErrors` / `checkCssErrors`) debounced 150ms.
4. **JS-Beautify Formatting**: Same `html-files:format` custom event approach; after format, `setLocalVal(formatted)` feeds the new value into CodeMirror via the `value` prop.
5. **Stack-Based Syntax Error Panel**: Same lightweight HTML/CSS parsers retained. Error panel rendered below editor.

### Gotchas / Critical Notes

#### Selection Color Override — CRITICAL
`@uiw/codemirror-themes`'s `createTheme` sets selection color via:
```js
themeOptions['&.cm-focused .cm-selectionBackground, & .cm-line::selection, ...'] = {
  background: settings.selection + ' !important'
}
```
This means:
- It uses `!important` internally
- A CSS injection approach (injecting a `<style>` tag) cannot reliably win because the scoped class selector (e.g., `.ͼ1 .cm-selectionBackground`) may have equal/higher specificity among `!important` declarations, and the theme style is injected AFTER the manually injected style.
- **DO NOT fight the cascade with a `<style>` tag or a separate `EditorView.theme()` extension.**
- **CORRECT approach**: Pass `settings.selection` directly to `vscodeDarkInit()`. This uses the same code path that generates the default blue, producing the correct selector and `!important` automatically.

#### `@codemirror/view` pnpm strict-mode caveat
pnpm strict mode prevents importing transitive dependencies directly.
Even if `@codemirror/view` is installed as a peer, it may not be resolvable without being in `package.json`.
Always `pnpm add @codemirror/view` explicitly if `EditorView` is needed directly.

#### SSR Safety
CodeMirror uses browser-only APIs. Always wrap in `dynamic(..., { ssr: false })`.
The `async` function within `dynamic()` only runs in the browser, so `document` is safe to use.

#### Controlled mode & cursor stability
`@uiw/react-codemirror` in controlled mode (`value` prop): internally diffs the new value against the current editor state and only dispatches if they differ. Cursor position is preserved during normal typing. It only resets on external value changes (e.g., after formatting).
