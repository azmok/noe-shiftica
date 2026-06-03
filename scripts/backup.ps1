#Requires -Version 5.1
<#
  noe-shiftica-v2 backup script
  Usage:
    pwsh scripts/backup.ps1 -Setup           # 初回: アーカイブ用パスワードを暗号保存
    pwsh scripts/backup.ps1 -Trigger commit  # post-commit hook から非同期で呼ばれる
    pwsh scripts/backup.ps1 -Force           # 間引き条件を無視して即バックアップ
#>
[CmdletBinding()]
param(
  [ValidateSet('commit','manual')] [string]$Trigger = 'manual',
  [switch]$Force,
  [switch]$Setup
)
$ErrorActionPreference = 'Stop'

# --- PSModulePath 修復 ---
# git の post-commit hook は sh 経由で powershell.exe(5.1) を起動するが、親プロセス(PS7)の
# PSModulePath を継承し、5.1 が PS7 用 Microsoft.PowerShell.Security を掴んで
# 「module could not be loaded」で ConvertTo-SecureString が失敗する。
# 実行中の PowerShell 自身の $PSHOME\Modules を最優先に置き、自エディションのコアモジュールを確実にロードさせる。
$env:PSModulePath = (Join-Path $PSHOME 'Modules') + [IO.Path]::PathSeparator + $env:PSModulePath

# --- パス解決（このスクリプトの1つ上をプロジェクトルートとみなす） ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir
Set-Location $Root

$ConfigPath = Join-Path $Root '.antigravity\backup-config.json'
if (-not (Test-Path $ConfigPath)) { throw "config not found: $ConfigPath" }
$cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$PwFile   = Join-Path $Root $cfg.passwordFile
$LogFile  = Join-Path $Root $cfg.logFile
$IncFile  = Join-Path $Root $cfg.includeFile

function Write-Log([string]$msg, [string]$level='INFO') {
  $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $level, $msg
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Host $line
}

function Save-Config { $cfg | ConvertTo-Json -Depth 5 | Set-Content $ConfigPath -Encoding UTF8 }

function Resolve-SevenZip {
  $c = Get-Command 7z -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  $p = "C:\Program Files\7-Zip\7z.exe"
  if (Test-Path $p) { return $p }
  throw "7-Zip not found. Run: winget install 7zip.7zip"
}

function Notify([string]$title, [string]$msg, [bool]$ok=$true) {
  try {
    if (Get-Module -ListAvailable -Name BurntToast) {
      Import-Module BurntToast -ErrorAction Stop
      New-BurntToastNotification -Text $title, $msg | Out-Null
      return
    }
  } catch {}
  if (-not $ok) { [console]::beep(800,300); [console]::beep(600,300) }
}

# ===== Setup モード: パスワードをDPAPIで暗号保存 =====
if ($Setup) {
  $sec = Read-Host -AsSecureString "バックアップアーカイブのパスワードを入力（忘れたら復元不可。パスワードマネージャに保管せよ）"
  $sec | ConvertFrom-SecureString | Set-Content -Path $PwFile -Encoding UTF8
  Write-Log "password stored (DPAPI) at $($cfg.passwordFile)"
  Write-Host "`n✅ パスワードを暗号保存したで。これでhookから非対話バックアップが走る。" -ForegroundColor Green
  return
}

# ===== 二重起動防止 =====
$mutex = New-Object System.Threading.Mutex($false, 'noe_shiftica_backup_mutex')
if (-not $mutex.WaitOne(0)) { Write-Log "another backup is running; skip" 'WARN'; return }

