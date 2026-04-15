# The PeakPost Git Command Pack

**Thank you for your purchase.** This pack contains everything in the table below.

## What's in this folder

| File | What it is |
|------|------------|
| `Git-Cheat-Sheet.html` | One-page printable cheat sheet. Open in any browser and print → PDF. |
| `Git-Cheat-Sheet.pdf` | Same cheat sheet, pre-rendered PDF. Print it and pin it to your wall. |
| `Git-Command-Reference.md` | 200+ commands with examples. The full reference — searchable in any editor. |
| `Git-Workflow-Playbook.md` | Five proven team workflows: solo, GitHub Flow, trunk-based, GitLab Flow, Git Flow. |
| `gitconfig-template.txt` | Drop-in `.gitconfig` with 50+ productivity aliases. |
| `gitignore-global.txt` | Global `.gitignore` covering every OS, editor, and language. |
| `Quick-Start.md` | 5-minute setup guide. Start here. |

## 60-second quick start

1. **Open the cheat sheet.** Double-click `Git-Cheat-Sheet.pdf`. Print it or save it.
2. **Install the aliases** (macOS/Linux):
   ```bash
   cp gitconfig-template.txt ~/.gitconfig
   ```
   (Windows: copy to `%USERPROFILE%\.gitconfig`.)
3. **Set your identity** (if not already done):
   ```bash
   git config --global user.name  "Your Name"
   git config --global user.email "you@example.com"
   ```
4. **Try the aliases:**
   ```bash
   git lg          # pretty one-line graph log
   git s           # short status
   git ap          # interactive stage
   git aliases     # show all aliases
   ```
5. **Install the global gitignore:**
   ```bash
   cp gitignore-global.txt ~/.gitignore_global
   git config --global core.excludesfile ~/.gitignore_global
   ```

You're done. See `Quick-Start.md` for a guided walkthrough.

## License

Personal and commercial use. Don't resell or redistribute the files themselves.

## Feedback?

Reply to your Gumroad receipt. Every email is read.
