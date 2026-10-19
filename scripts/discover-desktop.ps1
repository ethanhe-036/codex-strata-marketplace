param([int]$CallerProcessId = 0)
$ErrorActionPreference = "Stop"
$processes = @(Get-CimInstance Win32_Process)
$ancestors = @()
$cursor = $CallerProcessId
for ($step = 0; $cursor -and $step -lt 30; $step++) {
  $entry = $processes | Where-Object { $_.ProcessId -eq $cursor } | Select-Object -First 1
  if (-not $entry) { break }
  $ancestors += [int]$entry.ProcessId
  $cursor = [int]$entry.ParentProcessId
}
$package = Get-AppxPackage OpenAI.Codex | Select-Object -First 1
$packageParent = if ($package) { Split-Path $package.InstallLocation -Parent } else { $null }
$packagePattern = if ($package) { '^' + [regex]::Escape($package.Name) + '_(\d+\.\d+\.\d+\.\d+)_(?:x64|arm64)__' + [regex]::Escape($package.PublisherId) + '$' } else { $null }
$roots = @()
foreach ($entry in $processes) {
  if ($entry.Name -ne "ChatGPT.exe" -or $entry.CommandLine -match "--type=" -or -not $entry.ExecutablePath) { continue }
  if (-not $package) { continue }
  $runningPackage = Split-Path (Split-Path $entry.ExecutablePath -Parent) -Parent
  $identity = [regex]::Match((Split-Path $runningPackage -Leaf), $packagePattern)
  # A Store update can be installed while the prior signed package is still running.
  # Identify that process's protected package path, not the newest installed version.
  if (-not $identity.Success -or (Split-Path $runningPackage -Parent) -ne $packageParent -or $entry.ExecutablePath -ne (Join-Path $runningPackage 'app/ChatGPT.exe')) { continue }
  $profileMatch = [regex]::Match($entry.CommandLine, '--user-data-dir(?:=|\s+)(?:"([^"]+)"|([^ "]+))')
  $profile = if ($profileMatch.Groups[1].Success) { $profileMatch.Groups[1].Value } else { $profileMatch.Groups[2].Value }
  $profileSource = "root-command-line"
  if (-not $profile) {
    # Packaged Codex can use a nested browser profile. Relaunch the observed path,
    # rather than assuming that Electron app data and Chromium storage coincide.
    $childProfiles = @()
    foreach ($child in $processes) {
      if ($child.ParentProcessId -ne $entry.ProcessId -or $child.ExecutablePath -ne $entry.ExecutablePath) { continue }
      $match = [regex]::Match($child.CommandLine, '--user-data-dir(?:=|\s+)(?:"([^"]+)"|([^ "]+))')
      if ($match.Success) {
        $childProfiles += if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
      }
    }
    $childProfiles = @($childProfiles | Sort-Object -Unique)
    if ($childProfiles.Count -ne 1) { continue }
    $profile = $childProfiles[0]
    $profileSource = "verified-child-command-line"
  }
  $portMatch = [regex]::Match($entry.CommandLine, '--remote-debugging-port(?:=|\s+)([0-9]+)')
  $port = if ($portMatch.Success) { [int]$portMatch.Groups[1].Value } else { $null }
  $instance = Get-Process -Id $entry.ProcessId -ErrorAction SilentlyContinue
  $roots += [pscustomobject]@{ pid=[int]$entry.ProcessId; started=$entry.CreationDate.ToUniversalTime().ToString("o"); version=$identity.Groups[1].Value; executable=$entry.ExecutablePath; profile=[IO.Path]::GetFullPath($profile); explicitProfile=$profileMatch.Success; profileSource=$profileSource; port=$port; ancestor=($ancestors -contains [int]$entry.ProcessId); hasWindow=($instance -and $instance.MainWindowHandle -ne 0) }
}
ConvertTo-Json -InputObject $roots -Compress
