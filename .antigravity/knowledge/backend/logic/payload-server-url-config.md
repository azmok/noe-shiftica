# Payload `serverURL` Configuration

## 実装パターン

`payload.config.ts` の `serverURL` は以下の優先順位で解決する:

```ts
serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL
  || process.env.NEXT_PUBLIC_SERVER_URL
  || (process.env.NODE_ENV === 'production' ? 'https://noe-shiftica.com' : 'http://localhost:3000'),
```

### 使用ファイル
- `src/payload.config.ts`
- `.env.local` (`NEXT_PUBLIC_SERVER_URL=http://localhost:3000`)
- `apphosting.yaml` (`NEXT_PUBLIC_SERVER_URL` — 本番ドメインを設定)

### 処理フロー

1. `PAYLOAD_PUBLIC_SERVER_URL` が設定されていれば最優先で使用
2. 次に `NEXT_PUBLIC_SERVER_URL` を参照（`.env.local` および `apphosting.yaml` に定義済み）
3. どちらも未設定の場合は `NODE_ENV` で判定

### ハマりポイント

**`pnpm start` で admin の relationship/upload フィールドが全て 401 になる**

- `pnpm dev` → `NODE_ENV=development` → フォールバックで `localhost:3000` → 問題なし
- `pnpm start` → `NODE_ENV=production` → フォールバックで `https://noe-shiftica.com` → **auth cookie がドメイン違いで送られず 401**

Payload admin の client-side コンポーネントは `serverURL` を使って API エンドポイント URL を構築する。`serverURL` がブラウザのオリジンと異なるドメインになると、ブラウザは `payload-token` cookie を送信しないため、relationship・upload 系フィールドの option 取得・form state 構築が全滅する。

**本番（Firebase App Hosting）では顕在化しない理由**: `apphosting.yaml` に `NEXT_PUBLIC_SERVER_URL` が設定されており、`serverURL` が正しく `https://noe-shiftica.com` に解決されるため。ローカルの `pnpm start` 特有の罠。

**確認チェックリスト**:
- `.env.local` に `NEXT_PUBLIC_SERVER_URL=http://localhost:3000` があるか
- `payload.config.ts` の `serverURL` が `NEXT_PUBLIC_SERVER_URL` を参照しているか
- `apphosting.yaml` に `NEXT_PUBLIC_SERVER_URL` が定義されているか
