# How to Publish Job Match Score on the Chrome Web Store

## Step-by-Step Instructions

### Step 1: Register as a Chrome Web Store Developer
1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account (peakpostagent@gmail.com)
3. Pay the one-time $5 registration fee (required by Google)
4. Accept the developer agreement

### Step 2: Host Your Privacy Policy
Your privacy policy needs to be publicly accessible at a URL. Options:
- **GitHub Pages (free, recommended):**
  1. Create a GitHub repo (e.g., `peakpostagent/privacy-policies`)
  2. Push `privacy-policy.html` to the repo
  3. Enable GitHub Pages in repo Settings > Pages
  4. Your URL will be: `https://peakpostagent.github.io/privacy-policies/job-match-score.html`
- **Alternative:** Use any free static hosting (Netlify, Vercel, etc.)

### Step 3: Prepare Your Extension Files
1. Navigate to: `extensions/job-match-score/src/`
2. Make sure these files are present:
   - `manifest.json`
   - `popup/popup.html`, `popup.css`, `popup.js`
   - `content/content.js`, `content.css`
   - `lib/matcher.js`
   - `background/service-worker.js`
   - `icons/icon16.png`, `icon48.png`, `icon128.png`
3. Create a ZIP file of the `src/` folder contents:
   - Select ALL files inside `src/` (not the src folder itself)
   - Right-click > Send to > Compressed (zipped) folder
   - Name it `job-match-score-v1.0.0.zip`

### Step 4: Create Promotional Images
You need these images for the Chrome Web Store listing:
- **Store icon:** 128x128 PNG (already have: `icons/icon128.png`)
- **Screenshots:** At least 1, up to 5 (1280x800 or 640x400)
  - Screenshot 1: Extension badge showing match score on LinkedIn
  - Screenshot 2: Popup showing keyword analysis
  - Screenshot 3: Badge details panel expanded
- **Small promo tile (optional):** 440x280 PNG
- **Marquee promo tile (optional):** 1400x560 PNG

See the `screenshots/` folder for generated images.

### Step 5: Upload to Chrome Web Store
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item" button (top right)
3. Upload your ZIP file
4. Fill in the store listing details:

**Store listing tab:**
- Name: `Job Match Score`
- Summary: (copy from listing-text.md, "Short Description")
- Description: (copy from listing-text.md, "Detailed Description")
- Category: `Productivity`
- Language: `English`
- Upload screenshots (from screenshots/ folder)
- Upload store icon (icon128.png)

**Privacy tab:**
- Single purpose: "Analyzes LinkedIn job descriptions and calculates a keyword match score against the user's saved resume."
- Permission justifications:
  - `storage`: "Saves user's resume keywords locally so they persist between sessions"
  - `activeTab`: "Reads job description text from the current LinkedIn page to calculate match score"
- Host permission justification: "Content script runs on LinkedIn job pages to extract job description text and display the match score badge overlay"
- Privacy policy URL: (your hosted privacy policy URL from Step 2)
- Data use disclosures:
  - Does not collect personally identifiable information: YES
  - Does not collect health information: YES
  - Does not collect financial information: YES
  - Does not collect authentication information: YES
  - Does not collect personal communications: YES
  - Does not collect location: YES
  - Does not collect web history: YES
  - Does not collect user activity: YES
  - Does not collect website content: Technically reads LinkedIn job text, but ONLY processes it locally

**Distribution tab:**
- Visibility: Public
- Distribution: All regions
- Pricing: Free

### Step 6: Submit for Review
1. Click "Submit for review"
2. Google typically reviews within 1-3 business days
3. You'll get an email when it's approved (or if changes are needed)

### Step 7: After Approval
Once approved, your extension will be live at:
`https://chrome.google.com/webstore/detail/job-match-score/[your-extension-id]`

Share this link anywhere. People can find it by searching "Job Match Score" or "LinkedIn resume match" on the Chrome Web Store.

---

## Common Review Issues & How to Fix Them

### "Must have a single, clear purpose"
- Our manifest already has a clear single purpose
- The "Single purpose" field should clearly state what the extension does

### "Excessive permissions"
- We only use `storage` and `activeTab` — both minimal
- Our host permission is narrowly scoped to `linkedin.com/jobs/*`

### "Missing privacy policy"
- Make sure your privacy policy URL is accessible before submitting
- Test the URL in an incognito window

### "Screenshots don't match functionality"
- Make sure screenshots show the actual extension working on LinkedIn
- Take real screenshots, not mockups

---

## Cost Breakdown
- Chrome Web Store developer registration: $5 (one-time)
- Hosting privacy policy on GitHub Pages: FREE
- Total ongoing cost: $0/month

## Timeline
- Registration: 5 minutes
- Preparing listing: 30 minutes
- Review time: 1-3 business days
- Total to go live: ~3 days
