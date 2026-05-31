#Requires -Version 5.1
# .git/hooks/ に post-commit を配置する。クローン後はこれを一度実行すること。
$ErrorActionPreference = 'Stop'
$Root = git rev-parse --show-toplevel
$src  = Join-Path $Root 'scripts\hooks\post-commit'
$dst  = Join-Path $Root '.git\hooks\post-commit'
Copy-Item $src $dst -Force
# Git Bash が実行できるよう改行コードをLFに正規化
(Get-Content $src -Raw) -replace "`r`n","`n" | Set-Content $dst -NoNewline -Encoding ascii
Write-Host "✅ post-commit hook installed -> .git/hooks/post-commit" -ForegroundColor Green
