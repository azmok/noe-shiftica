# Original Image Link Plugin

記事本文の画像をクリックすると、その画像の原寸（Firebase Storage にあるオリジナルファイル）を新しいタブで開くフロント側のプラグイン。

## 仕組み
- `converter.tsx` の `withOriginalImageLink()` が、Lexical の upload ノード用 JSX converter を包む。表示は元の converter（`<picture>` とサイズ違いの `<source>`）のまま、外側を `<a href="<Media の url>" target="_blank" rel="noopener noreferrer">` で囲む。
- Media の `url` は `afterRead` フックで Firebase Storage の直リンク（オリジナルファイル）になっているので、それをリンク先にする。
- 画像以外のアップロード（PDF など）や、ID のまま展開されていない値は何もしない。
- 本文のリンク装飾（下線・「新しいタブ」アイコン）は `OriginalImageLink.module.css` で打ち消す。

## 使い方
Payload の設定には登録しない（フロントの表示だけの機能）。記事ページの converters に組み込む：

```tsx
upload: withOriginalImageLink(defaultConverters.upload),
```

現在は `src/app/(frontend)/blog/[slug]/PostArticle.tsx`（General / Dev 共通）で使っている。
