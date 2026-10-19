// True when a raw-HTML block holds an X (Twitter) embed, so widgets.js is only
// loaded on articles that actually need it.
type EmbedScanNode = {
    type?: string
    fields?: { blockType?: string; renderAsHtml?: boolean; code?: unknown }
    children?: EmbedScanNode[]
}

export const hasTwitterEmbed = (content: unknown): boolean => {
    const walk = (node: EmbedScanNode | undefined): boolean => {
        if (!node) return false
        if (
            node.type === 'block' &&
            node.fields?.blockType === 'code-block' &&
            node.fields?.renderAsHtml &&
            typeof node.fields.code === 'string' &&
            /class=["'][^"']*\btwitter-tweet\b/.test(node.fields.code)
        ) {
            return true
        }
        return Array.isArray(node.children) && node.children.some(walk)
    }
    return walk((content as { root?: EmbedScanNode } | null)?.root)
}
