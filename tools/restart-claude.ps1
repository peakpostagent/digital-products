# restart-claude.ps1
# Kill the Claude Code session(s) for THIS project and spawn a new one in
# a new console window. Designed to be invoked as a detached child process
# so it survives the killing of its triggering Claude Code session.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File restart-claude.ps1
#   powershell -ExecutionPolicy Bypass -File restart-claude.ps1 -WorkDir "C:\path"
#   powershell -ExecutionPolicy Bypass -File restart-claude.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File restart-claude.ps1 -KillAll  # nuke every Claude Code session
#
# Triggered from chat by Claude itself (Claude self-spawns this detached)
# or remotely from phone (SSH/Tailscale/file-watcher into the box).

param(
  [string]$WorkDir = "C:\Users\colet\Documents\Digital Product\Wokring Ideas",
  [int]$SessionPid,           # Specific Claude Code PID to kill (preferred — passed by Claude self-trigger)
  [switch]$DryRun,
  [switch]$KillAll,
  [int]$DelaySeconds = 5
)

$logPath = Join-Path $WorkDir "tools\restart-claude.log"
function Log($msg) {
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$stamp] $msg"
  Write-Host $line
  Add-Content -Path $logPath -Value $line -ErrorAction SilentlyContinue
}

Log "==== restart-claude.ps1 starting ===="
Log "WorkDir: $WorkDir"
Log "DryRun: $DryRun  KillAll: $KillAll  DelaySeconds: $DelaySeconds"

# Find candidate Claude Code processes.
$claudeProcs = Get-Process -Name "claude" -ErrorAction SilentlyContinue
if (-not $claudeProcs) {
  Log "No claude.exe processes found. Will spawn a fresh one anyway."
} else {
  Log "Found $($claudeProcs.Count) claude.exe process(es): $($claudeProcs.Id -join ', ')"
}

# Identify which Claude Code session corresponds to this project.
# Heuristic: find the process whose parent or grandparent cmd.exe / wt.exe
# was launched from $WorkDir. If we can't reliably identify, fall back to
# the largest-memory claude.exe (typically the main session vs. workers).
function Get-TargetClaudePids {
  param($Procs, $Dir, $All)

  if ($All) { return $Procs.Id }

  # Read process command-lines via WMI to filter on workdir if possible.
  $procIdList = @()
  try {
    $cwdPattern = [regex]::Escape($Dir)
    $procDetails = Get-CimInstance Win32_Process -Filter "Name='claude.exe'" -ErrorAction Stop
    foreach ($p in $procDetails) {
      $cmdline = $p.CommandLine
      if ($cmdline -and $cmdline -match $cwdPattern) {
        $procIdList += $p.ProcessId
      }
    }
  } catch {
    Log "WMI lookup failed: $_"
  }

  if ($procIdList.Count -gt 0) {
    Log "Workdir-matching claude PIDs: $($procIdList -join ', ')"
    return $procIdList
  }

  # Fallback: largest-memory claude.exe is usually the main session.
  $main = $Procs | Sort-Object -Property WorkingSet64 -Descending | Select-Object -First 1
  Log "Workdir match failed; falling back to largest-memory claude.exe (PID $($main.Id))"
  return @($main.Id)
}

# Targeting priority: explicit SessionPid > KillAll > workdir match > largest-memory fallback.
$targetPids = @()
if ($SessionPid) {
  $targetPids = @($SessionPid)
  Log "Using explicit SessionPid: $SessionPid"
} elseif ($claudeProcs) {
  $targetPids = Get-TargetClaudePids -Procs $claudeProcs -Dir $WorkDir -All:$KillAll
}
if ($targetPids -isnot [array]) { $targetPids = @($targetPids) }

if ($DryRun) {
  Log "DRY RUN -- would kill PIDs: $($targetPids -join ', ')"
  Log "DRY RUN -- would spawn: cmd /k claude  in  $WorkDir"
  Log "DRY RUN -- exiting without action."
  exit 0
}

# Wait before killing -- gives the chat session a beat to surface a
# 'restarting now' message and gives the user time to abort if needed.
Log "Sleeping $DelaySeconds seconds before kill (abort window)..."
Start-Sleep -Seconds $DelaySeconds

# Spawn the new Claude Code window FIRST, so there's no gap where the user
# is staring at nothing. The new claude blocks on stdin until they type, so
# it won't start "doing things" -- but a session is alive and ready.
if (Test-Path $WorkDir) {
  Log "Spawning new Claude Code in $WorkDir"
  # /k keeps the cmd open after claude exits (so user sees the prompt if claude crashes)
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$WorkDir`" && claude" -WindowStyle Normal
  Start-Sleep -Milliseconds 1500
} else {
  Log "WARNING: WorkDir does not exist: $WorkDir -- skipping spawn."
}

# Kill the old session(s) -- use taskkill /T to cascade-kill child workers
# (npm-launched Claude Code spawns multiple node + child processes).
if ($targetPids.Count -gt 0) {
  foreach ($procId in $targetPids) {
    try {
      Log "Killing claude tree at PID $procId (taskkill /F /T)"
      $taskkillOutput = & taskkill.exe /F /T /PID $procId 2>&1
      Log "taskkill output: $taskkillOutput"
    } catch {
      Log "Kill failed for PID $procId : $_"
    }
  }
} else {
  Log "No target PIDs to kill."
}

Log "==== restart-claude.ps1 done ===="
