# Panel Resizer Plugin

An administrative enhancement plugin for Payload CMS that injects high-performance, draggable resize handles into the live-preview multi-panel layouts (PC & Tablet viewports >= 1024px).

## Key Features
- **Draggable Live-Preview Splitter**: Injects a custom draggable handle between the content editor panel and the active frontend iframe live preview, allowing authors to dynamically resize layout proportions (updating the `--oje-editor-w` CSS property).
- **Smooth Pointer-Event Interaction**: Uses native `PointerEvents` and pointer capturing, ensuring robust drag-and-drop support across both standard mouse inputs and touchscreens (tablets, Apple Pencil).
- **Dynamic DOM Reconciliation**: Employs a `MutationObserver` to watch layout mutations and routing changes, automatically injecting/removing splitter handles as preview states are toggled.
- **IFrame Event Prevention**: Disables all iframe pointer events during active drags so that the preview browser container never swallows or breaks active drag actions.
- **Micro-Animations & Lime Glow**: Uses highly premium CSS animations, transforming the handle into an elevated lime-glowing pill on hover or active dragging.
- **Global Image Loader Diagnostic**: Incorporates global event listeners inside the provider to catch and debug failed or successful browser image resource loads within the administration space.
