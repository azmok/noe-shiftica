# 🔄 noe-shiftica-v2 復元手順

ローカルが壊れた／新しいマシンに移行する場合の手順。

## 0. 前提ツール
- Git, Node.js(fnm), pnpm, PowerShell 5.1+, 7-Zip(`winget install 7zip.7zip`)

## 1. リポジトリを取得
GitHubが生きている場合:
```
git clone <GitHubのURL> noe-shiftica-v2 && cd noe-shiftica-v2
```
GitHubが消えている場合（バックアップ内 repo.bundle から復元）:
```
（手順2でアーカイブを解凍後）git clone repo.bundle noe-shiftica-v2
```

## 2. バックアップアーカイブを解凍
Google Drive の最新世代フォルダ
`...\.BU\noe-shiftica-v2\noe-shiftica-v2_<最新>\backup.7z` を解凍:
```
7z x backup.7z -o<展開先>
```
→ パスワードを聞かれるのでパスワードマネージャの値を入力。
→ 展開先の中身（.env*, *.json, .antigravity/ など）をプロジェクトルートに上書きコピー。

## 3. 依存インストール
```
pnpm install
```

## 4. hook を入れ直す（重要・忘れがち）
```
pwsh scripts/install-hooks.ps1
```

## 5. バックアップ用パスワードを再設定
```
pwsh scripts/backup.ps1 -Setup
```
※ DPAPIはマシン/アカウント紐付けのため、新マシンでは再設定が必要。

## 6. 動作確認
```
git commit --allow-empty -m "restore check"
```
→ 数十秒後 .antigravity/backup.log に OK 行が出れば復旧完了。
