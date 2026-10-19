param([Parameter(Mandatory=$true)][string]$PlanPath, [Parameter(Mandatory=$true)][string]$PlanId)
$ErrorActionPreference = "Stop"
$plan = $null
function Assert-RunningPlan {
  $current = [IO.File]::ReadAllText($PlanPath) | ConvertFrom-Json
  if ($current.planId -ne $PlanId -or $current.phase -notin @("starting", "waiting-for-close")) { throw "The connection plan changed." }
  $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  if ($now -gt $current.deadline -or ($current.phase -eq "starting" -and $now -gt ($current.requestedAt + 15000))) { throw "The connection setup deadline expired." }
  if (-not (Get-Process -Id $current.helperPid -ErrorAction SilentlyContinue)) { throw "The connection helper exited." }
}
function Save-Phase([string]$phase, [string]$message = "") {
  $current = [IO.File]::ReadAllText($PlanPath) | ConvertFrom-Json
  if ($current.planId -ne $PlanId -or $current.phase -notin @("starting", "waiting-for-close")) { throw "The connection plan changed." }
  $plan.phase = $phase
  $plan | Add-Member -NotePropertyName updatedAt -NotePropertyValue ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -Force
  if ($message) { $plan | Add-Member -NotePropertyName error -NotePropertyValue $message -Force }
  $temporary = $PlanPath + "." + [Guid]::NewGuid().ToString("n") + ".tmp"
  try {
    # Node reads this JSON while the helper runs: no BOM and no partial writes.
    [IO.File]::WriteAllText($temporary, ($plan | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
    [IO.File]::Replace($temporary, $PlanPath, [NullString]::Value)
  } finally { if ([IO.File]::Exists($temporary)) { [IO.File]::Delete($temporary) } }
}
try {
  $plan = [IO.File]::ReadAllText($PlanPath) | ConvertFrom-Json
  if ($plan.planId -ne $PlanId) { throw "The connection plan changed." }
  $package = Get-AppxPackage OpenAI.Codex | Select-Object -First 1
  $official = Join-Path $package.InstallLocation "app/ChatGPT.exe"
  if ($plan.executable -ne $official -or $plan.port -lt 1024 -or $plan.port -gt 65535 -or $plan.phase -ne "starting") { throw "The selected application or setup plan changed." }
  $entry = Get-CimInstance Win32_Process -Filter "ProcessId = $($plan.pid)"
  if (-not $entry -or $entry.ExecutablePath -ne $official -or $entry.CreationDate.ToUniversalTime().ToString("o") -ne $plan.started) { throw "The selected process identity changed." }
  $profile = [IO.Path]::GetFullPath([string]$plan.profile)
  Assert-RunningPlan
  if ($plan.createLauncher) {
    try {
      . (Join-Path $PSScriptRoot 'start-connected.ps1')
      $shortcut = Install-StrataLauncher -SourceDirectory $PSScriptRoot -Directory (Join-Path (Split-Path $PlanPath -Parent) 'launcher') -ProfilePath $profile
      $plan | Add-Member -NotePropertyName launcherShortcut -NotePropertyValue $shortcut -Force
    } catch { $plan | Add-Member -NotePropertyName launcherError -NotePropertyValue $_.Exception.Message -Force }
  }
  # Closing a Windows Codex window can hide it to the tray without exiting.
  # The App tells the user to choose File > Exit; keep that instruction visible.
  Save-Phase "waiting-for-close"
  $deadline = [DateTimeOffset]::FromUnixTimeMilliseconds($plan.deadline).UtcDateTime
  while ([DateTime]::UtcNow -lt $deadline) {
    Assert-RunningPlan
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $($plan.pid)"
    if (-not $current -or $current.CreationDate.ToUniversalTime().ToString("o") -ne $plan.started) { break }
    Start-Sleep -Seconds 1
  }
  if ($current -and $current.CreationDate.ToUniversalTime().ToString("o") -eq $plan.started) { Save-Phase "close-timeout"; exit 1 }
  Assert-RunningPlan
  # The newly launched Codex is an interactive window explicitly requested in setup.
  $launched = Start-Process -FilePath $official -ArgumentList @("--remote-debugging-port=$($plan.port)", "--remote-debugging-address=127.0.0.1", ([char]34 + "--user-data-dir=" + $profile + [char]34)) -WindowStyle Normal -PassThru
  $launchedEntry = Get-CimInstance Win32_Process -Filter "ProcessId = $($launched.Id)"
  if (-not $launchedEntry) { throw "Codex exited before its new process could be confirmed." }
  $plan | Add-Member -NotePropertyName relaunchedPid -NotePropertyValue $launchedEntry.ProcessId -Force
  $plan | Add-Member -NotePropertyName relaunchedStarted -NotePropertyValue ($launchedEntry.CreationDate.ToUniversalTime().ToString("o")) -Force
  Save-Phase "relaunched"
} catch { if ($plan) { try { Save-Phase "failed" $_.Exception.Message } catch {} }; exit 1 }
