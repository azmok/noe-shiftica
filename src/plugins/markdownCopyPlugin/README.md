# Markdown Copy Plugin

This is a custom Lexical editor extension for Payload CMS that intercepts the standard browser copy command (`Ctrl+C` / `Cmd+C`) inside the rich text editor and automatically writes the selected text to the clipboard formatted as **clean Markdown**.

## Key Features
- **Auto-Conversion to Markdown**: When copying text in the visual editor, it dynamically converts the rich text elements (bold, italic, strikethrough, inline code, code blocks, links, headers, lists, blockquotes, and horizontal rules) into standard Markdown.
- **Copy Interception**: Hooks into Lexical's native `COPY_COMMAND` at high priority.
- **Clipboard Optimization**: Populates `text/plain` on the clipboard with parsed Markdown, making it incredibly easy to paste formatted content directly into GitHub, Markdown files, or external chat systems.
- **Rich Text Feature Bundle**: Re-configures target collections (default: `posts` and `tech-posts`) by loading custom Lexical features including:
  - `MarkdownCopyFeature`
  - `MarkdownPasteFeature`
  - `HtmlSourceViewerFeature`
  - `TextStyleFeature`
  - `FixedToolbarFeature`, `EXPERIMENTAL_TableFeature`, `HorizontalRuleFeature`, and custom code blocks.
