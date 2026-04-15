# The Complete Git Command Reference

> 200+ Git commands organized by workflow. Every command has a real-world example and a plain-English explanation. Bookmark this file — it's searchable (Ctrl+F) and covers every git scenario you'll hit as a working developer.

**Version 1.0** — 2026

---

## Table of Contents

1. [Setup & Configuration](#1-setup--configuration)
2. [Starting a Repository](#2-starting-a-repository)
3. [Staging & Committing](#3-staging--committing)
4. [Branching](#4-branching)
5. [Merging](#5-merging)
6. [Rebasing](#6-rebasing)
7. [Remotes & Push/Pull](#7-remotes--pushpull)
8. [Viewing History](#8-viewing-history)
9. [Diffing](#9-diffing)
10. [Stashing](#10-stashing)
11. [Tagging](#11-tagging)
12. [Undoing Changes](#12-undoing-changes)
13. [Cherry-Picking](#13-cherry-picking)
14. [Submodules](#14-submodules)
15. [Worktrees](#15-worktrees)
16. [Bisect (Finding Bugs)](#16-bisect-finding-bugs)
17. [Reflog (Recovering Lost Work)](#17-reflog-recovering-lost-work)
18. [Hooks](#18-hooks)
19. [Cleaning Up](#19-cleaning-up)
20. [Emergency Recovery](#20-emergency-recovery)

---

## 1. Setup & Configuration

### Set your identity (required on a fresh install)
```bash
git config --global user.name "Jane Developer"
git config --global user.email "jane@example.com"
```
Every commit uses these values. Set them once per machine.

### Use VS Code as your editor
```bash
git config --global core.editor "code --wait"
```
Replace `code --wait` with `nano`, `vim`, `subl -w`, etc.

### Set the default branch name
```bash
git config --global init.defaultBranch main
```
New repos will use `main` instead of `master`.

### Enable colored output
```bash
git config --global color.ui auto
```

### Auto-prune deleted remote branches on fetch
```bash
git config --global fetch.prune true
```
Keeps your local branch list tidy.

### Cache your credentials for 1 hour
```bash
git config --global credential.helper 'cache --timeout=3600'
```
No more retyping passwords. macOS users: use `osxkeychain`. Windows: use `wincred`.

### Enable rerere (reuse recorded resolution)
```bash
git config --global rerere.enabled true
```
Git remembers how you resolved a conflict and applies the same fix next time.

### See all your config
```bash
git config --list --show-origin
```
Shows every config value and which file it came from.

### Edit global config directly
```bash
git config --global --edit
```
Opens `~/.gitconfig` in your editor.

### Set per-repo config (overrides global)
```bash
git config user.email "jane@company.com"
```
Run this inside a repo to use a different email just for that project.

---

## 2. Starting a Repository

### Initialize a new repo in the current folder
```bash
git init
```

### Initialize with a specific branch name
```bash
git init --initial-branch=main
```

### Clone a repo
```bash
git clone https://github.com/user/repo.git
```

### Clone into a specific folder
```bash
git clone https://github.com/user/repo.git my-folder
```

### Clone only the latest commit (faster for huge repos)
```bash
git clone --depth 1 https://github.com/user/repo.git
```
Called a "shallow clone." Great for CI or read-only use.

### Clone a specific branch only
```bash
git clone --branch develop --single-branch https://github.com/user/repo.git
```

### Clone with submodules
```bash
git clone --recurse-submodules https://github.com/user/repo.git
```

### Convert a shallow clone to a full clone
```bash
git fetch --unshallow
```

---

## 3. Staging & Committing

### Check status (run this constantly)
```bash
git status
```

### Short status (less noise)
```bash
git status -s
```

### Stage a specific file
```bash
git add src/app.js
```

### Stage everything in the current directory (recursively)
```bash
git add .
```

### Stage all tracked files (but not new untracked files)
```bash
git add -u
```

### Stage interactively (pick which changes to stage)
```bash
git add -p
```
The killer feature. Git walks you through each "hunk" of changes so you can make small, clean commits.

### Stage by pattern
```bash
git add '*.ts'
```
Use quotes so the shell doesn't expand the glob before git sees it.

### Commit with a message
```bash
git commit -m "fix: prevent null pointer in login flow"
```

### Commit all tracked files without staging first
```bash
git commit -am "docs: update README"
```
`-a` auto-stages modified/deleted tracked files. Doesn't pick up new files.

### Open editor for a long, multi-line commit
```bash
git commit
```

### Amend the last commit (add forgotten files or fix the message)
```bash
git add forgotten-file.js
git commit --amend
```
**Only amend commits you haven't pushed.** Amending rewrites history.

### Amend without changing the message
```bash
git commit --amend --no-edit
```

### Sign a commit (if you have GPG set up)
```bash
git commit -S -m "feat: add 2FA support"
```

### Empty commit (trigger a CI rebuild, for example)
```bash
git commit --allow-empty -m "chore: trigger deploy"
```

---

## 4. Branching

### List local branches (* marks current)
```bash
git branch
```

### List all branches including remotes
```bash
git branch -a
```

### List branches sorted by last commit date
```bash
git branch --sort=-committerdate
```
Most recent first. Invaluable for busy repos.

### Create a new branch (stay on current branch)
```bash
git branch feature/checkout
```

### Create and switch to a new branch
```bash
git switch -c feature/checkout
```
`switch` is the modern replacement for `checkout -b`. Clearer and safer.

### Switch to an existing branch
```bash
git switch main
```

### Switch to the previous branch (like `cd -`)
```bash
git switch -
```

### Rename the current branch
```bash
git branch -m new-name
```

### Rename another branch
```bash
git branch -m old-name new-name
```

### Delete a merged branch
```bash
git branch -d feature/old-thing
```

### Force-delete an unmerged branch
```bash
git branch -D feature/abandoned
```
**Destructive.** The branch is gone — but see [reflog](#17-reflog-recovering-lost-work) if you panic.

### Delete a remote branch
```bash
git push origin --delete feature/old-thing
```

### List branches that are fully merged into main
```bash
git branch --merged main
```
Safe to delete these.

### List branches NOT merged into main
```bash
git branch --no-merged main
```

### Set upstream so `git push` knows where to go
```bash
git push -u origin feature/checkout
```
`-u` remembers the remote. After the first push, `git push` works with no arguments.

---

## 5. Merging

### Merge a branch into your current branch
```bash
git switch main
git merge feature/checkout
```

### Merge without creating a merge commit (fast-forward only)
```bash
git merge --ff-only feature/checkout
```
Fails if a fast-forward isn't possible. Good for enforcing linear history.

### Force a merge commit even when fast-forward is possible
```bash
git merge --no-ff feature/checkout
```
Preserves the "feature branch existed" history.

### Squash-merge (combines all feature commits into one)
```bash
git merge --squash feature/checkout
git commit -m "feat: add checkout flow"
```
The cleanest way to land feature branches on main.

### Abort a merge in progress
```bash
git merge --abort
```

### Continue after resolving conflicts
```bash
git add resolved-file.js
git merge --continue
```

### See what would be merged (preview)
```bash
git log main..feature/checkout --oneline
```

### Show files with conflicts
```bash
git diff --name-only --diff-filter=U
```

### Use a GUI merge tool
```bash
git mergetool
```
Opens whatever tool you configured (VS Code, Beyond Compare, kdiff3).

---

## 6. Rebasing

### Rebase your branch onto main
```bash
git switch feature/checkout
git rebase main
```
Replays your commits on top of the latest `main`. Cleaner than merging `main` in.

### Interactive rebase (reorder, squash, edit, drop commits)
```bash
git rebase -i HEAD~5
```
Rewrites the last 5 commits. An editor opens — change `pick` to `squash`, `reword`, `edit`, `drop`, etc.

### Abort a rebase in progress
```bash
git rebase --abort
```

### Continue after resolving conflicts
```bash
git add resolved-file.js
git rebase --continue
```

### Skip a problematic commit during rebase
```bash
git rebase --skip
```

### Rebase and auto-squash "fixup!" commits
```bash
git commit --fixup HEAD~2
git rebase -i --autosquash HEAD~5
```
Powerful workflow: mark small fixes with `--fixup` as you go, then clean up in one pass.

### Push a rebased branch (force, safely)
```bash
git push --force-with-lease
```
**Use this, never `--force`.** `--force-with-lease` refuses to push if someone else has committed since your last fetch, protecting their work.

---

## 7. Remotes & Push/Pull

### List remotes
```bash
git remote -v
```

### Add a remote
```bash
git remote add origin https://github.com/user/repo.git
```

### Change a remote URL (e.g., HTTPS to SSH)
```bash
git remote set-url origin git@github.com:user/repo.git
```

### Remove a remote
```bash
git remote remove old-remote
```

### Fetch changes without merging
```bash
git fetch
```

### Fetch from all remotes
```bash
git fetch --all
```

### Fetch and prune deleted remote branches
```bash
git fetch --prune
```

### Pull (fetch + merge)
```bash
git pull
```

### Pull with rebase instead of merge (cleaner history)
```bash
git pull --rebase
```

### Set pull to always rebase
```bash
git config --global pull.rebase true
```

### Push to the current branch's upstream
```bash
git push
```

### Push a new branch and set upstream
```bash
git push -u origin feature/checkout
```

### Push all local branches
```bash
git push --all
```

### Push tags
```bash
git push --tags
```

### Show what a push would do (dry run)
```bash
git push --dry-run
```

---

## 8. Viewing History

### Show commit log
```bash
git log
```

### One line per commit
```bash
git log --oneline
```

### Pretty graph view
```bash
git log --oneline --graph --all --decorate
```
This is the command — alias it to `git lg` (see the `.gitconfig` in this pack).

### Show the last N commits
```bash
git log -5
```

### Show commits by author
```bash
git log --author="Jane"
```

### Show commits touching a file
```bash
git log --follow -- path/to/file.js
```
`--follow` tracks the file across renames.

### Show commits within a date range
```bash
git log --since="2 weeks ago" --until="yesterday"
```

### Show commits that match a message pattern
```bash
git log --grep="fix"
```

### Show commits that added or removed a string (pickaxe)
```bash
git log -S "deprecated_function"
```
Finds the exact commit where a piece of code appeared or disappeared.

### Show commits that changed lines matching a regex
```bash
git log -G "console\.(log|error)"
```

### Show commit with the diff
```bash
git log -p
```

### Show commits with stat summary
```bash
git log --stat
```

### Show merge commits only
```bash
git log --merges
```

### Show non-merge commits only
```bash
git log --no-merges
```

### Show a single commit
```bash
git show abc1234
```

### Show a file at a specific commit
```bash
git show abc1234:src/app.js
```

### Count commits
```bash
git rev-list --count HEAD
```

### Who wrote each line (blame)
```bash
git blame src/app.js
```

### Blame a range of lines
```bash
git blame -L 40,60 src/app.js
```

### Blame ignoring whitespace changes
```bash
git blame -w src/app.js
```

---

## 9. Diffing

### Unstaged changes
```bash
git diff
```

### Staged changes
```bash
git diff --staged
```
(`--cached` is an alias for `--staged`.)

### Changes between two commits
```bash
git diff abc1234 def5678
```

### Changes between branches
```bash
git diff main..feature
```

### Changes only in `feature` since it diverged from `main`
```bash
git diff main...feature
```
Note the three dots. Cleaner for "what's on my feature branch?"

### Diff a specific file
```bash
git diff src/app.js
```

### Diff ignoring whitespace
```bash
git diff -w
```

### Summary of changed files
```bash
git diff --stat
```

### Just the names of changed files
```bash
git diff --name-only
```

### Word-level diff (great for prose/docs)
```bash
git diff --word-diff
```

---

## 10. Stashing

### Stash your changes (tracked files only)
```bash
git stash
```

### Stash with a message
```bash
git stash push -m "WIP: refactoring auth"
```

### Stash including untracked files
```bash
git stash -u
```

### Stash including ignored files
```bash
git stash -a
```

### List all stashes
```bash
git stash list
```

### Show what's in the top stash
```bash
git stash show -p
```

### Apply the top stash (keep it in the stash list)
```bash
git stash apply
```

### Apply and remove the top stash
```bash
git stash pop
```

### Apply a specific stash
```bash
git stash apply stash@{2}
```

### Drop a specific stash
```bash
git stash drop stash@{1}
```

### Clear all stashes
```bash
git stash clear
```

### Create a branch from a stash
```bash
git stash branch my-experiment stash@{0}
```
Great if your stash conflicts with current changes.

---

## 11. Tagging

### List tags
```bash
git tag
```

### List tags matching a pattern
```bash
git tag -l "v1.*"
```

### Create a lightweight tag
```bash
git tag v1.0.0
```

### Create an annotated tag (recommended for releases)
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
```

### Tag a specific commit
```bash
git tag -a v0.9.0 abc1234 -m "Beta release"
```

### Show tag details
```bash
git show v1.0.0
```

### Push a tag to remote
```bash
git push origin v1.0.0
```

### Push all tags
```bash
git push --tags
```

### Delete a local tag
```bash
git tag -d v1.0.0
```

### Delete a remote tag
```bash
git push origin --delete v1.0.0
```

### Check out a tag (detached HEAD — for inspection only)
```bash
git checkout v1.0.0
```

---

## 12. Undoing Changes

### Discard unstaged changes to a file
```bash
git restore src/app.js
```

### Discard all unstaged changes
```bash
git restore .
```
**Destructive** — your changes are gone.

### Unstage a file (keep the changes)
```bash
git restore --staged src/app.js
```

### Restore a file to how it was at a specific commit
```bash
git restore --source=abc1234 src/app.js
```

### Undo the last commit but keep the changes staged
```bash
git reset --soft HEAD~1
```

### Undo the last commit and unstage the changes
```bash
git reset HEAD~1
```
(Default `--mixed` mode.)

### Undo the last commit AND discard the changes
```bash
git reset --hard HEAD~1
```
**Extremely destructive.** Work is gone unless it's in the reflog.

### Revert a commit (creates a new commit that undoes it)
```bash
git revert abc1234
```
Safe for pushed commits because it doesn't rewrite history.

### Revert a merge commit
```bash
git revert -m 1 abc1234
```
`-m 1` means "keep the first parent's changes."

### Get back a file you just deleted (before committing)
```bash
git restore src/app.js
```

---

## 13. Cherry-Picking

### Apply a commit from another branch to your current branch
```bash
git cherry-pick abc1234
```

### Cherry-pick a range
```bash
git cherry-pick abc1234..def5678
```

### Cherry-pick without committing (stage only)
```bash
git cherry-pick -n abc1234
```

### Continue after resolving conflicts
```bash
git add resolved-file.js
git cherry-pick --continue
```

### Abort a cherry-pick
```bash
git cherry-pick --abort
```

---

## 14. Submodules

### Add a submodule
```bash
git submodule add https://github.com/user/lib.git lib
```

### Clone a repo with submodules
```bash
git clone --recurse-submodules <url>
```

### Initialize submodules in an already-cloned repo
```bash
git submodule update --init --recursive
```

### Update all submodules to their latest remote commits
```bash
git submodule update --remote --merge
```

### Run a command in every submodule
```bash
git submodule foreach 'git checkout main && git pull'
```

### Remove a submodule
```bash
git submodule deinit -f lib
git rm -f lib
rm -rf .git/modules/lib
```

---

## 15. Worktrees

### Create a worktree (a second checkout of the same repo)
```bash
git worktree add ../repo-feature feature/checkout
```
Now you can work on two branches simultaneously without stashing.

### List worktrees
```bash
git worktree list
```

### Remove a worktree
```bash
git worktree remove ../repo-feature
```

### Prune stale worktree entries
```bash
git worktree prune
```

---

## 16. Bisect (Finding Bugs)

Binary search through history to find the commit that introduced a bug.

### Start a bisect session
```bash
git bisect start
git bisect bad                # Current commit is bad
git bisect good v1.0.0        # This old tag was good
```
Git checks out a commit in the middle. Test it, then:

### Mark the current commit as good
```bash
git bisect good
```

### Mark the current commit as bad
```bash
git bisect bad
```

### Skip this commit (can't test it)
```bash
git bisect skip
```

### End the session (return to previous branch)
```bash
git bisect reset
```

### Automate with a test script
```bash
git bisect run npm test
```
Git runs `npm test` at each step and uses the exit code. Finds the bad commit while you get coffee.

---

## 17. Reflog (Recovering Lost Work)

The reflog is git's undo history. Anything you did in the last 90 days is probably still here, even after a hard reset.

### Show the reflog
```bash
git reflog
```

### Restore to a reflog entry
```bash
git reset --hard HEAD@{5}
```

### Find a lost commit
```bash
git reflog --all | grep "commit message snippet"
```

### Recover a deleted branch
```bash
git reflog
# Find the last commit on the deleted branch (e.g. abc1234)
git branch recovered-branch abc1234
```

### Show reflog for a specific branch
```bash
git reflog show main
```

**Remember: if you did it in git and it's less than 90 days old, it's probably recoverable from the reflog.** Don't panic.

---

## 18. Hooks

Hooks live in `.git/hooks/`. Make them executable (`chmod +x`) to activate.

### Common hooks
- `pre-commit` — runs before commit (linting, formatting)
- `commit-msg` — validates commit message
- `pre-push` — runs before push (tests)
- `post-merge` — runs after merge (reinstall deps)

### Share hooks with your team
```bash
git config --local core.hooksPath .githooks
```
Now `.githooks/` in your repo is the hooks directory. Check it in.

### Skip hooks for a single commit (emergency only)
```bash
git commit --no-verify -m "emergency fix"
```

---

## 19. Cleaning Up

### Remove untracked files (dry run first — always)
```bash
git clean -n
```

### Actually remove untracked files
```bash
git clean -f
```

### Remove untracked files AND directories
```bash
git clean -fd
```

### Remove everything, including ignored files
```bash
git clean -fdx
```
**Destructive.** Nukes `node_modules/`, build artifacts, `.env` files. Use with care.

### Garbage collect
```bash
git gc
```

### Aggressive garbage collect (smaller `.git/`)
```bash
git gc --aggressive --prune=now
```

### Find the biggest files in your repo history
```bash
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort --numeric-sort --key=2 | \
  tail -20
```

### Check repo size
```bash
git count-objects -vH
```

---

## 20. Emergency Recovery

### "I committed to the wrong branch"
```bash
git reset --soft HEAD~1      # Undo the commit, keep changes staged
git stash                     # Stash the changes
git switch correct-branch     # Go to the right branch
git stash pop                 # Apply them here
git commit -m "..."           # Commit on the right branch
```

### "I force-pushed and wiped out someone's commits"
```bash
git reflog                    # Find their commits by their hash
git push --force-with-lease origin <their-hash>:branch-name
```
Then apologize profusely on Slack.

### "I deleted a branch I still needed"
```bash
git reflog
# Find last commit on deleted branch (e.g. abc1234)
git switch -c recovered-branch abc1234
```

### "I accidentally committed a secret"
```bash
# Remove it from history (rewrite required — coordinate with team)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret.env" \
  --prune-empty --tag-name-filter cat -- --all
```
Or use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) — faster and less error-prone.

**Then rotate the secret.** Git history is public even after rewriting.

### "My repo is corrupted"
```bash
git fsck --full
```
Diagnoses problems. Follow with targeted fixes.

### "I'm lost in a merge/rebase/cherry-pick"
```bash
git status                    # Git usually tells you what to do
git <operation> --abort       # Back out safely
```
Every major operation has `--abort`. Use it. Nothing is ever truly lost.

---

## Appendix: Conventional Commits

Messages that play nicely with automated tooling and changelogs.

| Prefix | Meaning | Example |
|--------|---------|---------|
| `feat:` | New feature | `feat: add dark mode toggle` |
| `fix:` | Bug fix | `fix: handle null response from /user endpoint` |
| `docs:` | Documentation | `docs: update install instructions` |
| `style:` | Formatting, no code change | `style: run prettier on src/` |
| `refactor:` | Code change, no behavior change | `refactor: extract validation into helper` |
| `perf:` | Performance improvement | `perf: memoize expensive computation` |
| `test:` | Adding/fixing tests | `test: cover edge case in parser` |
| `chore:` | Tooling, build, deps | `chore: bump eslint to 8.57.0` |
| `ci:` | CI/CD changes | `ci: add Node 20 to test matrix` |
| `revert:` | Reverting a commit | `revert: feat: add dark mode toggle` |

Breaking change:
```
feat!: rename getUser() to fetchUser()

BREAKING CHANGE: getUser() has been removed. Use fetchUser() instead.
```

---

## Appendix: Common Flags Cheat Sheet

| Flag | What it does |
|------|--------------|
| `-a` | All tracked files (commit, etc.) |
| `-m "msg"` | Inline message |
| `-v` | Verbose |
| `-n` | Dry run (clean, push) |
| `-f` | Force |
| `-d` | Delete (merged) |
| `-D` | Force delete |
| `-p` | Patch mode / show diff |
| `-u` | Set upstream / include untracked |
| `-i` | Interactive |
| `--global` | Affects `~/.gitconfig` |
| `--local` | Affects this repo's config |
| `--amend` | Modify the last commit |
| `--force-with-lease` | Safe force push |
| `--abort` | Back out of a multi-step operation |
| `--continue` | Resume after resolving conflicts |

---

*You now have the commands. The `.gitconfig` file in this pack turns the best of them into short aliases (`git lg`, `git undo`, `git cleanup`, etc.). Install it once and never type `--oneline --graph --all --decorate` again.*

— The PeakPost Git Command Pack
