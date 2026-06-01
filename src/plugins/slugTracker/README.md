# Slug Tracker Plugin

An automation utility plugin for Payload CMS that monitors document URL changes and logs historical URL slugs inside a readonly array. This history is invaluable for managing 301 redirects and preserving SEO rankings when post handles are updated.

## Key Features
- **URL Change Detection Hook**: Installs a `beforeChange` collection hook. It compares the newly submitted slug (`data.slug`) against the original document slug (`originalDoc.slug`).
- **Automatic History Logging**: If a change is detected, the plugin prepends/appends the old slug into the historical list, ensuring deduplication.
- **Sidebar Fields Injection**: Automatically injects a `slugHistory` array field placed inside the CMS document sidebar.
- **Strict Read-Only Access**: Prevents accidental user edits to history logs by locking the sidebar fields to `readOnly: true` in the admin schema.
