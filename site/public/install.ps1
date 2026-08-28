$ErrorActionPreference = "Stop"
$manifestUrl = "https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest/download/latest.json"
$manifest = Invoke-RestMethod -Uri $manifestUrl
$asset = $manifest.assets | Where-Object { $_.platform -eq "windows" -and $_.kind -eq "msi" } | Select-Object -First 1
if (-not $asset) { throw "No Windows MSI is present in the latest release." }
$tempFile = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetFileName($asset.url))
Invoke-WebRequest -Uri $asset.url -OutFile $tempFile
$actual = (Get-FileHash -Algorithm SHA256 -Path $tempFile).Hash.ToLowerInvariant()
if ($actual -ne $asset.sha256.ToLowerInvariant()) { Remove-Item $tempFile -Force; throw "Checksum mismatch; nothing was installed." }
Write-Host "Checksum verified. Starting the Clipboard LAN Bridge installer..."
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$tempFile`""
Remove-Item $tempFile -Force
Write-Host "Clipboard LAN Bridge installed. This v1 package is unsigned, so Windows may show a publisher warning."
