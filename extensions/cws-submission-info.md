# Chrome Web Store Submission Info

---

## API Echo

### Product Details Tab

- **Description:**

API Echo gives you a focused, distraction-free view of API calls happening on any page. No more digging through hundreds of network entries in DevTools just to find the API requests that matter.

**What it does:**
- Captures all XHR and Fetch requests automatically
- Displays requests in a clean, sortable table inside a new DevTools panel
- Color-coded HTTP methods (GET, POST, PUT, DELETE, PATCH) and status codes
- Shows request duration, response size, and timestamps at a glance

**Powerful filtering:**
- Search across URLs, headers, and request/response bodies
- Filter by HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- Filter by status code range (2xx, 3xx, 4xx, 5xx)

**Detailed request inspector:**
- View request and response headers
- Formatted JSON with syntax highlighting (keys, strings, numbers, booleans)
- Timing waterfall showing DNS, connection, TTFB, and download phases
- Copy any request as a ready-to-use cURL command
- Copy response body to clipboard with one click

**Privacy first:**
- All processing happens locally in your browser
- No data is collected, stored, or transmitted
- No external servers or analytics
- No account required

Built for frontend developers who want a cleaner way to inspect API traffic without the noise of the full Network tab.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Displays API (XHR/Fetch) network requests and responses in a focused DevTools panel with filtering, JSON formatting, and copy-as-cURL functionality.
- **Permission justifications:**
  - `storage` — Stores user preferences (filter settings, panel layout) locally using chrome.storage.local.
  - `activeTab` — Accesses the current tab to intercept and display its network (XHR/Fetch) requests in the DevTools panel.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/api-echo/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/api-echo/api-echo.zip`
- Screenshots (1280x800): `extensions/api-echo/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/api-echo/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/api-echo/store-listing/screenshots/marquee.png`

---

## Color Contrast Checker

### Product Details Tab

- **Description:**

Check accessibility in one click.

Color Contrast Checker lets you instantly verify whether text on any webpage meets WCAG 2.1 color contrast standards. Just activate the checker, click any text element, and see the contrast ratio with pass/fail results for AA and AAA compliance.

How it works:

1. Click the extension icon and hit "Activate Checker."
2. Click any text element on the page.
3. See the foreground color, background color, contrast ratio, and WCAG results in a clean overlay.
4. Click another element to check it, or dismiss the overlay.

Features:

- One-click inspection — Click any element to instantly check its contrast ratio.
- Full WCAG 2.1 coverage — Shows pass/fail for AA Normal, AA Large, AAA Normal, and AAA Large thresholds.
- Smart background detection — Walks up the DOM tree to resolve the actual visible background, even through transparent layers.
- Live preview — See a sample of the text/background color pair right in the overlay.
- Font size detection — Automatically determines if text qualifies as "large text" for relaxed WCAG thresholds.
- Hover highlighting — Elements highlight as you move your cursor, so you know exactly what you're about to check.
- Non-intrusive overlay — Uses Shadow DOM so the checker never breaks the page you're inspecting.
- 100% local — No data leaves your browser. No accounts, no tracking, no servers.

Who is this for?

- Web developers checking accessibility compliance
- Designers verifying color palette choices
- QA testers auditing sites against WCAG standards
- Anyone curious about the readability of text on a webpage

WCAG thresholds:

- AA Normal text: 4.5:1
- AA Large text: 3:1
- AAA Normal text: 7:1
- AAA Large text: 4.5:1

Privacy:

Color Contrast Checker does not collect, transmit, or share any data. Your settings and last check result are stored locally using Chrome's built-in storage. No analytics, no telemetry, no third-party services.

- **Category:** Accessibility
- **Language:** English

### Privacy Tab

- **Single purpose description:** Check color contrast ratios of text elements on any webpage against WCAG 2.1 accessibility standards.
- **Permission justifications:**
  - `storage` — Stores user settings and the last contrast check result locally using chrome.storage.local.
  - `activeTab` — Accesses the current tab to read computed colors of clicked elements and display contrast ratio results.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/color-contrast-checker/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/color-contrast-checker/color-contrast-checker.zip`
- Screenshots (1280x800): `extensions/color-contrast-checker/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/color-contrast-checker/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/color-contrast-checker/store-listing/screenshots/marquee.png`

---

## Tab Brake

### Product Details Tab

- **Description:**

Tame your tabs. Reclaim your focus.

Tab Brake puts a gentle speed bump between you and tab overload. Set a personal tab limit — say, 8 — and when you try to open one more, Tab Brake steps in with a friendly reminder to close something first (or override if you really need it).

How it works:

1. Install Tab Brake and set your tab limit (default: 8).
2. Browse normally. The badge on the extension icon shows your live tab count.
3. When you hit the limit, new tabs open a "limit reached" page instead of loading.
4. Choose to close an existing tab from the list, or override the limit just this once.

