# OG Image Auto-Fill Plugin

An automation plugin for Payload CMS that keeps your social sharing images (`ogImage`) synchronized with your article's main eye-catcher image (`heroImage`), with fallback support.

## Key Features
- **Publish-Triggered Fallback Hook**: Hooks into `beforeChange` on targeted collections. When a post is set to `published`, it checks for a `heroImage`. If none is selected, a fallback GCS hosting URL is safely injected as the default `ogImage`.
- **Client-Side Real-Time Updates**:
  - Replaces the default `ogImage` field UI with a custom read-only component (`OgImageField`).
  - Watches for changes to the `heroImage` field in real time. When changed, it asynchronously fetches the media asset via API and populates `ogImage` immediately with the OGP-optimized size (1200x630 `og` size) or the original image URL.
- **Visual Feedback**: Renders a styled, non-editable field explaining that the OG image URL is managed automatically based on the main hero image selection.
