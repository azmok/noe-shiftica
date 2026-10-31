# Video Embed Plugin

記事本文に入れた動画（Media の動画ファイル）を、リンクではなくその場で再生できる `<video>` として表示するフロント側のプラグイン。

## 仕組み
- `converter.tsx` の `withVideoEmbed()` が Lexical の upload 用 JSX converter を包む。`mimeType` が `video/*` の展開済みノードだけ `<video controls playsInline preload="metadata">` で描画し、それ以外は元の converter に任せる。
- `preload="metadata"`: 再生を押すまで動画本体を読まないので、記事の表示速度に影響しない。`#t=0.001` で iOS でも先頭フレームが出る。
- 配信は Firebase Storage の直リンク。HTTP Range に対応しているので、シークや途中再生はストリーミングで動く。

## 使い方
Payload の設定には登録しない（フロントの表示だけの機能）。記事ページの converters に組み込む：

```tsx
upload: withVideoEmbed(withOriginalImageLink(defaultConverters.upload)),
```

使っている場所: `src/app/(frontend)/blog/[slug]/PostArticle.tsx`（General / Dev 共通）。

## 動画を軽く速く配信するための運用
- **H.264 (MP4) + AAC、moov atom を先頭に置く（faststart）**: `ffmpeg -i in.mp4 -c:v libx264 -crf 23 -preset slow -c:a aac -movflags +faststart out.mp4`。これで再生がダウンロード完了を待たずに始まる。
- 幅 1280px 前後、数十 MB 以下を目安にする。
