// Prompt definitions for all 16 Chrome extension artwork
// Style: 3D rendered, glossy, modern app-store aesthetic
// Model: Flux Dev

const ICON_STYLE = '3D rendered glossy app icon, single centered object, rounded square background, soft gradient lighting, clean minimal design, no text, no letters, no words, studio lighting, high detail, professional app store icon';

const SCREENSHOT_STYLE = 'clean professional software UI mockup, modern dark theme developer tool, browser extension popup window, crisp interface design, high resolution screenshot, photorealistic monitor display';

const PROMO_STYLE = '3D rendered promotional banner, modern gradient background, glossy floating objects, professional software marketing image, clean composition, no text, no letters, no words';

const MARQUEE_STYLE = '3D rendered wide panoramic banner, modern gradient background, glossy floating elements, professional software marketing hero image, cinematic lighting, clean composition, no text, no letters, no words';

const extensions = [
  {
    name: 'job-match-score',
    icon: `${ICON_STYLE}, a glowing 3D bullseye target with concentric rings in blue and green, a small document page with checkmarks floating beside it, deep navy blue gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, job listing page with a floating circular badge showing percentage score 78 percent in green, resume keywords highlighted in yellow on the page`,
      `${SCREENSHOT_STYLE}, extension popup panel showing resume keywords as colorful tags, match score gauge at the top, clean white interface with blue accents`,
      `${SCREENSHOT_STYLE}, browser showing job listing with highlighted matching skills, floating tooltip showing keyword match details`,
      `${SCREENSHOT_STYLE}, settings panel for pasting resume text, keyword extraction preview, save button, clean minimal interface`
    ],
    promo: `${PROMO_STYLE}, 3D bullseye target with glowing rings, floating resume documents with checkmarks, blue and teal gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D bullseye target on left, floating resume pages and keyword bubbles across the scene, blue to teal gradient, professional recruitment theme`
  },
  {
    name: 'review-clock',
    icon: `${ICON_STYLE}, a 3D golden stopwatch timer with a small star rating badge, warm amber and gold gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, floating timer overlay on a product page showing elapsed review time in minutes and seconds, clean minimal design`,
      `${SCREENSHOT_STYLE}, extension popup showing review statistics, average time per review, total reviews tracked, bar chart of review durations`,
      `${SCREENSHOT_STYLE}, browser page with active review timer counting, subtle floating widget in corner, warm amber accent colors`,
      `${SCREENSHOT_STYLE}, history panel showing list of past reviews with timestamps and durations, sortable columns, export button`
    ],
    promo: `${PROMO_STYLE}, 3D golden stopwatch with floating star ratings around it, warm amber and orange gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D stopwatch on left, floating clock faces and star ratings scattered across, warm gold to orange gradient`
  },
  {
    name: 'dotenv-preview',
    icon: `${ICON_STYLE}, a 3D file document icon with a gear symbol and dot pattern, green and dark teal gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, popup panel showing environment variables in a clean table format, key-value pairs with syntax highlighting, green accent colors`,
      `${SCREENSHOT_STYLE}, file preview showing dotenv file contents with color-coded variables, comments in grey, values in green`,
      `${SCREENSHOT_STYLE}, comparison view showing two env files side by side, differences highlighted in yellow and red`,
      `${SCREENSHOT_STYLE}, settings panel with file path configuration, variable grouping options, search filter bar`
    ],
    promo: `${PROMO_STYLE}, 3D file document with gear symbols and floating key-value pairs, green and teal gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D document icons and floating environment variable blocks, green to dark teal gradient`
  },
  {
    name: 'pay-decoder',
    icon: `${ICON_STYLE}, a 3D magnifying glass examining a golden dollar sign coin, purple and indigo gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, job listing page with salary range decoded and highlighted, floating tooltip showing hourly and annual breakdown`,
      `${SCREENSHOT_STYLE}, extension popup showing salary analysis, bar chart comparing base pay and total compensation, benefits breakdown`,
      `${SCREENSHOT_STYLE}, browser page with decoded compensation details overlay, color-coded salary ranges from red to green`,
      `${SCREENSHOT_STYLE}, settings panel with location cost-of-living adjustment, currency preferences, salary comparison tools`
    ],
    promo: `${PROMO_STYLE}, 3D magnifying glass over golden coins and dollar signs, purple and indigo gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D magnifying glass on left examining floating golden coins, salary charts in background, purple to indigo gradient`
  },
  {
    name: 'meeting-cost-calculator',
    icon: `${ICON_STYLE}, a 3D calculator device with a small clock face embedded in the display, red and coral gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, floating overlay on a calendar page showing meeting cost in real-time dollars ticking up, clean timer display`,
      `${SCREENSHOT_STYLE}, extension popup showing meeting cost breakdown, number of attendees, hourly rates, total accumulated cost`,
      `${SCREENSHOT_STYLE}, dashboard view with weekly meeting cost summary, pie chart of time spent in meetings, cost trends`,
      `${SCREENSHOT_STYLE}, settings panel with hourly rate configuration, attendee count defaults, notification thresholds`
    ],
    promo: `${PROMO_STYLE}, 3D calculator with clock elements and floating dollar signs, red and coral gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D calculator and clock on left, floating money symbols and calendar pages, red to coral gradient`
  },
  {
    name: 'read-cost',
    icon: `${ICON_STYLE}, a 3D open book with a small timer clock floating above it, teal and emerald gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, article page with a floating reading time badge showing estimated minutes, word count, and reading speed`,
      `${SCREENSHOT_STYLE}, extension popup showing reading statistics, average reading speed, articles read today, time saved`,
      `${SCREENSHOT_STYLE}, browser page with highlighted text sections showing reading progress, time remaining indicator`,
      `${SCREENSHOT_STYLE}, settings panel with reading speed calibration, display preferences, badge position options`
    ],
    promo: `${PROMO_STYLE}, 3D open book with floating clock and page elements, teal and emerald gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D open book on left, floating pages and timer elements across the scene, teal to emerald gradient`
  },
  {
    name: 'tab-brake',
    icon: `${ICON_STYLE}, a 3D red octagonal stop sign with a browser tab shape, red and dark crimson gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, browser with tab limit reached page showing friendly warning message, list of open tabs, close and override buttons`,
      `${SCREENSHOT_STYLE}, extension popup showing live tab count badge, daily statistics, bar chart of tab usage over 7 days`,
      `${SCREENSHOT_STYLE}, settings panel with tab limit slider, enable disable toggle, color-coded tab count thresholds`,
      `${SCREENSHOT_STYLE}, tab management view showing all open tabs with close buttons, grouped by window, tab count indicator`
    ],
    promo: `${PROMO_STYLE}, 3D stop sign with browser tab shapes floating around it, red and crimson gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D stop sign on left, floating browser tabs being organized, red to crimson gradient`
  },
  {
    name: 'snippet-vault',
    icon: `${ICON_STYLE}, a 3D metallic vault safe door slightly open with code brackets curly braces glowing inside, slate blue and steel gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, extension popup showing organized code snippets in a list, syntax highlighted preview, copy button on each snippet`,
      `${SCREENSHOT_STYLE}, snippet editor with language selector, title field, code area with syntax highlighting, save and cancel buttons`,
      `${SCREENSHOT_STYLE}, search and filter view with category tags, language filters, recently used snippets section`,
      `${SCREENSHOT_STYLE}, import export panel with JSON import option, bulk export button, snippet count and storage usage`
    ],
    promo: `${PROMO_STYLE}, 3D vault safe with glowing code brackets floating out, slate blue and steel gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D vault on left, floating code snippets and bracket symbols across the scene, slate blue to steel gradient`
  },
  {
    name: 'api-echo',
    icon: `${ICON_STYLE}, a 3D radar dish emitting concentric signal waves, electric blue and cyan gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, devtools panel showing API requests in a sortable table, color-coded HTTP methods GET POST PUT DELETE, status codes`,
      `${SCREENSHOT_STYLE}, request detail inspector showing headers, formatted JSON response body with syntax highlighting, timing waterfall`,
      `${SCREENSHOT_STYLE}, filtered view showing only failed requests with red status codes, search bar active, method filter dropdown`,
      `${SCREENSHOT_STYLE}, request with copy as cURL button highlighted, response body with copy button, clean organized layout`
    ],
    promo: `${PROMO_STYLE}, 3D radar dish with signal waves and floating API endpoint symbols, electric blue and cyan gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D radar dish on left, concentric signal waves expanding across the banner, electric blue to cyan gradient`
  },
  {
    name: 'color-contrast-checker',
    icon: `${ICON_STYLE}, a 3D eyedropper tool picking up color from a checkered color swatch palette, rainbow gradient with dark background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, webpage with contrast checker overlay showing foreground and background colors, contrast ratio 4.5 to 1, WCAG pass fail badges`,
      `${SCREENSHOT_STYLE}, extension popup showing last checked element, color swatches, ratio result, AA and AAA compliance indicators`,
      `${SCREENSHOT_STYLE}, page with hover highlighting active, cursor over text element, subtle outline showing selectable elements`,
      `${SCREENSHOT_STYLE}, detailed results panel showing all four WCAG thresholds AA Normal AA Large AAA Normal AAA Large with pass fail`
    ],
    promo: `${PROMO_STYLE}, 3D eyedropper with floating color swatches and accessibility symbols, rainbow accent with dark gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D eyedropper on left, floating color palettes and checkmark badges across the scene, rainbow to dark gradient`
  },
  {
    name: 'web-vitals-lite',
    icon: `${ICON_STYLE}, a 3D heartbeat pulse monitor line with three colored dots green yellow red, vibrant green and lime gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, webpage with small floating badge in bottom right corner showing three colored dots for LCP CLS INP scores, green and red indicators`,
      `${SCREENSHOT_STYLE}, expanded badge detail view showing metric names values and threshold ranges, color-coded green yellow red`,
      `${SCREENSHOT_STYLE}, extension popup with vitals summary, copy report button, toggle visibility switch, clean interface`,
      `${SCREENSHOT_STYLE}, badge on a slow loading page showing red indicators, detailed breakdown of poor performing metrics`
    ],
    promo: `${PROMO_STYLE}, 3D heartbeat pulse line with three glowing indicator dots, vibrant green and lime gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D pulse monitor on left, floating performance metric indicators across the banner, green to lime gradient`
  },
  {
    name: 'css-variables-inspector',
    icon: `${ICON_STYLE}, a 3D magnifying glass over CSS curly braces with colored variable dots, violet and magenta gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, extension popup showing list of CSS custom properties with color swatches, variable names and values, grouped by scope`,
      `${SCREENSHOT_STYLE}, variable detail view with computed value, inheritance chain, usage count, copy variable name button`,
      `${SCREENSHOT_STYLE}, search and filter panel with scope selector, color variables only filter, sort by name or usage`,
      `${SCREENSHOT_STYLE}, color palette view showing all color type CSS variables as a visual grid of swatches with labels`
    ],
    promo: `${PROMO_STYLE}, 3D magnifying glass with CSS bracket symbols and colored dots, violet and magenta gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D magnifying glass on left, floating CSS variable blocks and color swatches, violet to magenta gradient`
  },
  {
    name: 'console-catcher',
    icon: `${ICON_STYLE}, a 3D terminal window screen with a butterfly net catching log messages, orange and amber gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, extension popup showing captured console logs with color-coded levels, timestamps, search bar, level filter buttons`,
      `${SCREENSHOT_STYLE}, log detail view showing expanded stack trace, formatted object output, copy and clear buttons`,
      `${SCREENSHOT_STYLE}, filtered view showing only errors in red, warning count badge, auto-scroll toggle active`,
      `${SCREENSHOT_STYLE}, export panel with JSON and text format options, date range filter, download button`
    ],
    promo: `${PROMO_STYLE}, 3D terminal screen with butterfly net and floating log message bubbles, orange and amber gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D terminal on left, floating colorful log message bubbles being caught by net, orange to amber gradient`
  },
  {
    name: 'shadow-dom-debugger',
    icon: `${ICON_STYLE}, 3D layered translucent boxes stacked with a glowing debug probe, purple and dark violet gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, webpage with shadow DOM elements highlighted with colored borders, sidebar panel listing shadow roots and their contents`,
      `${SCREENSHOT_STYLE}, tree view showing DOM hierarchy with shadow boundaries marked, expandable nodes, element inspector`,
      `${SCREENSHOT_STYLE}, element detail panel showing shadow root mode, slot assignments, adopted stylesheets list`,
      `${SCREENSHOT_STYLE}, copy panel with options to copy shadow DOM HTML, styles, or element path, clean interface with icons`
    ],
    promo: `${PROMO_STYLE}, 3D translucent layered boxes with glowing probe, purple and dark violet gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D layered translucent DOM boxes on left, tree branches connecting them, purple to dark violet gradient`
  },
  {
    name: 'service-worker-inspector',
    icon: `${ICON_STYLE}, a 3D mechanical gear cog with a magnifying glass examining it, steel blue and silver gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, extension popup showing list of registered service workers with status badges active waiting installing, scope URLs`,
      `${SCREENSHOT_STYLE}, cache storage viewer showing cached URLs grouped by cache name, size indicators, delete buttons`,
      `${SCREENSHOT_STYLE}, service worker detail view showing registration scope, script URL, update status, lifecycle state diagram`,
      `${SCREENSHOT_STYLE}, offline simulation toggle panel with network status indicator, cache-first fallback testing mode`
    ],
    promo: `${PROMO_STYLE}, 3D mechanical gear with magnifying glass and floating cache storage blocks, steel blue and silver gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D gear cog on left, magnifying glass examining it, floating worker and cache elements, steel blue to silver gradient`
  },
  {
    name: 'api-rate-limiter',
    icon: `${ICON_STYLE}, a 3D speedometer gauge with the needle in the red zone and a warning limit line, dark red and orange gradient background`,
    screenshots: [
      `${SCREENSHOT_STYLE}, extension popup showing rate limit rules in cards with URL patterns, request counters, progress bars, toggle switches`,
      `${SCREENSHOT_STYLE}, add rule modal with URL pattern field, rate limit number, time window selector, status code dropdown`,
      `${SCREENSHOT_STYLE}, request log showing throttled requests in red and passed requests in green, method URL timestamp columns`,
      `${SCREENSHOT_STYLE}, import export panel with JSON rule configuration, reset counters button, bulk enable disable toggles`
    ],
    promo: `${PROMO_STYLE}, 3D speedometer gauge with needle in red zone, floating API request symbols, dark red and orange gradient background`,
    marquee: `${MARQUEE_STYLE}, panoramic scene with 3D speedometer on left, floating throttled request indicators across the banner, dark red to orange gradient`
  }
];

module.exports = { extensions, ICON_STYLE, SCREENSHOT_STYLE, PROMO_STYLE, MARQUEE_STYLE };