Features:

- Configurable limit — Set any limit from 1 to 50 tabs.
- Live badge — See your tab count at a glance with color-coded warnings (green, yellow, red).
- Gentle blocking — A friendly page, not a scary error. Close a tab or override with one click.
- Daily stats — See your average tab count, times blocked, and times overridden.
- 7-day chart — Visual bar chart of your daily tab usage right in the popup.
- Enable/disable — Turn limiting on or off without uninstalling.
- 100% local — All data stays on your device. No accounts, no tracking, no servers.

Why Tab Brake?

Research shows that excessive tab-switching fragments attention and increases cognitive load. Tab Brake helps you practice digital minimalism by making you pause before opening yet another tab. It's not about restriction — it's about intentionality.

Privacy:

Tab Brake does not collect, transmit, or share any data. Your tab history and settings are stored locally using Chrome's built-in storage. No analytics, no telemetry, no third-party services.

- **Category:** Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Sets a configurable tab limit and gently blocks new tabs when the limit is reached, while tracking daily tab usage statistics locally.
- **Permission justifications:**
  - `tabs` — Monitors the number of open tabs to enforce the user's tab limit and display the live tab count badge.
  - `storage` — Stores the user's tab limit setting, enable/disable state, and daily usage statistics locally using chrome.storage.local.
  - `alarms` — Schedules periodic checks to update the tab count badge and record daily usage statistics.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/tab-brake/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/tab-brake/tab-brake.zip`
- Screenshots (1280x800): `extensions/tab-brake/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/tab-brake/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/tab-brake/store-listing/screenshots/marquee.png`

---

## Web Vitals Lite

### Product Details Tab

- **Description:**

See your Core Web Vitals at a glance.

Web Vitals Lite adds a lightweight, always-visible floating badge to every page showing real-time LCP, CLS, and INP scores with color-coded pass/fail ratings based on Google's Core Web Vitals thresholds.

How it works:

1. Install Web Vitals Lite — it works immediately with zero configuration.
2. A small floating badge appears in the bottom-right corner of every page.
3. See color-coded dots: green (good), yellow (needs improvement), or red (poor).
4. Click the badge to expand and see detailed scores and threshold information.
5. One-click copy a formatted vitals report to your clipboard.

Features:

- Real-time LCP, CLS & INP — Metrics update as the page loads and as you interact.
- Color-coded pass/fail — Green, yellow, and red ratings based on Google's official thresholds.
- Expandable detail view — Click the badge for full metric names, values, and threshold ranges.
- One-click copy report — Copy a formatted report of all vitals with the page URL.
- Toggle visibility — Show or hide the badge from the popup. Your preference is saved.
- Shadow DOM isolation — The badge never breaks or is broken by the host page's styles.
- 100% local processing — No data is collected, stored, or transmitted. No external API calls.
- Zero configuration — Works on every page immediately after installation.

Core Web Vitals thresholds:

- LCP (Largest Contentful Paint): Good ≤ 2.5s, Poor > 4s
- CLS (Cumulative Layout Shift): Good ≤ 0.1, Poor > 0.25
- INP (Interaction to Next Paint): Good ≤ 200ms, Poor > 500ms

Privacy:

Web Vitals Lite does not collect, transmit, or share any data. All performance measurements happen locally in your browser using the built-in Performance API. No analytics, no telemetry, no third-party services.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Displays real-time Core Web Vitals (LCP, CLS, INP) scores in a floating badge on any webpage using the browser's built-in Performance API.
- **Permission justifications:**
  - `storage` — Stores user preferences (badge visibility toggle) locally using chrome.storage.local.
  - `activeTab` — Accesses the current tab to retrieve and display its Web Vitals metrics in the popup.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/web-vitals-lite/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/web-vitals-lite/web-vitals-lite.zip`
- Screenshots (1280x800): `extensions/web-vitals-lite/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/web-vitals-lite/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/web-vitals-lite/store-listing/screenshots/marquee.png`

---

## Console Catcher

### Product Details Tab

- **Description:**

Capture console output without DevTools.

Console Catcher silently captures all console.log, console.warn, console.error, console.info, and console.debug calls in the background — even when DevTools is closed. View, search, filter, and export your logs from a clean popup panel.

How it works:

1. Install Console Catcher — it starts capturing automatically on every page.
2. Click the extension icon to open the log viewer.
3. See color-coded log entries with timestamps.
4. Use the search bar and level filters to find what you need.
5. Export to clipboard or download as a JSON file.

Features:

