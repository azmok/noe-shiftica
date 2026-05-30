# Media Field Size Filtering & Click Event Fix in Payload CMS v3

### Implementation Pattern
When configuring custom thumbnail cells for uploaded assets in Payload CMS v3, standard pointer events on custom cell components can block parent row select actions inside picker drawers. Setting `pointer-events: none` on the custom cell container resolves this event capturing issue seamlessly.
Additionally, when a relationship or upload field (e.g., `heroImage`) requires specific asset dimensions, the `filterOptions` property can be configured to filter out unrelated smaller/larger images from the asset picker drawer.

### Used Files
- `src/components/AdminThumbnailCell.tsx`
- `src/collections/fields/sharedBlogFields.ts`
- `src/collections/Posts.ts`

### Process Flow
1. **Click Pass-through**: In `AdminThumbnailCell.tsx`, apply `pointerEvents: 'none'` to the root element. Mouse clicks on the custom cell are now completely transparent to the browser, bubbling down directly into Payload's native row-selection button element.
2. **Dimension Filtering**: Add `filterOptions: { width: { greater_than_equal: 1000 } }` to the `heroImage` upload field definition. Payload's picker drawer now uses REST/GraphQL queries to automatically restrict displayed assets to those with a width of 1000px or greater, hiding smaller thumbnails or avatar assets dynamically.

### Pitfalls / Things to Avoid
- **Event capturing on Custom Cells**: In Payload CMS v3, custom table cells in pickers/drawers will steal click focus if they react to mouse events. Always make them non-interactive with `pointer-events: none` unless the cell itself requires a dedicated hover/action button.
- **Client/Server Filter parity**: When using shared fields (e.g. `sharedBlogFields.ts`) and separate collection configurations (e.g. `Posts.ts`), make sure to apply the `filterOptions` on all field definitions to avoid schema mismatch and inconsistency.
