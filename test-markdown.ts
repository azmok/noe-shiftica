import { convertMarkdownToLexical, sanitizeServerEditorConfig, defaultEditorConfig } from '@payloadcms/richtext-lexical'

async function run() {
    const markdown = "# Hello World\n\nThis is a test.";

    // In payload 3.x, defaultEditorConfig has its own features.
    // We'll mock the config just enough to run the converter
    const mockConfig = {
        editor: {
            features: []
        }
    };

    const sanitized = await sanitizeServerEditorConfig(defaultEditorConfig, {} as any);
    const result = convertMarkdownToLexical({
        editorConfig: sanitized,
        markdown: markdown
    });
    console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
