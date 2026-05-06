# Self-Restart Workflow

A way to trigger a Claude Code restart from chat (including from your phone, if you have a way to message me from there) so you don't have to physically go to the keyboard to kill+relaunch.

## The trigger

When you say **"restart claude"** in chat, I run:

```bash
bash tools/restart-claude-trigger.sh
```

That script spawns a detached PowerShell process that, ~5 seconds later, kills my Claude Code session and launches a new one in a new console window.

## Files involved

```
tools/
  restart-claude.ps1          # the actual kill+spawn script (PowerShell)
  restart-claude-trigger.sh   # bash wrapper Claude invokes from chat
  restart-claude.log          # appended on every run, timestamped
```

## Timeline of a restart

| Time | What happens |
|---|---|
| t+0s | You say "restart claude" |
| t+0s | Claude reads/saves any volatile state to memory files |
| t+0s | Claude runs `bash tools/restart-claude-trigger.sh` |
| t+0s | Trigger script spawns a detached PowerShell — returns immediately |
| t+0s | Claude sends a final "restart triggered, see you in the new session" message |
| t+5s | Detached PowerShell wakes up, identifies the Claude Code process (heuristic: largest-memory `claude.exe` in process list) |
| t+5s | Detached PowerShell spawns a new `cmd.exe` window with `claude` in the project workdir |
| t+5s | Detached PowerShell runs `taskkill /F /T /PID <session>` — current session dies |
| t+10s | You see a fresh Claude prompt in a new terminal |

## How to trigger from your phone

The "say 'restart claude' in chat" path works only if you have a way to chat with me from your phone. Whatever your remote-access setup is (SSH+tmux, web bridge, mobile Claude Code wrapper), once you're in chat, just type the phrase.

If you don't have remote chat but DO have remote shell access (SSH/Tailscale/Termius), you can run the script directly from your phone:

```bash
ssh user@your-pc 'cd "C:/Users/colet/Documents/Digital Product/Wokring Ideas" && bash tools/restart-claude-trigger.sh'
```

Or invoke the PowerShell script directly without the bash wrapper:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\colet\Documents\Digital Product\Wokring Ideas\tools\restart-claude.ps1"
```

## Targeting (which `claude.exe` gets killed)

The script tries these in order:

1. **`-SessionPid <N>`** — if you pass a specific PID, kill only that one (and its child workers via `taskkill /T`)
2. **`-KillAll`** — if you pass this flag, kill EVERY `claude.exe` process (use when you want to restart all your sessions)
3. **Workdir match via WMI** — checks if any `claude.exe` command-line contains the project path (rarely matches because Claude Code doesn't put workdir in cmdline)
4. **Largest-memory fallback** — if all else fails, picks the biggest `claude.exe` (almost always the active main session)

The fallback is reliable when only ONE Claude Code session is running. When you have multiple, pass `-SessionPid` or `-KillAll` to be precise.

## Safety / abort window

The PowerShell script sleeps 5 seconds before doing anything destructive. To abort during that window:

- Open Task Manager
- Find the detached `powershell.exe` (not the script's child cmd, the parent process)
- Right-click → End task

## Caveats

1. **You lose this chat session.** The new Claude Code starts with a fresh chat. Memory files (`MEMORY.md`, the handoff docs) persist, so context isn't lost. But you'll need to type a kickoff message in the new session.
2. **The new window appears wherever your default Windows console policy puts it** — usually on the most-recently-active monitor. If you're remote and that monitor isn't shared, you might not see it visually but the session is alive.
3. **The trigger doesn't restart Windows** or anything outside the Claude Code process. Other apps continue running unaffected.
4. **MCP servers respawn fresh** with whatever's in `.claude.json` mcpServers at the moment the new session starts. If you changed config since this session started, the new session picks up the new config.

## When NOT to use

- If you have unsaved work in this chat that hasn't been committed — `git push` first, or save to a memory file
- If your other Claude Code sessions are doing important active work — they'd survive the heuristic kill (it targets only the largest-memory one) but be aware
- If you don't know how to reconnect to the new session — confirm your remote-access path works first

## Test it (dry run, no actual restart)

Before relying on it, smoke-test:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\colet\Documents\Digital Product\Wokring Ideas\tools\restart-claude.ps1" -DryRun
```

Should output the targeting decision + spawn plan without actually doing anything. Verify the PID it would kill matches what you expect.
