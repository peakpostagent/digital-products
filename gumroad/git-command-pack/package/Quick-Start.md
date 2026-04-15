# Quick Start — Get Value in 5 Minutes

Follow along. When you're done, you'll have a supercharged Git setup and know where to look when you're stuck.

## Step 1 — Pin the cheat sheet (30 seconds)

Open `Git-Cheat-Sheet.pdf`. Decide now how you want it accessible:

- **Print it** — tape it next to your monitor
- **Save as desktop wallpaper** (works surprisingly well)
- **Bookmark it** in your browser
- **Drop it in your Obsidian/Notion vault**

The #1 reason devs don't use their cheat sheet is they can't find it when they need it. Solve that first.

## Step 2 — Install the aliases (60 seconds)

These aliases turn 12-character commands into 2-character commands.

### macOS / Linux
```bash
# Back up your current config
cp ~/.gitconfig ~/.gitconfig.backup 2>/dev/null || true

# Install the template
cp gitconfig-template.txt ~/.gitconfig

# Set your identity
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### Windows (PowerShell)
```powershell
# Back up
Copy-Item $env:USERPROFILE\.gitconfig $env:USERPROFILE\.gitconfig.backup -ErrorAction SilentlyContinue

# Install
Copy-Item gitconfig-template.txt $env:USERPROFILE\.gitconfig

# Set identity
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### Merging with an existing config

If you already have a carefully curated `.gitconfig`, open both files side-by-side and copy the `[alias]` section from `gitconfig-template.txt` into yours.

## Step 3 — Try the most useful aliases (60 seconds)

Run these inside any git repo:

```bash
git lg          # Pretty one-line graph log. The single best git alias.
git s           # Short status
git recent      # Branches sorted by last activity
git aliases     # List every alias you now have
git oops        # Reflog, prettified — your personal undo history
git recap       # What you committed today
```

If `git lg` makes you smile, you'll use these forever.

## Step 4 — Install the global gitignore (45 seconds)

Stops you from ever accidentally committing `.DS_Store`, `node_modules/`, or `.env` again — in any repo on your machine.

### macOS / Linux
```bash
cp gitignore-global.txt ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global
```

### Windows (PowerShell)
```powershell
Copy-Item gitignore-global.txt $env:USERPROFILE\.gitignore_global
git config --global core.excludesfile $env:USERPROFILE\.gitignore_global
```

## Step 5 — Skim the workflow playbook (2 minutes)

Open `Git-Workflow-Playbook.md`. Read the first section ("How to choose your workflow") and scan the one that matches your team size.

If you're solo: **Solo Developer** workflow (keeps things fast).
If you're on a 2–10 person team: **GitHub Flow** (the default for most teams).
If you're on a bigger team: **Trunk-Based** or **GitLab Flow**.

Pick one and stick to it for a sprint. Changing workflows often creates more pain than any workflow itself.

## When you're stuck — where to look

| Problem | Open |
|---------|------|
| Forgot a command | `Git-Cheat-Sheet.pdf` |
| Need more detail on a command | `Git-Command-Reference.md` (Ctrl+F to search) |
| Team question: how should we branch? | `Git-Workflow-Playbook.md` |
| Deleted something, want it back | Reference → Section 17 (Reflog) |
| Accidentally committed a secret | Reference → Section 20 (Emergency Recovery) |

## The three most important safety rules

Print these next to your cheat sheet:

1. **Never `git push --force` to a shared branch.** Use `--force-with-lease` on your feature branches only.
2. **`git pull --rebase` before you push.** Always.
3. **Don't amend commits you've already pushed.** It rewrites history and breaks your teammates' clones.

## That's it

You have a better Git setup than 90% of working developers. The cheat sheet handles the everyday. The reference handles the weird cases. The workflow playbook keeps your team sane.

Happy shipping.

— PeakPost
