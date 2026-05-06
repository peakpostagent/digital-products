#!/usr/bin/env bash
# restart-claude-trigger.sh
# Spawn restart-claude.ps1 as a detached background process. The detached
# process survives the parent (Claude Code) being killed in the next step.
#
# Designed to be called by Claude itself when the user says "restart claude"
# in chat. The script returns immediately; ~5 seconds later the detached
# PowerShell does the actual kill+spawn.
#
# Usage:
#   bash tools/restart-claude-trigger.sh
#
# What happens (timeline):
#   t+0s:  this script returns immediately
#   t+0s:  Claude sends final 'restart triggered' message
#   t+5s:  detached script kills claude.exe (this session dies)
#   t+5s:  detached script spawns new cmd window with `claude` running
#   t+10s: user sees a fresh Claude prompt in a new terminal

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_PATH="$SCRIPT_DIR/restart-claude.ps1"
WORK_DIR="C:\\Users\\colet\\Documents\\Digital Product\\Wokring Ideas"

# Sanity check
if [ ! -f "$PS1_PATH" ]; then
  echo "ERROR: $PS1_PATH not found" >&2
  exit 1
fi

# Spawn detached PowerShell. -WindowStyle Hidden keeps it invisible.
# Using nohup-equivalent on Windows: PowerShell's Start-Process detaches.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
  Start-Process powershell.exe \
    -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','$PS1_PATH','-WorkDir','$WORK_DIR' \
    -WindowStyle Hidden
"

echo "Restart triggered. Detached PowerShell running."
echo "  - In ~5 seconds: this Claude Code session dies"
echo "  - A new Claude Code window opens in $WORK_DIR"
echo "  - Restart log: $SCRIPT_DIR/restart-claude.log"
