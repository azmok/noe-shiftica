# Autosave Plugin

A background utility for Payload CMS that automatically saves drafts to `localStorage` as the user types, preventing data loss before a post is officially created.

## Key Features
- **Typing-Triggered Autosave**: Automatically captures and saves form data to `localStorage` 1 second after typing stops (only for unsaved documents without an `id`).
- **Automatic Restoration**: Detects empty forms on creation pages and restores the previously autosaved draft.
- **Auto-Cleanup**: Automatically clears the draft from `localStorage` once the document is officially saved or published (receiving an `id`).
- **Event-Driven Saving**: Listens to explicit custom events (`noe:draft-save`) from other plugins to force a draft update.
- **Headless Execution**: Operates entirely in the background (renders `null` in the UI).
