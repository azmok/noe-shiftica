# Shared Utilities Directory

This directory hosts shared helper utilities, event constants, and data-access layers consumed across multiple active Payload CMS plugins in the codebase.

## Key Modules
- **`draftStorage.ts`**:
  - Implements client-side JSON serialization to cache temporary post draft structures inside the browser's `localStorage` (`payload-draft-post-new`).
  - Defines the global custom event identifier `DRAFT_SAVE_EVENT` (`noe:draft-save`), which orchestrates synchronization triggers between standalone feature plugins (such as Markdown Import) and the background Autosave plugin.
  - Exposes robust functions to load, save, and clean up temporary browser draft values.
