# Media Alt Text Optional Field & Filename Fallback

### Implementation Pattern
Made the `alt` text field in the `media` collection optional in the Payload schema and UI, and implemented a backend-level fallback to automatically set the `alt` text to the uploaded file's original name when the field is left blank.

### Files Involved
- `src/collections/Media.ts`
- `src/components/AltField.tsx`

### Process Flow
1. **Schema Update**: Removed the `required: true` constraint from the `alt` field in the `Media` collection config to allow empty submissions.
2. **UI Adjustments**: Removed the visual required indicator (`<span className="required">*</span>`) from the custom `AltField` component to cleanly indicate it is now optional to the user.
3. **Backend Fallback Hook**: Implemented a `beforeChange` hook inside `Media.ts` that checks if `data.alt` is undefined, null, or empty. If it is empty, it automatically assigns `data.filename` (which contains the original file name, e.g., `photo.png`) to `data.alt` before writing to the database.

### Gotchas / Notes
- The custom `AltField` client component already has a `useEffect` hook that pre-fills the alt field with the file name (minus the extension) in the UI when the user selects a file.
- The backend hook fallback sets the `filename` *with extension* (e.g., `image.jpg`) to guarantee that any API upload or cases where the UI value is cleared out before saving will still have a complete file name reference as the fallback `alt` text.
