# Video Upload Plugin

動画を、アプリサーバーを通さずブラウザから GCS（Firebase Storage）へ直接アップロードするためのプラグイン。

## 登録するもの
- **`videos` コレクション**（`collection.ts`）: 動画専用。形式は MP4 / WebM / MOV、上限 500 MB。
- **`gcsStorage({ clientUploads: true })`**（`index.ts`）: `videos` だけを署名付き URL での直接アップロードにする。

## なぜ Media と分けるか
`clientUploads` はファイルがサーバーを通らない。`media` の `imageSizes`（sharp での WebP / og 生成）が走らなくなり、Hero と OG 画像が壊れる。画像は今まで通り `media`、動画だけ `videos`。

## 仕組み
- サイズ・形式は、保存時にメタデータ（`filesize` / `mimeType`）で検証する（`validateVideo`）。ファイル本体はサーバーが見ない。
- `url` は Media と同じ Firebase Storage の直リンク。Range 対応なので、シークや途中再生はストリーミングで動く。
- 記事本文の再生は `videoEmbed` プラグイン（`mimeType` が `video/*` なら `<video>`）。エディターの画像挿入ダイアログで `videos` を選べる。

## 運用
- バケットの CORS に、管理画面のオリジンからの PUT が必要（`gcs-cors.json`）。
- 署名 URL の発行には、実行サービスアカウントに `iam.serviceAccounts.signBlob` の権限が必要。
- 動画は H.264 + AAC + faststart に変換してから上げる：`ffmpeg -i in.mp4 -c:v libx264 -crf 23 -preset slow -c:a aac -movflags +faststart out.mp4`
