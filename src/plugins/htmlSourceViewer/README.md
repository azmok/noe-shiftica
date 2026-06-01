# Lexical HTML Source Viewer Feature (PayloadCMS v3)

A custom Lexical editor plugin/feature that provides raw HTML source code editing directly inside PayloadCMS v3's Rich Text editor.

## Key Features

1. **Two-Way Source Mode Toggle**:
   - Easily switch between visual Rich Text and raw HTML source code modes.
   - Includes a custom toolbar button featuring a `</>` icon.
   - Supports the key shortcut `Ctrl + Shift + H` (via toolbar display context).

2. **Bidirectional HTML ↔ Lexical Node Conversion**:
   - **Rich to Source**: Serializes current Lexical nodes into HTML, then formats the output using `js-beautify` for highly readable, indented source viewing in a monospaced textarea.
   - **Source to Rich**: Parses raw HTML back into standard Lexical nodes when exiting source mode, instantly updating the underlying editor state.

3. **Error Banner Feedback**:
   - If invalid HTML is typed and DOMParser fails to build a safe structure, the UI captures the parse error and displays a clear red error banner at the bottom of the editing textarea to guide the editor.

4. **Robust Custom Parsing & Fixes (Horizontal Rules Workaround)**:
   - Includes specialized pre/post-processing for Horizontal Rule (`<hr>`) tags. Due to class loading conflicts in Lexical's browser bundler, raw `<hr>` parses can fail with type mismatches.
   - The plugin bypasses this by temporarily swapping `<hr>` for a secure paragraph placeholder (`__OJE_HR_PLACEHOLDER__`) during DOM parsing, then programmatically converting the placeholder nodes back to authentic Payload Horizontal Rule nodes (`horizontalrule`) after insertion.

---

## File Structure

The feature consists of the following modular files:

* **[HtmlSourceViewer.tsx](file:///C:/Users/genta/projects/noe-shiftica-v2/src/plugins/htmlSourceViewer/HtmlSourceViewer.tsx)**:
  Contains the React visual components—the monospaced overlay `<textarea>` text editor with elevation theme styles, the parser error banner component, and the custom `</>` toolbar button component.

* **[conversion.ts](file:///C:/Users/genta/projects/noe-shiftica-v2/src/plugins/htmlSourceViewer/conversion.ts)**:
  Handles serialization/deserialization logic using Payload's Lexical HTML helpers (`$generateHtmlFromNodes` and `$generateNodesFromDOM`). Implements the custom `<hr>` placeholder-replacement hack to avoid Lexical bundler type mismatch crashes.

* **[feature.client.tsx](file:///C:/Users/genta/projects/noe-shiftica-v2/src/plugins/htmlSourceViewer/feature.client.tsx)**:
  Defines the PayloadCMS v3 client-side feature configuration (`HtmlSourceViewerFeatureClient`). Orchestrates events (`htmlsourceviewer:enter`, `htmlsourceviewer:exit`, and `htmlsourceviewer:sync`) to synchronize the toggle state between the editor overlay and the toolbar buttons.

* **[feature.server.ts](file:///C:/Users/genta/projects/noe-shiftica-v2/src/plugins/htmlSourceViewer/feature.server.ts)**:
  Provides the server-side Feature definition required by PayloadCMS v3 to register the plugin into the rich text editor's schema (`HtmlSourceViewerFeature`).
