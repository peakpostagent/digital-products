# The Git Workflow Playbook

Five battle-tested workflows for five different team situations. Pick one, follow the rules, avoid merge hell.

---

## How to choose your workflow

Answer three questions:

1. **How many people push to this repo?**
   - Solo → **Solo Developer Workflow**
   - 2–10 → **GitHub Flow** (most teams)
   - 10+ → **Trunk-Based Development** or **GitLab Flow**

2. **Do you ship continuously or in versioned releases?**
   - Continuous (SaaS, web apps) → **GitHub Flow** / **Trunk-Based**
   - Versioned (libraries, mobile apps, desktop) → **GitLab Flow** with release branches

3. **How much is the "green main" rule enforced?**
   - Always green (CI blocks merges) → Any modern flow
   - "Sometimes broken" → Fix this FIRST before choosing a workflow

---

## Workflow 1: Solo Developer

You, main, done. Optimized for speed over ceremony.

### Rules
- `main` is always deployable.
- Small features: commit directly to `main`.
- Big features: short-lived branch, rebase into `main` when done.
- Push often. Your remote is your backup.

### Daily flow
```bash
git pull --rebase
# ...do work...
git add -p
git commit -m "feat: thing"
git push
```

### When to branch
When you're going to break `main` for more than a few hours.

```bash
git switch -c feature/big-thing
# ...work...
git switch main
git pull --rebase
git switch feature/big-thing
git rebase main
git switch main
git merge --ff-only feature/big-thing
git push
git branch -d feature/big-thing
```

### Tips
- Tag releases (`git tag -a v1.2.0`) so you can roll back fast.
- Use `git bisect` the day a weird bug appears — you'll thank yourself.
- Push tags too: `git push --follow-tags`.

---

## Workflow 2: GitHub Flow (the default for most teams)

One long-lived branch (`main`), short feature branches, PRs for everything. Most open source and most startups use this.

### Rules
1. `main` is always deployable.
2. Make a branch from `main` for any work.
3. Commit to the branch.
4. Open a Pull Request.
5. Get a review.
6. Merge to `main` after CI passes + review.
7. Deploy `main`.

### Branch naming
Standardize or it becomes chaos:
```
feature/short-description
fix/issue-123-null-ptr
chore/upgrade-deps
docs/update-readme
hotfix/checkout-crash
```

### Daily flow
```bash
# Start a new feature
git switch main
git pull
git switch -c feature/user-profile

# ...work...
git add -p
git commit -m "feat(profile): add avatar upload"

# Keep your branch current with main
git fetch
git rebase origin/main     # or: git merge origin/main if your team prefers

# Push and open a PR
git push -u origin feature/user-profile
# (open PR in GitHub UI)

# After merge, clean up
git switch main
git pull
git branch -d feature/user-profile
git fetch --prune
```

### Merge strategies — pick ONE team-wide

| Strategy | Result | When to use |
|----------|--------|-------------|
| **Squash & merge** | Each PR becomes 1 clean commit on `main` | Recommended for most teams |
| **Rebase & merge** | Preserves individual commits, no merge bubbles | Teams with disciplined commit hygiene |
| **Merge commit** | Explicit merge bubble shows branch history | Large features where branch context matters |

Configure defaults in GitHub: **Settings → General → Pull Requests**.

### Protect `main`
Turn on GitHub branch protection:
- Require PR reviews (1+ approvals)
- Require status checks (CI must pass)
- Require conversation resolution
- Block force pushes and deletions

### PR checklist (suggested for the PR description)
```md
## What this PR does
- ...

## How to test
- [ ] ...

## Related issues
Closes #123
```

---

## Workflow 3: Trunk-Based Development (high-performing teams)

Everyone commits to `main` (or to branches that live less than a day). Used by Google, Facebook, Netflix. Requires strong CI, feature flags, and fast review.

### Rules
- Branches live hours, not days.
- Feature flags hide incomplete work — you ship dark.
- CI runs on every push to `main`.
- Bad commits are reverted, not fixed in place.

### Why it works
- Integration happens continuously — no "merge week."
- `main` stays green because CI is fast and strict.
- Everyone sees the whole system's state in real time.

### Prerequisites
- CI pipeline < 10 minutes end-to-end.
- Feature flag system (LaunchDarkly, Unleash, or homegrown).
- Team comfortable with incremental, non-breaking changes.

### When NOT to use it
- Manual QA gating every release.
- CI takes 30+ minutes.
- Mobile/desktop app with app store approval lag.

---

## Workflow 4: GitLab Flow with Release Branches

For teams that ship versioned releases or support multiple versions in production.