- Automatic capture — Intercepts all five console methods (log, warn, error, info, debug) before the page scripts run.
- Works without DevTools — No need to open the console. Logs are captured in the background.
- Color-coded levels — Red for errors, yellow for warnings, blue for info, gray for log/debug.
- Search and filter — Text search plus per-level checkbox filters for fast log hunting.
- Collapsible stack traces — Error entries include expandable stack traces for debugging.
- Error badge — Red badge on the extension icon shows the error count for the active tab.
- One-click export — Copy all visible logs to clipboard, or download structured JSON.
- Per-tab toggle — Pause and resume capture on any tab without disabling the extension.
- Auto-pruning — Keeps the last 500 entries per tab to stay within storage limits.
- 100% local — No data is collected, transmitted, or shared. No accounts, no servers.

Privacy:

Console Catcher does not collect, transmit, or share any data. All captured logs are stored locally using Chrome's built-in storage and are cleared when the tab navigates or closes. No analytics, no telemetry, no third-party services.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Captures JavaScript console output (log, warn, error, info, debug) in the background and displays it in a searchable, filterable popup panel.
- **Permission justifications:**
  - `storage` — Stores captured console log entries and user preferences (capture on/off state) locally using chrome.storage.local.
  - `activeTab` — Identifies the currently active tab to display its console logs in the popup.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/console-catcher/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/console-catcher/console-catcher.zip`
- Screenshots (1280x800): `extensions/console-catcher/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/console-catcher/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/console-catcher/store-listing/screenshots/marquee.png`

---

## CSS Variables Inspector

### Product Details Tab

- **Description:**

Inspect CSS variables on any element, right from the Elements panel.

CSS Variables Inspector adds a sidebar pane to Chrome DevTools that shows all CSS custom properties (design tokens) applied to the selected element. See variable values, resolution chains, color swatches, and undefined variables at a glance.

How it works:

1. Open DevTools (F12) and go to the Elements panel.
2. Select any element on the page.
3. Open the "CSS Variables" sidebar pane (next to Styles and Computed).
4. See all CSS variables in scope for that element, grouped by source stylesheet.

Features:

- Variable resolution chains — See how var(--primary) resolves through var(--violet-600) to #7c3aed.
- Color swatches — Visual color previews next to every color-type variable.
- Undefined detection — Orphaned or undefined CSS variables are highlighted in red.
- Search & filter — Quickly find variables by name or value.
- Group by source — Variables organized by stylesheet (theme.css, components.css, inline, etc.).
- One-click copy — Click any variable to copy its name:value pair to clipboard.
- Summary bar — See total variable count, color count, and undefined count at a glance.
- 100% local — No data is collected, stored, or transmitted. No external servers.

Who is this for?

- Frontend developers working with design systems and CSS custom properties
- Designers inspecting design tokens on live pages
- QA engineers auditing CSS variable usage
- Anyone debugging CSS variable resolution issues

Privacy:

CSS Variables Inspector does not collect, transmit, or share any data. Your preferences are stored locally using Chrome's built-in storage. No analytics, no telemetry, no third-party services.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Displays CSS custom properties (variables) for the selected element in a DevTools sidebar pane with resolution chains, color swatches, and search.
- **Permission justifications:**
  - `storage` — Stores user preferences (grouping mode) locally using chrome.storage.local.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/css-variables-inspector/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/css-variables-inspector/css-variables-inspector.zip`
- Screenshots (1280x800): `extensions/css-variables-inspector/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/css-variables-inspector/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/css-variables-inspector/store-listing/screenshots/marquee.png`

---

## Service Worker Inspector

### Product Details Tab

- **Description:**

Inspect and debug service workers without opening DevTools.

Service Worker Inspector gives you a quick, focused view of all service worker registrations on any page. See the lifecycle state, script URL, and scope for each worker at a glance — then take action with force update and unregister buttons.

**What it does:**
- Lists all service worker registrations for the current page
- Displays lifecycle state (installing, installed, activating, activated, redundant)
- Shows script URL and scope for each registration
- Badge showing active service worker count per tab

**Cache Storage viewer:**
- Browse all named caches for the current origin
- Expand any cache to see every cached URL
- View response sizes for each cached resource
- Quickly audit what your service worker is storing

**Debugging tools:**
- Simulate offline mode with one click (blocks fetch and XHR)
- Force update a service worker registration
- Unregister a service worker completely
- Refresh data on demand

**Privacy first:**
- All processing happens locally in your browser
- No data is collected, stored, or transmitted
- No external servers or analytics
- No account required

