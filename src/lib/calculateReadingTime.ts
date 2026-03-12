/**
 * Simple utility to calculate reading time based on character count.
 * Average reading speed for Japanese is roughly 600 characters per minute.
 */
export function calculateReadingTime(content: any): number {
    if (!content) return 0;

    let textContent = '';

    // Lexical RichText is usually a JSON object with a root node
    const traverse = (node: any) => {
        if (!node) return;

        if (node.text) {
            textContent += node.text;
        }

        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(traverse);
        }
    };

    if (typeof content === 'object' && content.root) {
        traverse(content.root);
    } else if (typeof content === 'string') {
        // Fallback for cases where content might be raw HTML or string (less likely in Payload 3 with Lexical)
        textContent = content.replace(/<[^>]*>?/gm, '');
    }

    const charCount = textContent.length;
    if (charCount === 0) return 0;

    const wordsPerMinute = 600;
    const minutes = Math.ceil(charCount / wordsPerMinute);

    return minutes;
}
