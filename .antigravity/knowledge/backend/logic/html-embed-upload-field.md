# HTML Embed Upload Field in Posts Collection

## Implementation Pattern

Add an `upload` field referencing the `media` collection to Posts, then render it as an iframe on the frontend.

### Implementation

**Step 1**: Add field to `src/collections/Posts.ts` (at end of `fields` array):
```ts
{
  name: 'htmlEmbed',
  type: 'upload',
  relationTo: 'media',
  label: '埋め込みHTMLファイル',
  required: false,
}
```

**Step 2**: Create `src/components/HtmlEmbedBlock.tsx` as a `'use client'` component rendering an `<iframe>`.

**Step 3**: In the blog post page, access `post.htmlEmbed` with depth ≥ 1 (already set). Cast to `any` because PayloadCMS generated types use union types for upload fields that don't include `.url` directly.

### Files Used
- `src/collections/Posts.ts`
- `src/components/HtmlEmbedBlock.tsx`
- `src/app/(frontend)/blog/[slug]/page.tsx`

### Processing Flow
1. Admin uploads HTML file via Payload Media upload
2. Field stored as relationship to `media` collection (resolved with `depth: 1`)
3. Frontend accesses `(post.htmlEmbed as any)?.url` to get the file URL
4. `HtmlEmbedBlock` renders an iframe with the URL

### Pitfalls
- PayloadCMS v3 typed upload fields as `string | Media`, so `.url` is not directly accessible without casting to `any` or using a type guard.
- The `depth: 1` in `payload.find()` is required to resolve the relationship and get the `url` property — without it, `htmlEmbed` will just be a string ID.
- `HtmlEmbedBlock` must be `'use client'` only if it uses client-side hooks. Since it's a pure presentational component with no hooks, the directive is kept for future extensibility but not strictly required.
