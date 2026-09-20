import type { Block } from 'payload'

export const CustomCodeBlock: Block = {
  slug: 'code-block',
  labels: {
    singular: 'Monaco Code Block',
    plural: 'Monaco Code Blocks',
  },
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'javascript',
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'Python', value: 'python' },
        { label: 'Bash', value: 'bash' },
        { label: 'JSON', value: 'json' },
        { label: 'SQL', value: 'sql' },
        { label: 'Plain Text', value: 'plaintext' },
      ],
    },
    {
      name: 'code',
      type: 'textarea',
      required: true,
    },
    {
      // Set by the Markdown importer's raw-HTML extraction (see
      // extractRawHtmlBlocks in src/plugins/markdownImport/index.ts) for
      // HTML chunks lifted verbatim out of a post's source Markdown (SVG
      // symbol defs, hand-built interactive UI markup, ...). When true the
      // block is rendered live via dangerouslySetInnerHTML instead of shown
      // as a syntax-highlighted code sample. Hidden because it's never
      // meant to be hand-toggled from the editor.
      name: 'renderAsHtml',
      type: 'checkbox',
      defaultValue: false,
      admin: { hidden: true },
    },
  ],
}
