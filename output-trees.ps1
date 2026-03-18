function Show-Tree {
    param(
        [string]$Path = ".",
        [string[]]$Exclude = @('node_modules', '.git', '.next', 'dist', 'build', '.antigravity'),
        [string]$Prefix = "",
        [int]$MaxDepth = 4,
        [int]$CurrentDepth = 0
    )
    if ($CurrentDepth -ge $MaxDepth) { return }

    $items = Get-ChildItem -Path $Path -Force |
        Where-Object { $Exclude -notcontains $_.Name } |
        Sort-Object { $_.PSIsContainer } -Descending

    for ($i = 0; $i -lt $items.Count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq $items.Count - 1)
        $connector = if ($isLast) { "└── " } else { "├── " }
        $childPrefix = if ($isLast) { "    " } else { "│   " }

        Write-Output "$Prefix$connector$($item.Name)"

        if ($item.PSIsContainer) {
            Show-Tree -Path $item.FullName -Exclude $Exclude -Prefix "$Prefix$childPrefix" -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1)
        }
    }
}

Write-Output (Split-Path -Leaf (Get-Location))
Show-Tree | Tee-Object -FilePath "tree_structure.txt" -Encoding utf8
