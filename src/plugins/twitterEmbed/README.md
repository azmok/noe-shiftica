# Twitter Embed Plugin

記事本文の X（旧 Twitter）埋め込みをカード表示にするフロント側のプラグイン。Payload の設定には登録しない。

## 仕組み
- X の埋め込みは生 HTML のブロック（`code-block` の `renderAsHtml`）として本文に入る。`dangerouslySetInnerHTML` で入れた `<script>` は実行されないので、埋め込みに付いている `widgets.js` は取り込み時に除去されている（`ai-api` の `markdown.ts`）。
- `hasTwitterEmbed()`（`hasTwitterEmbed.ts`）が本文に `<blockquote class="twitter-tweet">` があるかを調べる。
- ある記事だけ `TwitterEmbedLoader`（`TwitterEmbedLoader.tsx`）が `widgets.js` を読み込み、`twttr.widgets.load()` でカードに変換する。クライアント側の画面遷移でも、次の記事のブロックを変換する。

## 使い方
```tsx
{hasTwitterEmbed(post.content) && <TwitterEmbedLoader />}
```
