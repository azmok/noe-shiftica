# HTML File Manager Plugin

This plugin adds dedicated HTML file uploading, styling extraction, and management capabilities to Payload CMS. It allows authors to import external HTML documents (such as exported rich articles) directly into posts with isolated styling and real-time preview.

## Key Features
- **HTML Document Upload**: Adds an `html-files` collection to handle `.html` uploads.
- **Auto-Extraction of Body & CSS**:
  - Extracts the raw HTML `<body>` content and maps it to `bodyHtml`.
  - Extracts CSS stylesheets and `<style>` blocks into `embedCss`.
  - Automatically rewrites `body` CSS selectors to `#uploaded-content` to isolate CSS scoping and prevent admin panel styling conflicts.
- **TOC Anchor Synchronization**: Automatically syncs table of contents links with header element IDs (`synchronizeTOC`) to keep internal anchor links functioning.
- **Post Association Field**: Displays the linked article title through a virtual field `linkedPostTitle`.
- **Live Preview View**: Enables immediate visual inspection of uploaded HTML files in a customized preview route (`/admin/html-files-preview`).
- **Mobile Fullscreen Editor**: Equipped with a custom editor component (`MobileFullscreenEditor`) optimized for small viewports.
