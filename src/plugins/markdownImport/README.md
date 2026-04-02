# Markdown Import Plugin for PayloadCMS (v3)

A professional-grade plugin for Noe Shiftica that enables seamless Markdown file imports into the PayloadCMS `posts` collection. It handles frontmatter parsing, automatic CJK-to-English slug translation, and Lexical rich text conversion.

## Features

- **🚀 One-Click Import**: Upload `.md` files directly from the Payload sidebar.
- **📄 Frontmatter Support**: Automatically maps standard fields (`title`, `description`, `date`) to the document.
- **🌐 Smart Translation**: Detects Japanese/CJK titles and automatically translates them to English slugs using Google Translate API (via `translateToSlug` utility).
- **📝 Lexical Conversion**: Transforms Markdown body into Payload's native Lexical (JSON) format, preserving structure and formatting.
- **🏷️ Custom Metadata**: Collects non-standard frontmatter keys into a `customMetaData` field for flexibility.
- **🛡️ Validation Helper**: Includes a `beforeValidate` hook to ensure posts with only HTML embeds (and no text content) can still be published by injecting a placeholder.

## How it Works

### 1. UI Component (`MarkdownImporterUI.tsx`)
Injected into the sidebar of the `posts` collection. It provides a file input and handles the client-side logic for clearing existing fields and dispatching new values after processing.

### 2. Endpoints (`index.ts`)
The plugin registers two custom API endpoints:
- `POST /api/convert-markdown`: Receives raw Markdown text, parses frontmatter using `gray-matter`, and converts the body using `@payloadcms/richtext-lexical`.
- `GET /api/translate-slug?title=...`: Converts a title into a URL-safe English slug.

### 3. Hooks
- **`beforeValidate`**: Sits on the `posts` collection. If a post is being saved with an `htmlEmbed` but no rich text `content`, it injects a non-breaking space (`\u00A0`) into the Lexical state to satisfy requirement constraints without affecting the frontend layout.

## Installation & Configuration

The plugin is integrated into `src/payload.config.ts`.

```typescript
import { markdownImportPlugin } from './plugins/markdownImport'

export default buildConfig({
  // ...
  plugins: [
    markdownImportPlugin(),
    // ...
  ],
})
```

## Dependencies

- `gray-matter`: For parsing YAML frontmatter within Markdown files.
- `@payloadcms/richtext-lexical`: For server-side Markdown-to-Lexical conversion.
- `translateToSlug`: Custom utility for English slug generation.

---

> [!TIP]
> **Best Practice**: Ensure your Markdown files follow a standard frontmatter structure (Title, Date, Description) to get the most out of the automatic mapping.