### Branches
- `main` — next version, continuously integrated
- `release/1.0`, `release/1.1`, ... — stabilized version branches
- `feature/*` — branched from `main`, merged to `main`
- `hotfix/*` — branched from the affected `release/*` branch

### Flow
1. Work happens on `main` via feature branches.
2. When preparing a release, branch `release/X.Y` from `main`.
3. Only bug fixes go to `release/X.Y`.
4. Cherry-pick release fixes back to `main`:
   ```bash
   git switch main
   git cherry-pick <fix-commit>
   ```
5. Tag released versions:
   ```bash
   git switch release/1.0
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push --tags
   ```

### Hotfix for an old version
```bash
git switch release/1.0
git switch -c hotfix/login-crash
# ...fix...
git switch release/1.0
git merge --no-ff hotfix/login-crash
git tag -a v1.0.1 -m "Hotfix: login crash"
git push --tags

# Now port back to main
git switch main
git cherry-pick hotfix/login-crash
```

---

## Workflow 5: Git Flow (when you need it, rarely)

Five branch types, complex but thorough. Use only for projects with hard release cadences (quarterly releases, regulated industries).

### Branches
- `main` — production
- `develop` — integration
- `feature/*` — from `develop`, merged to `develop`
- `release/*` — from `develop`, merged to `develop` AND `main`
- `hotfix/*` — from `main`, merged to `main` AND `develop`

**Honest assessment:** Git Flow was designed in 2010 when CI was rare and releases were quarterly. Most teams should use GitHub Flow instead. The creator himself has said Git Flow is overkill for CD teams.

---

## Commit message conventions

The #1 rule: **your future self reads commit messages more often than you think.**

### Conventional Commits (recommended)

Format:
```
<type>(<optional scope>): <short summary>

<optional body — why, not what>

<optional footer — breaking changes, issue refs>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

### Good commit messages
```
feat(auth): add Google OAuth sign-in
fix(cart): prevent negative quantities
docs: clarify env variable setup in README
perf(search): cache fuzzy-match scores (3x faster)
refactor(api): extract validation into middleware
```

### Bad commit messages
```
Update           # What was updated? Why?
Fix bug          # Which bug? Where?
Final final v2   # ...
WIP              # Commit, then squash before PR.
asdf             # Shame.
```

### Pro tip
Write the commit message FIRST (as a note) before you make the change. If you can't explain what you're doing in one line, you're doing too much.

---

## Merge conflicts: the playbook

### Before
```bash
git fetch
git rebase origin/main
```

### During
When git stops at a conflict:
```bash
git status                       # Shows files with conflicts
# Open the files. Look for <<<<<<<, =======, >>>>>>> markers.
# Choose the right code. Delete the markers.
git add <resolved-file>
git rebase --continue            # or: git merge --continue
```

### Lost/confused? Bail out
```bash
git rebase --abort               # Back to clean state
git merge --abort
```

### Before you push
Always run the tests. Merge conflicts introduce bugs even when syntax is fine.

### Use `zdiff3` conflict style
Add to your `.gitconfig`:
```
[merge]
    conflictStyle = zdiff3
```
Shows the common ancestor in conflict markers — you'll almost always resolve conflicts faster.

---

## Release checklist

Before cutting a release:

- [ ] All tests green on CI
- [ ] Version bumped (`package.json`, `pyproject.toml`, etc.)
- [ ] `CHANGELOG.md` updated
- [ ] Changelog entry links to relevant PRs
- [ ] Smoke-tested in staging
- [ ] Tag created with annotated message
- [ ] Tag pushed (`git push --tags`)
- [ ] Release notes drafted on GitHub/GitLab
- [ ] Deployment triggered
- [ ] Production smoke-test passed
- [ ] Team notified in Slack/Discord

---

## Team etiquette

**Rules that prevent 90% of Git drama:**

1. **Never `git push --force` to a shared branch.** Use `--force-with-lease` on your own feature branches, never on `main` or `develop`.
2. **Rebase your branch, not the base branch.** `git rebase main` on your feature — never `git rebase feature` on `main`.
3. **Pull before you push.** Always.
4. **Small PRs.** Under 400 lines diff where possible. Reviewers can only catch what they can read.
5. **Squash noisy commits before merging.** One PR → one or two meaningful commits on `main`.
6. **Don't mix refactors and features in one PR.** Reviewers can't tell what matters.
7. **Branches are cheap, cherry-picking is cheap, re-cloning is cheap. Don't hoard work locally.**

---

## A final note

Workflows are tools. The best workflow is the one your team actually follows. Start simple (GitHub Flow), add process only when pain forces you to.

And when in doubt — read the reflog, abort, and try again. Nothing in Git is truly lost within 90 days.
