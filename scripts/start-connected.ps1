param([string]$ProfilePath)

function Get-StrataCodexExecutable {
  $package = Get-AppxPackage OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
  if (-not $package -or $package.Name -ne 'OpenAI.Codex' -or $package.PublisherId -ne '2p2nqsd0c76g0') { throw 'The official Codex Store package was not found.' }
  $executable = Join-Path $package.InstallLocation 'app/ChatGPT.exe'
  if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) { throw 'The installed Codex executable was not found.' }
  return $executable
}

function Start-ConnectedCodex([string]$ProfilePath) {
  if (-not [IO.Path]::IsPathRooted($ProfilePath)) { throw 'A saved absolute Codex profile path is required.' }
  $profile = [IO.Path]::GetFullPath($ProfilePath)
  $official = Get-StrataCodexExecutable
  $hosts = & (Join-Path $PSScriptRoot 'discover-desktop.ps1') | ConvertFrom-Json
  $matching = @($hosts | Where-Object { [string]::Equals([IO.Path]::GetFullPath($_.profile), $profile, [StringComparison]::OrdinalIgnoreCase) })
  if ($matching.Count -gt 1) { throw 'Several Codex processes use this profile. Close them normally before opening this shortcut.' }
  if ($matching.Count -eq 1 -and -not $matching[0].port) {
    throw 'This Codex profile is already running without the desktop connection. Save your work, choose File > Exit in Codex, then open Codex + Strata. No process was stopped.'
  }
  $port = if ($matching.Count) { [int]$matching[0].port } else {
    $reservation = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    try { $reservation.Start(); $reservation.LocalEndpoint.Port } finally { $reservation.Stop() }
  }
  # Resolve the installed Store package on every launch, including after updates.
  # The shortcut is an explicit request to open an interactive Codex window.
  Start-Process -FilePath $official -ArgumentList @("--remote-debugging-port=$port", '--remote-debugging-address=127.0.0.1', ('"--user-data-dir=' + $profile + '"')) -WindowStyle Normal
}

function Install-StrataLauncher([string]$SourceDirectory, [string]$Directory, [string]$ProfilePath, [string]$ShortcutDirectory = [Environment]::GetFolderPath('DesktopDirectory')) {
  if (-not [IO.Path]::IsPathRooted($ProfilePath)) { throw 'A saved absolute Codex profile path is required.' }
  $profile = [IO.Path]::GetFullPath($ProfilePath)
  $directory = [IO.Path]::GetFullPath($Directory)
  $official = Get-StrataCodexExecutable
  [IO.Directory]::CreateDirectory($directory) | Out-Null
  foreach ($name in @('start-connected.ps1', 'discover-desktop.ps1')) { Copy-Item -LiteralPath (Join-Path $SourceDirectory $name) -Destination (Join-Path $directory $name) -Force }
  $target = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
  $arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "' + (Join-Path $directory 'start-connected.ps1') + '" -ProfilePath "' + $profile + '"'
  $shell = New-Object -ComObject WScript.Shell
  $path = Join-Path $ShortcutDirectory 'Codex + Strata.lnk'
  if (Test-Path -LiteralPath $path) {
    $existing = $shell.CreateShortcut($path)
    if ($existing.TargetPath -ne $target -or $existing.Arguments -ne $arguments) {
      $hash = [Security.Cryptography.SHA256]::Create()
      try { $suffix = [BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($profile.ToLowerInvariant()))).Replace('-', '').Substring(0, 8).ToLowerInvariant() } finally { $hash.Dispose() }
      $path = Join-Path $ShortcutDirectory ("Codex + Strata - $suffix.lnk")
      if (Test-Path -LiteralPath $path) {
        $existing = $shell.CreateShortcut($path)
        if ($existing.TargetPath -ne $target -or $existing.Arguments -ne $arguments) { throw 'An unrelated shortcut already uses this name. No existing shortcut was changed.' }
      }
    }
  }
  $link = $shell.CreateShortcut($path)
  $link.TargetPath = $target
  $link.Arguments = $arguments
  $link.WorkingDirectory = $directory
  $link.IconLocation = $official + ',0'
  $link.Description = 'Open this Codex profile with the local Strata connection.'
  $link.WindowStyle = 7
  $link.Save()
  return $path
}

if ($MyInvocation.InvocationName -ne '.') {
  $ErrorActionPreference = 'Stop'
  try { Start-ConnectedCodex -ProfilePath $ProfilePath }
  catch {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($_.Exception.Message, 'Codex + Strata') | Out-Null
    exit 1
  }
}
