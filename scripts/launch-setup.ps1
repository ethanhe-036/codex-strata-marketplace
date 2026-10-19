param(
  [Parameter(Mandatory=$true)][string]$NodePath,
  [Parameter(Mandatory=$true)][string]$HelperPath,
  [Parameter(Mandatory=$true)][string]$PlanPath,
  [Parameter(Mandatory=$true)][string]$PlanId
)
$ErrorActionPreference = "Stop"
try {
  foreach ($path in @($NodePath, $HelperPath, $PlanPath)) {
    if (-not [IO.Path]::IsPathRooted($path) -or -not [IO.File]::Exists($path) -or $path.Contains([char]34)) { throw "Invalid connection helper path." }
  }
  [void][Guid]::ParseExact($PlanId, "D")
  # Ask the existing desktop Explorer process to launch the helper. A detached
  # child of Codex still belongs to the process tree it cleans up when quitting.
  # FindWindowSW targets the desktop even when no Explorer folder is open.
  $shell = New-Object -ComObject Shell.Application
  $location = 0; $root = 0; $window = 0
  $desktop = $shell.Windows().FindWindowSW([ref]$location, [ref]$root, 8, [ref]$window, 1)
  if (-not $desktop) { throw "The Windows desktop launcher is unavailable." }
  $arguments = ([char]34 + $HelperPath + [char]34) + " " + ([char]34 + $PlanPath + [char]34) + " " + $PlanId
  $desktop.Document.Application.ShellExecute($NodePath, $arguments, [IO.Path]::GetDirectoryName($HelperPath), "open", 0)
} catch { Write-Error $_; exit 1 }