Built for web developers who work with service workers and PWAs and want a faster way to inspect and debug without switching to the Application tab in DevTools.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Inspects service worker registrations and Cache Storage on the current page, with offline simulation and worker management controls.
- **Permission justifications:**
  - `storage` — Stores temporary UI state (offline simulation toggle) locally using chrome.storage.local.
  - `activeTab` — Accesses the current tab to identify which page to inspect for service workers.
  - `scripting` — Executes inspection scripts in the page context to query navigator.serviceWorker and the Cache Storage API.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/service-worker-inspector/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/service-worker-inspector/service-worker-inspector.zip`
- Screenshots (1280x800): `extensions/service-worker-inspector/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/service-worker-inspector/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/service-worker-inspector/store-listing/screenshots/marquee.png`

---

## Shadow DOM Debugger

### Product Details Tab

- **Description:**

Shadow DOM Debugger helps developers find, highlight, and inspect Shadow DOM elements on any web page.

**What it does:**
- Automatically detects all shadow roots on the page
- Highlights shadow host elements with purple dashed outlines and labels
- Shows badge count of shadow roots found on each tab
- Opens a sidebar panel with a full list and tree view of all shadow hosts

**Sidebar inspector:**
- List view shows every shadow host with its mode (open/closed) and child count
- Full tree view renders the nested DOM structure inside each shadow root
- Click any host to see its detailed structure and raw HTML
- Copy shadow DOM HTML to clipboard with one click

**Additional controls:**
- Toggle highlight outlines on/off
- Dim shadow content to visually distinguish shadow DOM from regular DOM
- Copy all shadow HTML from every root at once
- MutationObserver auto-detects dynamically added shadow roots

**Privacy first:**
- All processing happens locally in your browser
- No data is collected, stored, or transmitted
- No external servers or analytics
- No account required

Built for web developers working with Web Components, custom elements, and Shadow DOM encapsulation.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Detects, highlights, and inspects Shadow DOM elements on any web page with a sidebar tree inspector and HTML copy feature.
- **Permission justifications:**
  - `storage` — Stores user preferences (highlight toggle state) locally using chrome.storage.local.
  - `activeTab` — Required for the popup to identify the currently active tab and communicate with the content script to scan for shadow roots.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/shadow-dom-debugger/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/shadow-dom-debugger/shadow-dom-debugger.zip`
- Screenshots (1280x800): `extensions/shadow-dom-debugger/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/shadow-dom-debugger/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/shadow-dom-debugger/store-listing/screenshots/marquee.png`

---

## API Rate Limiter

### Product Details Tab

- **Description:**

Simulate API rate limiting without a backend.

API Rate Limiter lets developers test how their apps handle rate-limited responses by intercepting fetch and XMLHttpRequest calls and returning configurable mock errors.

**What it does:**
- Intercepts fetch() and XMLHttpRequest in the page context
- Returns mock 429 or 503 responses when rate limits are exceeded
- Counts requests per URL pattern with configurable time windows
- Preserves original functionality for non-matching requests

**Rule configuration:**
- Set rules per URL pattern using glob-style matching (e.g., *api.example.com/*)
- Configurable max requests and time window per rule
- Choose response status code: 429 Too Many Requests or 503 Service Unavailable
- Set custom Retry-After header values
- Define custom JSON error response bodies
- Enable/disable individual rules with toggle switches

**Real-time monitoring:**
- Visual request counters per rule with progress bars
- Request log showing which requests were throttled vs passed
- HTTP method labels and timestamps for every logged request
- Reset counters with one click

**Import/Export:**
- Export rules as JSON to share with teammates
- Import rules from JSON files
- Transfer configurations between machines

**Privacy first:**
- All processing happens locally in your browser
- No data is collected, stored, or transmitted
- No external servers or analytics
- No account required

Built for frontend developers who need to test retry logic, error handling, and rate-limit UX without modifying backend code or waiting for real rate limits to trigger.

- **Category:** Developer Tools
- **Language:** English

### Privacy Tab

- **Single purpose description:** Simulates API rate limiting by intercepting fetch/XHR requests matching user-defined URL patterns and returning configurable mock error responses.
- **Permission justifications:**
  - `storage` — Stores rate-limit rules, request counts, and the request log locally using chrome.storage.local.
  - `activeTab` — Identifies the currently active tab to display relevant request data in the popup.
- **Does the extension use remote code?** No
- **Data usage:** All unchecked. This extension does not collect, transmit, or share any user data.

### Privacy Policy URL

https://peakpostagent.github.io/digital-products/extensions/api-rate-limiter/store-listing/privacy-policy.html

### Assets

- Upload ZIP: `extensions/api-rate-limiter/api-rate-limiter.zip`
- Screenshots (1280x800): `extensions/api-rate-limiter/store-listing/screenshots/screenshot-1.png` through `screenshot-4.png`
- Small promo (440x280): `extensions/api-rate-limiter/store-listing/screenshots/promo-small.png`
- Marquee (1400x560): `extensions/api-rate-limiter/store-listing/screenshots/marquee.png`
