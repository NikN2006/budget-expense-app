# Budget & Expense Tracker

A comprehensive expense tracking application with income management, budget tracking, and detailed analytics.

## Features

### ✅ Expense Tracking
- Add expenses with date, description, amount, category, and payment method
- Predefined categories: Food, Entertainment, Groceries, Transportation, Shopping, Bills, Healthcare, Education, Miscellaneous
- Multiple payment methods: Credit Card, Debit Card, Cash, Bank Transfer, Digital Wallet, Other
- Edit and delete expenses
- Filter expenses by date range, category, and payment method

### ✅ Income Tracking
- Log income with date, source, and amount
- View all income entries
- Delete income records
- Track total income

### ✅ Budget Management
- Set budgets for each spending category
- Choose budget periods: Daily, Weekly, or Monthly
- Automatic budget tracking
- Visual progress bars showing budget status
- Color-coded indicators:
  - 🟢 Green: Under budget
  - 🟡 Yellow: At budget
  - 🔴 Red: Over budget

### ✅ Comprehensive Dashboard
- **Summary Cards**: Total Income, Total Expenses, Net Balance
- **Budget Status Overview**: See all active budgets and their current status
- **Interactive Pie Chart**: Visual breakdown of spending by category
- **Category Breakdown**: Detailed list with amounts and percentages
- **Payment Method Breakdown**: See spending by payment method
- **Recent Transactions**: Quick view of latest 5 transactions

### ✅ Data Persistence
- All data stored locally using browser's LocalStorage
- Data persists between sessions
- No server or database required

### ✅ Filtering & Search
- Filter expenses by date range
- Filter by category
- Filter by payment method
- Combine multiple filters
- Clear all filters with one click

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. The app will load with the Dashboard tab active

### Adding an Expense
1. Go to the **Expenses** tab
2. Fill in the form:
   - Select date
   - Enter amount
   - Add description
   - Choose category
   - Select payment method
3. Click "Add Expense"

### Adding Income
1. Go to the **Income** tab
2. Fill in the form:
   - Select date
   - Enter amount
   - Add source (e.g., "Salary", "Freelance", "Gift")
3. Click "Add Income"

### Setting a Budget
1. Go to the **Budget** tab
2. Fill in the form:
   - Select category
   - Enter budget amount
   - Choose period (Daily, Weekly, or Monthly)
3. Click "Set Budget"
4. The app will automatically track spending against this budget

### Viewing Analytics
1. Go to the **Dashboard** tab
2. View:
   - Total income, expenses, and net balance
   - Budget status for all categories
   - Pie chart showing spending breakdown
   - Category and payment method breakdowns
   - Recent transactions

### Filtering Expenses
1. Go to the **Expenses** tab
2. Scroll to the "Filter Expenses" section
3. Set your filters:
   - Start and end dates
   - Category
   - Payment method
4. Click "Apply Filters"
5. Click "Clear Filters" to reset

## Budget Tracking Logic

### Daily Budget
- Tracks spending from midnight to midnight of the current day
- Resets automatically each day

### Weekly Budget
- Tracks spending from Sunday to Saturday
- Resets automatically each week

### Monthly Budget
- Tracks spending from the 1st to the last day of the month
- Resets automatically each month

## Data Storage

All data is stored in your browser's LocalStorage:
- `expenses`: Array of all expense records
- `income`: Array of all income records
- `budgets`: Array of all budget settings

**Note**: Clearing browser data will delete all stored information.

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Technical Details

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Charts**: Chart.js library for pie chart visualization
- **Storage**: Browser LocalStorage API
- **Responsive**: Works on desktop and mobile devices

## Tips for Best Use

1. **Set Realistic Budgets**: Start with your actual spending patterns
2. **Regular Updates**: Add expenses daily for accurate tracking
3. **Use Categories Consistently**: Helps with better analytics
4. **Review Dashboard Weekly**: Stay on top of your spending
5. **Track All Income**: Get accurate net balance calculations

## Future Enhancements (Optional)

- Export data to CSV
- Import data from CSV
- Multiple currency support
- Recurring expenses/income
- Savings goals
- Bill reminders
- Dark mode
- Print reports

## Support

This is a standalone application that runs entirely in your browser. No internet connection required after initial load.

---

**Made with ❤️ for better financial management**