try {
  # ===== 間引き判定（commit契機のみ） =====
  if ($Trigger -eq 'commit' -and -not $Force) {
    $cfg.commitsSinceLastBackup = [int]$cfg.commitsSinceLastBackup + 1
    $hoursPassed = if ($cfg.lastBackupUtc) {
      ([datetime]::UtcNow - [datetime]::Parse($cfg.lastBackupUtc)).TotalHours
    } else { [double]::MaxValue }
    $byTime   = $hoursPassed -ge [double]$cfg.thresholdHours
    $byCommit = [int]$cfg.commitsSinceLastBackup -ge [int]$cfg.thresholdCommits
    if (-not ($byTime -or $byCommit)) {
      Save-Config
      Write-Log ("skip (commits={0}/{1}, hours={2:N1}/{3})" -f $cfg.commitsSinceLastBackup, $cfg.thresholdCommits, $hoursPassed, $cfg.thresholdHours)
      return
    }
  }

  if (-not (Test-Path $PwFile)) { throw "password not set. Run: pwsh scripts/backup.ps1 -Setup" }
  $sevenZip = Resolve-SevenZip
  $sec = Get-Content $PwFile | ConvertTo-SecureString
  $pw  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
           [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

  # ===== 対象ファイル収集（.backupinclude をパース） =====
  $includes = @(); $excludes = @(); $mode = ''
  foreach ($raw in (Get-Content $IncFile)) {
    $l = $raw.Trim()
    if ($l -eq '' -or $l.StartsWith('#')) {
      if ($l -match 'INCLUDE') { $mode='inc' } elseif ($l -match 'EXCLUDE') { $mode='exc' }
      continue
    }
    if ($mode -eq 'inc') { $includes += $l } elseif ($mode -eq 'exc') { $excludes += $l }
  }

  function Test-Match([string]$rel, [string[]]$patterns) {
    $r = $rel -replace '\\','/'
    foreach ($p in $patterns) {
      $pat = $p -replace '\\','/'
      if ($pat.EndsWith('/')) { if ($r -like ($pat + '*')) { return $true } }
      elseif ($pat -like '*`**') { if ($r -like ($pat -replace '\*\*','*')) { return $true } }
      else { if ($r -like $pat -or $r -eq $pat) { return $true } }
    }
    return $false
  }

  $all = Get-ChildItem -Path $Root -Recurse -File -Force |
         Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' }
  $targets = foreach ($f in $all) {
    $rel = $f.FullName.Substring($Root.Length).TrimStart('\','/')
    if ((Test-Match $rel $includes) -and -not (Test-Match $rel $excludes)) { $f }
  }
  if (-not $targets) { throw "no files matched .backupinclude (check patterns)" }

  # ===== ステージング =====
  $stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
  $staging = Join-Path $Root "backup-staging\$stamp"
  New-Item -ItemType Directory -Force -Path $staging | Out-Null

  $manifest = @()
  foreach ($f in $targets) {
    $rel  = $f.FullName.Substring($Root.Length).TrimStart('\','/')
    $dest = Join-Path $staging $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item $f.FullName $dest -Force
    $hash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $manifest += [pscustomobject]@{ path=$rel; sha256=$hash; bytes=$f.Length }
  }

  # リポジトリ全体を bundle 化（全履歴・全ブランチ）
  $gitHead = (git rev-parse --short HEAD) 2>$null
  git bundle create (Join-Path $staging 'repo.bundle') --all 2>$null
  $manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $staging 'MANIFEST.json') -Encoding UTF8

  # ===== 7z 暗号化アーカイブ =====
  $genDir  = Join-Path $cfg.destination "noe-shiftica-v2_$stamp"
  New-Item -ItemType Directory -Force -Path $genDir | Out-Null
  $archive = Join-Path $genDir 'backup.7z'
  & $sevenZip a -t7z -mx=5 -mhe=on "-p$pw" $archive "$staging\*" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "7z archive failed (exit $LASTEXITCODE)" }

  # ===== 検証 =====
  & $sevenZip t "-p$pw" $archive | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "7z verify FAILED (exit $LASTEXITCODE)" }

  # 平文の小さなinfoだけ世代フォルダに残す（中身確認用・シークレットは含めない）
  @{ timestamp=$stamp; gitHead=$gitHead; fileCount=$targets.Count;
     archiveBytes=(Get-Item $archive).Length } |
    ConvertTo-Json | Set-Content (Join-Path $genDir 'info.json') -Encoding UTF8

  # ===== 世代ローテーション =====
  $gens = Get-ChildItem $cfg.destination -Directory -Filter 'noe-shiftica-v2_*' |
          Sort-Object Name -Descending
  if ($gens.Count -gt [int]$cfg.keepGenerations) {
    $gens | Select-Object -Skip ([int]$cfg.keepGenerations) | ForEach-Object {
      Remove-Item $_.FullName -Recurse -Force; Write-Log "rotated out: $($_.Name)"
    }
  }

  # ===== 後始末・状態更新 =====
  Remove-Item $staging -Recurse -Force
  $cfg.lastBackupUtc = [datetime]::UtcNow.ToString('o')
  $cfg.commitsSinceLastBackup = 0
  Save-Config
  Write-Log ("OK: {0} files, head={1}, -> {2}" -f $targets.Count, $gitHead, (Split-Path $genDir -Leaf))
  Notify "Backup OK" "noe-shiftica-v2 / $($targets.Count) files" $true
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)" 'ERROR'
  Notify "Backup FAILED" $_.Exception.Message $false
  throw
}
finally {
  $mutex.ReleaseMutex(); $mutex.Dispose()
  if ($pw) { $pw = $null }
}
