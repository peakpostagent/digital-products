# The Freelancer's Business-in-a-Box
## Quick Start Guide

---

### Welcome!

Congratulations on taking control of your freelance business finances. This spreadsheet system gives you everything you need to track clients, projects, invoices, income, expenses, and pricing -- all in one place.

**What's in the box:**
- 7-tab Google Sheets workbook (Dashboard, Client CRM, Project Pipeline, Invoice Tracker, Income & Expenses, Rate Calculator, Proposal Template)
- This Quick Start Guide
- Tax Prep Checklist for freelancers
- Client Onboarding Checklist

---

### Step 1: Make Your Copy

1. Open the `.xlsx` file in Google Sheets (File > Open > Upload)
2. Or import it: Google Sheets > File > Import > Upload
3. Choose "Replace spreadsheet" when prompted
4. **Important:** The file is now yours to edit. The original stays safe.

If you prefer Excel, the file works there too. All formulas are compatible with both platforms.

---

### Step 2: Set Up Your Tabs (Do These First)

Work through the tabs in this order for the smoothest setup:

#### Tab 1: Client CRM
**Time needed: 5 minutes**

1. Delete the 3 sample rows (Sarah Mitchell, David Chen, Maria Rodriguez)
2. Add your real clients, one per row
3. Use the dropdown menus for "Source" and "Status" columns
4. Set follow-up dates for active clients
5. The "Lifetime Value" column calculates automatically from your projects

#### Tab 2: Project Pipeline
**Time needed: 5 minutes**

1. Delete the 4 sample projects
2. Add your current and recent projects
3. The "Client" column has a dropdown that pulls from your CRM tab
4. Set your hourly rate for each project
5. "Project Value" and "Amount Due" calculate automatically

#### Tab 3: Invoice Tracker
**Time needed: 5 minutes**

1. Delete the 5 sample invoices
2. Add your real invoices (both paid and outstanding)
3. Use the status dropdown: Draft, Sent, Paid, Overdue, Cancelled
4. The summary section at the bottom updates automatically
5. "Days to Pay" calculates how long each invoice takes to get paid

#### Tab 4: Income & Expenses
**Time needed: 10 minutes**

1. Delete all sample income and expense entries
2. Add your real income (from project payments, retainers, passive income)
3. Add your real expenses (software, office, travel, etc.)
4. Mark tax-deductible expenses with "Yes" in that column
5. The Profit/Loss section at the bottom calculates automatically

#### Tab 5: Rate Calculator
**Time needed: 2 minutes**

1. Change the yellow input cells to match your situation:
   - Desired annual income (what you want to take home)
   - Working weeks per year (account for vacation)
   - Billable hours per week (be realistic -- not all hours are billable)
   - Annual business expenses
   - Tax rate (ask your accountant if unsure)
   - Desired profit margin
2. All calculated rates update instantly

#### Tab 6: Proposal Template
**Time needed: 5 minutes**

1. Replace "[YOUR COMPANY NAME]" with your business name
2. Update the contact info in row 2
3. Customize the sample proposal with your typical project structure
4. Adjust payment terms to match your business
5. Use File > Print or File > Download as PDF when you need to send one

#### Tab 7: Dashboard
**Time needed: 0 minutes**

The dashboard populates automatically from all other tabs. Once you've entered your data in the other tabs, come back here to see your business overview.

---

### How the Formulas Work

You don't need to understand these to use the spreadsheet, but here's what's happening behind the scenes:

**Lifetime Value (CRM tab):**
Adds up all project values from the Project Pipeline tab where the client name matches. If you add a new project for "Sarah Mitchell," her lifetime value updates automatically.

**Project Value (Pipeline tab):**
Estimated Hours x Hourly Rate. Simple multiplication, but it saves you from doing mental math on every project.

**Amount Due (Pipeline tab):**
Project Value minus Amount Paid. Tells you what's still owed at a glance.

**Days to Pay (Invoice tab):**
If paid: Payment Date minus Date Sent. If unpaid: Today's Date minus Date Sent. Helps you identify slow-paying clients.

**Dashboard metrics:**
Each number on the dashboard is a SUM, COUNTIF, SUMIF, or AVERAGE formula pulling from the other tabs. They update in real time as you enter data.

**Rate Calculator:**
Required Revenue = (Desired Income + Expenses) / (1 - Tax Rate). Then divides by billable hours to get your minimum hourly rate. The suggested rate adds your profit margin on top.

---

### Tips for Customizing

**Change the color scheme:**
1. Select all header cells on a tab
2. Change the fill color to your brand color
3. Update the font color if needed for readability
4. Repeat across tabs for consistency

**Add new columns:**
Insert columns anywhere. Existing formulas won't break unless you delete columns that other formulas reference.

**Add more dropdown options:**
1. Go to Data > Data Validation on the column
2. Edit the list of values
3. Add your new options separated by commas

**Formula cells (gray background):**
These cells have a light gray background so you know they're calculated. You can enter data in any white or yellow cell. Avoid typing over gray cells -- those are formulas.

---

### FAQ

**Q: Can I use this in Excel instead of Google Sheets?**
A: Yes. The .xlsx file works in Microsoft Excel, Google Sheets, and LibreOffice Calc. All formulas are compatible.

**Q: Will the formulas break if I add more rows?**
A: Most formulas reference large ranges (like A2:A200), so adding rows within that range works fine. If you go beyond row 200, you may need to extend the formula ranges.

**Q: Can I share this with my accountant?**
A: Absolutely. The Income & Expenses tab and Invoice Tracker are especially useful at tax time. You can share the whole file or download individual tabs as PDFs.

**Q: How do I track multiple currencies?**
A: The spreadsheet uses USD formatting by default. For multi-currency, add a "Currency" column and convert to your base currency in a separate column.

**Q: Can I add more tabs?**
A: Yes. Add any tabs you need. The Dashboard only pulls from the existing tabs, so custom tabs won't affect it unless you add formulas that reference them.

**Q: I accidentally deleted a formula. How do I fix it?**
A: Check this guide for the formula explanations above, or re-download the original file and copy the formula from there.

---

### Need Help?

If something doesn't work as expected, check these common issues:
1. **Formulas showing as text:** Make sure the cell format is "Number" or "Currency," not "Plain Text"
2. **Dropdowns not working:** Re-apply data validation (Data > Data Validation)
3. **Dashboard showing zeros:** Make sure you have data in the other tabs first

---

*Built for freelancers who want to spend less time on spreadsheets and more time on the work that matters.*
