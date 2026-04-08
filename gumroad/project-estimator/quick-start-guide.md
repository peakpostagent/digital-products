# Developer Project Estimation Spreadsheet -- Quick Start Guide

Welcome! This guide walks you through setting up your project estimator in under 15 minutes.

---

## Getting Started

1. Open the `.xlsx` file in Google Sheets, Microsoft Excel, or LibreOffice Calc
2. Start with the **Dashboard** tab -- fill in the yellow fields (project name, client, start date)
3. Move through each tab in order: Feature Breakdown, Timeline Builder, Cost Calculator
4. The Dashboard updates automatically as you fill in data

> **Tip:** Yellow-highlighted cells are inputs you fill in. Gray-highlighted cells contain formulas -- don't overwrite them.

---

## Tab-by-Tab Setup

### 1. Dashboard

This is your command center. Fill in:

- **Project Name** -- The name of your project
- **Client Name** -- Who you're building this for
- **Start Date** -- When work begins (MM/DD/YYYY format)
- **Status** -- Select from the dropdown: Not Started, In Progress, or Complete

Everything else on this tab auto-calculates from the other tabs. Key metrics shown:

- Total features, hours, and cost
- Timeline with risk-adjusted end date
- Cost scenarios (best/expected/worst case)
- Priority breakdown with chart

### 2. Feature Breakdown

This is where you define what you're building:

1. **Delete the sample data** (rows 2-13) and start entering your own features
2. **Feature Name** -- Be specific (e.g., "User login with OAuth" not just "Login")
3. **Complexity** -- Choose from the dropdown:
   - Low = 2-4 hours (simple pages, minor tweaks)
   - Medium = 4-8 hours (moderate features, integrations)
   - High = 8-20 hours (complex systems, third-party APIs)
4. **Estimated Hours** -- Enter your estimate (use complexity as a guide)
5. **Priority** -- Use the MoSCoW method:
   - Must Have = Required for launch
   - Should Have = Important but not critical
   - Could Have = Nice to have
   - Won't Have = Out of scope (document it anyway!)
6. **Status** -- Track progress as you build

The total hours at the bottom feed into the Cost Calculator and Dashboard.

### 3. Timeline Builder

Maps your project into phases:

1. **Keep or modify the default phases** -- they cover most software projects
2. **Set the start date** for the first phase (cell B2)
3. **Adjust duration** (days) for each phase based on your project
4. All subsequent start/end dates auto-calculate sequentially
5. The **Buffer phase** auto-sets to 20% of total timeline -- adjust if needed
6. The **Gantt chart** (columns I-T) shows a visual timeline with week markers

**How the Gantt works:** Cells showing colored bars indicate which weeks a phase spans. The colors are automatic -- you don't need to edit them.

### 4. Cost Calculator

Three sections to configure:

**Pricing Inputs:**
- Set your **Hourly Rate** (the yellow input cell)
- Hours auto-pull from Feature Breakdown
- Set your **Tax Rate**, **Platform Fee**, and **Profit Margin** percentages

**Pricing Models:**
- Hourly, Fixed Price, and Value-Based models are pre-calculated
- Use these to decide which model fits your client relationship

**What-If Scenarios:**
- Best Case (0.8x hours) -- everything goes smoothly
- Expected (1.0x) -- realistic estimate
- Worst Case (1.5x) -- Murphy's Law applies

### 5. Risk Register

Pre-loaded with 10 common software project risks:

1. Review each risk -- delete ones that don't apply
2. Add project-specific risks
3. Set **Probability** and **Impact** (Low/Medium/High)
4. **Risk Score** auto-calculates (color-coded: green/yellow/red)
5. Write a **Mitigation Strategy** for each risk
6. The risk matrix at the bottom explains the scoring

### 6. Client Proposal

A print-ready proposal that pulls data from all other tabs:

1. Fill in the **Project Overview** section with a description
2. **Scope, Timeline, and Pricing** auto-populate from other tabs
3. Customize the **Deliverables** list for your project
4. Modify the **Terms & Conditions** to match your standard contract
5. Replace `[Your Name / Company]` with your information
6. Export as PDF for client delivery

---

## Tips for Accurate Estimates

1. **Break features down** -- smaller tasks are easier to estimate
2. **Use the risk buffer** -- it's there for a reason (20% is a good default)
3. **Track actuals** -- after the project, compare estimates vs. reality to improve
4. **Present the range** -- show clients the best/expected/worst case scenarios
5. **Prioritize ruthlessly** -- "Must Have" features should be your first milestone

---

## Customization

### Adding More Feature Rows

The formulas reference rows 2-100 for Feature Breakdown and 2-50 for Risk Register, so you have plenty of room. Just add new rows within the data area (above the totals row).

### Changing Colors

All colors use hex codes in the spreadsheet. To match your brand:
- Find/replace the blue header color in your spreadsheet application
- Or modify the color constants in `build_workbook.py` and regenerate

### Extending the Gantt Chart

The Gantt chart shows 12 weeks. For longer projects, you can add more week columns following the same formula pattern in the Timeline Builder tab.

---

## Formula Reference

| Cell | Formula | What It Does |
|------|---------|--------------|
| Feature Breakdown C15 | `=SUM(C2:C13)` | Total estimated hours |
| Feature Breakdown C17 | `=COUNTIF(E:E,"Done")/COUNTA(A:A)` | Completion percentage |
| Timeline Builder (End Date) | `=B+D-1` | Calculates end from start + duration |
| Timeline Builder (Buffer) | `=SUM(D2:D7)*0.2` | 20% buffer of total phases |
| Cost Calculator C23 | Subtotal + Margin + Tax + Fees | Total project cost |
| Risk Register D column | `Probability * Impact` | Risk score (1-9 scale) |

---

## Support

Have questions? Reach out at the email listed on the Gumroad product page.

*Built for developers who'd rather spend time coding than guessing at estimates.*
