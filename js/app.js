// Budget & Expense Tracker Application
// Data Storage using LocalStorage

class BudgetExpenseTracker {
    constructor() {
        this.expenses = this.loadFromStorage('expenses') || [];
        this.income = this.loadFromStorage('income') || [];
        this.budgets = this.loadFromStorage('budgets') || [];
        this.customCategories = this.loadFromStorage('customCategories') || [];
        this.chart = null;
        this.editingExpense = null;
        this.editingIncome = null;
        this.dashboardPeriod = 'all'; // Default to all time
        this.currentTheme = this.loadFromStorage('theme') || 'electric-purple';
        this.geminiApiKey = this.loadFromStorage('geminiApiKey') || '';
        
        // Category emoji mapping
        this.categoryEmojiMap = {
            'Food': '🍔',
            'Entertainment': '🎬',
            'Groceries': '🛒',
            'Transportation': '🚗',
            'Shopping': '🛍️',
            'Bills': '💡',
            'Healthcare': '⚕️',
            'Education': '📚',
            'Miscellaneous': '📦',
            'Total': '💰'
        };
        
        // Payment method emoji mapping
        this.paymentMethodEmojiMap = {
            'Credit Card': '🔵💳',
            'Debit Card': '🔴💳',
            'Cash': '💵',
            'Bank Transfer': '🏦'
        };
        
        this.init();
    }

    // Helper method to get payment method with emoji
    getPaymentMethodWithEmoji(method) {
        return this.paymentMethodEmojiMap[method] || `💳 ${method}`;
    }
    
    // Helper method to get category with emoji
    getCategoryWithEmoji(category) {
        // If category already has emoji, return as is
        if (/^[\u{1F300}-\u{1F9FF}]/u.test(category)) {
            return category;
        }
        
        // Add emoji if it's a base category
        if (this.categoryEmojiMap[category]) {
            return `${this.categoryEmojiMap[category]} ${category}`;
        }
        
        // For custom categories, check if we have it stored with emoji
        const customWithEmoji = this.customCategories.find(cat =>
            cat.includes(category) || cat.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '') === category
        );
        
        if (customWithEmoji) {
            return customWithEmoji;
        }
        
        // Default: return with sparkle emoji for unknown categories
        return `✨ ${category}`;
    }

    // Helper method to get category without emoji (for storage/comparison)
    getCategoryWithoutEmoji(category) {
        return category.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.populateCategoryDropdowns();
        this.loadTheme();
        this.loadApiKey();
        this.switchTab('dashboard');
        this.updateDashboard();
    }

    loadApiKey() {
        if (this.geminiApiKey) {
            const apiKeyInput = document.getElementById('geminiApiKey');
            if (apiKeyInput) {
                apiKeyInput.value = this.geminiApiKey;
            }
        }
    }

    // Theme Management
    changeTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        this.saveToStorage('theme', theme);
    }

    loadTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        document.getElementById('themeSelect').value = this.currentTheme;
    }

    // Storage Methods
    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Export/Import Methods
    exportData() {
        const data = {
            expenses: this.expenses,
            income: this.income,
            budgets: this.budgets,
            customCategories: this.customCategories,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Data exported successfully! Check your downloads folder.');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (!data.expenses || !data.income || !data.budgets) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Ask for confirmation
                    const confirmMsg = `Import data from ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'backup'}?\n\n` +
                                     `This will replace your current data:\n` +
                                     `- ${data.expenses.length} expenses\n` +
                                     `- ${data.income.length} income entries\n` +
                                     `- ${data.budgets.length} budgets\n\n` +
                                     `Your current data will be overwritten!`;
                    
                    if (!confirm(confirmMsg)) return;
                    
                    // Import data
                    this.expenses = data.expenses || [];
                    this.income = data.income || [];
                    this.budgets = data.budgets || [];
                    this.customCategories = data.customCategories || [];
                    
                    // Save to localStorage
                    this.saveToStorage('expenses', this.expenses);
                    this.saveToStorage('income', this.income);
                    this.saveToStorage('budgets', this.budgets);
                    this.saveToStorage('customCategories', this.customCategories);
                    
                    // Refresh UI
                    this.updateDashboard();
                    this.displayExpenses();
                    this.displayIncome();
                    this.displayBudgets();
                    this.populateCategoryDropdowns();
                    
                    alert('✅ Data imported successfully!');
                } catch (error) {
                    alert('❌ Error importing data: ' + error.message);
                    console.error('Import error:', error);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Event Listeners
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Forms
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        document.getElementById('incomeForm').addEventListener('submit', (e) => this.handleIncomeSubmit(e));
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.handleBudgetSubmit(e));

        // Filters
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Category change listeners
        document.getElementById('expenseCategory').addEventListener('change', (e) => this.handleCategoryChange(e, 'expense'));
        document.getElementById('budgetCategory').addEventListener('change', (e) => this.handleCategoryChange(e, 'budget'));
        document.getElementById('filterCategory').addEventListener('change', (e) => this.handleCategoryChange(e, 'filter'));

        // Budget history
        document.getElementById('viewHistoryBtn').addEventListener('click', () => this.viewBudgetHistory());
    }

    setDefaultDates() {
        // Use local timezone to avoid date offset issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;
        
        document.getElementById('expenseDate').value = localDate;
        document.getElementById('incomeDate').value = localDate;
    }

    populateCategoryDropdowns() {
        const baseCategories = [
            '🍔 Food',
            '🎬 Entertainment',
            '🛒 Groceries',
            '🚗 Transportation',
            '🛍️ Shopping',
            '💡 Bills',
            '⚕️ Healthcare',
            '📚 Education',
            '📦 Miscellaneous'
        ];

        const allCategories = [...baseCategories, ...this.customCategories, '➕ Custom...'];

        // Update expense category dropdown
        const expenseSelect = document.getElementById('expenseCategory');
        expenseSelect.innerHTML = allCategories.map(cat =>
            `<option value="${cat}">${cat}</option>`
        ).join('');

        // Update budget category dropdown
        const budgetSelect = document.getElementById('budgetCategory');
        budgetSelect.innerHTML = `<option value="Total">Total (All Categories)</option>` +
            allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        // Update filter category dropdown
        const filterSelect = document.getElementById('filterCategory');
        filterSelect.innerHTML = `<option value="">All Categories</option>` +
            allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    handleCategoryChange(e, type) {
        if (e.target.value === '➕ Custom...') {
            const customCategory = prompt('Enter custom category name (emoji will be added automatically):');
            if (customCategory && customCategory.trim()) {
                const trimmedCategory = customCategory.trim();
                
                // Check if category already exists (check without emoji)
                const baseCategoriesNoEmoji = ['Food', 'Entertainment', 'Groceries', 'Transportation', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Miscellaneous', 'Total'];
                const customCategoriesNoEmoji = this.customCategories.map(cat => cat.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, ''));
                
                if (baseCategoriesNoEmoji.includes(trimmedCategory) || customCategoriesNoEmoji.includes(trimmedCategory)) {
                    alert('This category already exists!');
                    e.target.value = '🍔 Food'; // Reset to first option
                    return;
                }
                
                // Add emoji to custom category
                const categoryWithEmoji = `✨ ${trimmedCategory}`;
                
                // Add new custom category
                this.customCategories.push(categoryWithEmoji);
                this.saveToStorage('customCategories', this.customCategories);
                this.populateCategoryDropdowns();
                
                // Set the newly created category as selected
                e.target.value = categoryWithEmoji;
                
                this.showNotification(`Custom category "${categoryWithEmoji}" added!`, 'success');
            } else {
                // User cancelled or entered empty string
                e.target.value = type === 'filter' ? '' : '🍔 Food';
            }
        }
    }

    // Tab Switching
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Refresh content based on tab
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'expenses') {
            this.displayExpenses();
        } else if (tabName === 'income') {
            this.displayIncome();
        } else if (tabName === 'budget') {
            this.displayBudgets();
        }
    }

    // Expense Methods
    handleExpenseSubmit(e) {
        e.preventDefault();
        
        if (this.editingExpense) {
            // Update existing expense
            const index = this.expenses.findIndex(exp => exp.id === this.editingExpense.id);
            if (index !== -1) {
                this.expenses[index] = {
                    id: this.editingExpense.id,
                    date: document.getElementById('expenseDate').value,
                    amount: parseFloat(document.getElementById('expenseAmount').value),
                    description: document.getElementById('expenseDescription').value,
                    category: document.getElementById('expenseCategory').value,
                    paymentMethod: document.getElementById('expensePaymentMethod').value
                };
                this.showNotification('Expense updated successfully!', 'success');
            }
            this.editingExpense = null;
            document.querySelector('#expenseForm button[type="submit"]').textContent = 'Add Expense';
        } else {
            // Add new expense
            const expense = {
                id: Date.now(),
                date: document.getElementById('expenseDate').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                description: document.getElementById('expenseDescription').value,
                category: document.getElementById('expenseCategory').value,
                paymentMethod: document.getElementById('expensePaymentMethod').value
            };
            this.expenses.push(expense);
            this.showNotification('Expense added successfully!', 'success');
        }

        this.saveToStorage('expenses', this.expenses);
        
        e.target.reset();
        this.setDefaultDates();
        this.displayExpenses();
        this.updateDashboard();
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (expense) {
            this.editingExpense = expense;
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseDescription').value = expense.description;
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expensePaymentMethod').value = expense.paymentMethod;
            document.querySelector('#expenseForm button[type="submit"]').textContent = 'Update Expense';
            
            // Scroll to form
            document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    cancelEditExpense() {
        this.editingExpense = null;
        document.getElementById('expenseForm').reset();
        this.setDefaultDates();
        document.querySelector('#expenseForm button[type="submit"]').textContent = 'Add Expense';
    }

    quickAddBusFare() {
        // Use local timezone for correct date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;
        
        const busFare = {
            id: Date.now(),
            date: localDate,
            amount: 2.50,
            description: 'Bus Fare',
            category: 'Transportation',
            paymentMethod: 'Credit Card'
        };

        this.expenses.push(busFare);
        this.saveToStorage('expenses', this.expenses);
        this.displayExpenses();
        this.updateDashboard();
        this.showNotification('Bus fare ($2.50) added successfully!', 'success');
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.saveToStorage('expenses', this.expenses);
            this.displayExpenses();
            this.updateDashboard();
            this.showNotification('Expense deleted successfully!', 'success');
        }
    }

    displayExpenses(filtered = null) {
        const expenseList = document.getElementById('expenseList');
        const expenses = filtered || this.expenses;
        
        if (expenses.length === 0) {
            expenseList.innerHTML = '<p class="empty-state">No expenses found</p>';
            return;
        }

        // Sort by date (newest first)
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        expenseList.innerHTML = sortedExpenses.map(expense => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${expense.description}</h4>
                    <div class="transaction-meta">
                        <span>📅 ${this.formatDate(expense.date)}</span>
                        <span>${this.getCategoryWithEmoji(expense.category)}</span>
                        <span>${this.getPaymentMethodWithEmoji(expense.paymentMethod)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="transaction-amount expense">-$${expense.amount.toFixed(2)}</span>
                    <div class="transaction-actions">
                        <button class="btn btn-edit" onclick="tracker.editExpense(${expense.id})">Edit</button>
                        <button class="btn btn-danger" onclick="tracker.deleteExpense(${expense.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Income Methods
    handleIncomeSubmit(e) {
        e.preventDefault();
        
        if (this.editingIncome) {
            // Update existing income
            const index = this.income.findIndex(inc => inc.id === this.editingIncome.id);
            if (index !== -1) {
                this.income[index] = {
                    id: this.editingIncome.id,
                    date: document.getElementById('incomeDate').value,
                    amount: parseFloat(document.getElementById('incomeAmount').value),
                    source: document.getElementById('incomeSource').value
                };
                this.showNotification('Income updated successfully!', 'success');
            }
            this.editingIncome = null;
            document.querySelector('#incomeForm button[type="submit"]').textContent = 'Add Income';
        } else {
            // Add new income
            const income = {
                id: Date.now(),
                date: document.getElementById('incomeDate').value,
                amount: parseFloat(document.getElementById('incomeAmount').value),
                source: document.getElementById('incomeSource').value
            };
            this.income.push(income);
            this.showNotification('Income added successfully!', 'success');
        }

        this.saveToStorage('income', this.income);
        
        e.target.reset();
        this.setDefaultDates();
        this.displayIncome();
        this.updateDashboard();
    }

    editIncome(id) {
        const income = this.income.find(inc => inc.id === id);
        if (income) {
            this.editingIncome = income;
            document.getElementById('incomeDate').value = income.date;
            document.getElementById('incomeAmount').value = income.amount;
            document.getElementById('incomeSource').value = income.source;
            document.querySelector('#incomeForm button[type="submit"]').textContent = 'Update Income';
            
            // Scroll to form
            document.getElementById('incomeForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    cancelEditIncome() {
        this.editingIncome = null;
        document.getElementById('incomeForm').reset();
        this.setDefaultDates();
        document.querySelector('#incomeForm button[type="submit"]').textContent = 'Add Income';
    }

    deleteIncome(id) {
        if (confirm('Are you sure you want to delete this income?')) {
            this.income = this.income.filter(inc => inc.id !== id);
            this.saveToStorage('income', this.income);
            this.displayIncome();
            this.updateDashboard();
            this.showNotification('Income deleted successfully!', 'success');
        }
    }

    displayIncome() {
        const incomeList = document.getElementById('incomeList');
        
        if (this.income.length === 0) {
            incomeList.innerHTML = '<p class="empty-state">No income recorded</p>';
            return;
        }

        // Sort by date (newest first)
        const sortedIncome = [...this.income].sort((a, b) => new Date(b.date) - new Date(a.date));

        incomeList.innerHTML = sortedIncome.map(income => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${income.source}</h4>
                    <div class="transaction-meta">
                        <span>📅 ${this.formatDate(income.date)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="transaction-amount income">+$${income.amount.toFixed(2)}</span>
                    <div class="transaction-actions">
                        <button class="btn btn-edit" onclick="tracker.editIncome(${income.id})">Edit</button>
                        <button class="btn btn-danger" onclick="tracker.deleteIncome(${income.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Budget Methods
    handleBudgetSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        const period = document.getElementById('budgetPeriod').value;

        // Check if budget already exists for this category
        const existingIndex = this.budgets.findIndex(b => b.category === category && b.period === period);
        
        if (existingIndex !== -1) {
            // Update existing budget
            this.budgets[existingIndex].amount = amount;
            this.showNotification('Budget updated successfully!', 'success');
        } else {
            // Add new budget
            const budget = {
                id: Date.now(),
                category,
                amount,
                period
            };
            this.budgets.push(budget);
            this.showNotification('Budget added successfully!', 'success');
        }

        this.saveToStorage('budgets', this.budgets);
        
        e.target.reset();
        this.displayBudgets();
        this.updateDashboard();
    }

    deleteBudget(id) {
        if (confirm('Are you sure you want to delete this budget?')) {
            this.budgets = this.budgets.filter(b => b.id !== id);
            this.saveToStorage('budgets', this.budgets);
            this.displayBudgets();
            this.updateDashboard();
            this.showNotification('Budget deleted successfully!', 'success');
        }
    }

    displayBudgets() {
        const budgetList = document.getElementById('budgetList');
        
        if (this.budgets.length === 0) {
            budgetList.innerHTML = '<p class="empty-state">No budgets set. Create your first budget above.</p>';
            // Also update history dropdown
            document.getElementById('historyBudgetSelect').innerHTML = '<option value="">No budgets available</option>';
            return;
        }

        budgetList.innerHTML = this.budgets.map(budget => {
            const spent = this.calculateSpentForBudget(budget);
            const percentage = (spent / budget.amount) * 100;
            const status = percentage < 100 ? 'under' : percentage === 100 ? 'at' : 'over';
            const remaining = budget.amount - spent;

            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <h4>${this.getCategoryWithEmoji(budget.category)}</h4>
                        <span class="budget-period">${budget.period}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%">
                                ${percentage.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                    <div class="budget-stats">
                        <span>Spent: $${spent.toFixed(2)}</span>
                        <span>Budget: $${budget.amount.toFixed(2)}</span>
                        <span>Remaining: $${remaining.toFixed(2)}</span>
                    </div>
                    <div class="budget-actions">
                        <button class="btn btn-danger" onclick="tracker.deleteBudget(${budget.id})">Delete Budget</button>
                    </div>
                </div>
            `;
        }).join('');

        // Update history dropdown
        this.updateHistoryDropdown();
    }

    updateHistoryDropdown() {
        const select = document.getElementById('historyBudgetSelect');
        select.innerHTML = '<option value="">Choose a budget...</option>' +
            this.budgets.map(budget =>
                `<option value="${budget.id}">${this.getCategoryWithEmoji(budget.category)} (${budget.period})</option>`
            ).join('');
    }

    viewBudgetHistory() {
        const selectedBudgetId = parseInt(document.getElementById('historyBudgetSelect').value);
        const historyContainer = document.getElementById('budgetHistory');

        if (!selectedBudgetId) {
            historyContainer.innerHTML = '<p class="empty-state">Please select a budget to view history</p>';
            return;
        }

        const budget = this.budgets.find(b => b.id === selectedBudgetId);
        if (!budget) {
            historyContainer.innerHTML = '<p class="empty-state">Budget not found</p>';
            return;
        }

        // Calculate history for past periods
        const history = this.calculateBudgetHistory(budget);

        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">No historical data available yet</p>';
            return;
        }

        historyContainer.innerHTML = `
            <div style="background: white; border-radius: 10px; padding: 20px;">
                <h3 style="margin-bottom: 20px;">${this.getCategoryWithEmoji(budget.category)} - ${budget.period} Budget History</h3>
                <div style="display: grid; gap: 15px;">
                    ${history.map(period => {
                        const percentage = (period.spent / budget.amount) * 100;
                        const status = percentage < 100 ? 'under' : percentage === 100 ? 'at' : 'over';
                        const statusText = percentage < 100 ? 'Under Budget' : percentage === 100 ? 'At Budget' : 'Over Budget';
                        
                        return `
                            <div style="border: 2px solid #e9ecef; border-radius: 10px; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div>
                                        <strong>${period.label}</strong>
                                        <div style="font-size: 0.9rem; color: #999;">${period.dateRange}</div>
                                    </div>
                                    <span class="status-badge ${status}">${statusText}</span>
                                </div>
                                <div class="progress-bar" style="height: 25px; margin-bottom: 10px;">
                                    <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%">
                                        ${percentage.toFixed(0)}%
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
                                    <span>Spent: <strong>$${period.spent.toFixed(2)}</strong></span>
                                    <span>Budget: <strong>$${budget.amount.toFixed(2)}</strong></span>
                                    <span style="color: ${period.spent > budget.amount ? '#dc3545' : '#28a745'};">
                                        ${period.spent > budget.amount ? 'Over' : 'Under'}: <strong>$${Math.abs(budget.amount - period.spent).toFixed(2)}</strong>
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    calculateBudgetHistory(budget) {
        const history = [];
        const now = new Date();
        const periods = budget.period === 'daily' ? 7 : budget.period === 'weekly' ? 8 : 6; // Show last 7 days, 8 weeks, or 6 months

        for (let i = 1; i <= periods; i++) {
            let startDate, endDate, label, dateRange;

            if (budget.period === 'daily') {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
                label = i === 1 ? 'Yesterday' : `${i} days ago`;
                dateRange = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } else if (budget.period === 'weekly') {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (i * 7));
                startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
                const weekEnd = new Date(startDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                endDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);
                label = i === 1 ? 'Last Week' : `${i} weeks ago`;
                dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else { // monthly
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
                label = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                dateRange = label;
            }

            // Calculate spent for this period
            const parseLocalDate = (dateString) => {
                const [year, month, day] = dateString.split('-');
                return new Date(year, month - 1, day);
            };

            let spent;
            if (budget.category === 'Total') {
                spent = this.expenses
                    .filter(exp => {
                        const expDate = parseLocalDate(exp.date);
                        return expDate >= startDate && expDate <= endDate;
                    })
                    .reduce((sum, exp) => sum + exp.amount, 0);
            } else {
                spent = this.expenses
                    .filter(exp => {
                        const expDate = parseLocalDate(exp.date);
                        return exp.category === budget.category && expDate >= startDate && expDate <= endDate;
                    })
                    .reduce((sum, exp) => sum + exp.amount, 0);
            }

            history.push({ label, dateRange, spent });
        }

        return history.reverse(); // Show oldest first
    }

    calculateSpentForBudget(budget) {
        const now = new Date();
        let startDate;

        if (budget.period === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (budget.period === 'weekly') {
            const dayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);
        } else if (budget.period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Helper function to parse date string as local date
        const parseLocalDate = (dateString) => {
            const [year, month, day] = dateString.split('-');
            return new Date(year, month - 1, day);
        };

        // If category is "Total", sum all expenses in the period
        if (budget.category === 'Total') {
            return this.expenses
                .filter(exp => parseLocalDate(exp.date) >= startDate)
                .reduce((sum, exp) => sum + exp.amount, 0);
        }

        // Otherwise, filter by specific category
        return this.expenses
            .filter(exp => exp.category === budget.category && parseLocalDate(exp.date) >= startDate)
            .reduce((sum, exp) => sum + exp.amount, 0);
    }

    // Dashboard Methods
    setDashboardPeriod(period) {
        this.dashboardPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            }
        });
        
        // Update dashboard with filtered data
        this.updateDashboard();
    }

    getFilteredDataByPeriod() {
        if (this.dashboardPeriod === 'all') {
            return {
                expenses: this.expenses,
                income: this.income
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate;
        
        if (this.dashboardPeriod === 'today') {
            startDate = today;
        } else if (this.dashboardPeriod === 'week') {
            // Get start of week (Sunday)
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate.setHours(0, 0, 0, 0);
        } else if (this.dashboardPeriod === 'month') {
            // Get start of month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
        }

        // Helper function to parse date string in local timezone
        const parseLocalDate = (dateString) => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const filteredExpenses = this.expenses.filter(exp => {
            const expDate = parseLocalDate(exp.date);
            return expDate >= startDate;
        });

        // Income filtering logic based on period
        let filteredIncome;
        if (this.dashboardPeriod === 'month') {
            // For "This Month": Include all income entered in this month (no date shifting)
            filteredIncome = this.income.filter(inc => {
                const incDate = parseLocalDate(inc.date);
                return incDate >= startDate;
            });
        } else {
            // For "Today" and "This Week": Shift income forward by 7 days (counts for next week's spending)
            filteredIncome = this.income.filter(inc => {
                const incDate = parseLocalDate(inc.date);
                // Add 7 days to income date to count it for the following week
                const incDatePlusWeek = new Date(incDate);
                incDatePlusWeek.setDate(incDate.getDate() + 7);
                return incDatePlusWeek >= startDate;
            });
        }

        return {
            expenses: filteredExpenses,
            income: filteredIncome
        };
    }

    getPeriodLabel() {
        const labels = {
            'all': 'All time',
            'today': 'Today',
            'week': 'This week',
            'month': 'This month'
        };
        return labels[this.dashboardPeriod] || 'All time';
    }

    updateDashboard() {
        this.updateSummaryCards();
        this.updateBudgetStatus();
        this.updateCategoryBreakdown();
        this.updatePaymentMethodBreakdown();
        this.updateRecentTransactions();
    }

    updateSummaryCards() {
        const filtered = this.getFilteredDataByPeriod();
        
        // Income calculation logic:
        // - Today & This Week: Most recent income
        // - This Month & All Time: Sum of all income in period
        let totalIncome;
        let incomeLabel;
        
        if (this.dashboardPeriod === 'all' || this.dashboardPeriod === 'month') {
            // Sum all income for "All Time" and "This Month"
            totalIncome = filtered.income.reduce((sum, inc) => sum + inc.amount, 0);
            incomeLabel = this.getPeriodLabel();
        } else {
            // Get most recent income for "Today" and "This Week"
            if (filtered.income.length > 0) {
                const sortedIncome = [...filtered.income].sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
                totalIncome = sortedIncome[0].amount;
            } else {
                totalIncome = 0;
            }
            incomeLabel = 'Most recent';
        }
        
        const totalExpenses = filtered.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        const periodLabel = this.getPeriodLabel();

        document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `$${netBalance.toFixed(2)}`;
        
        document.getElementById('incomeLabel').textContent = incomeLabel;
        document.getElementById('expenseLabel').textContent = periodLabel;
        document.getElementById('balanceLabel').textContent = periodLabel;
    }

    updateBudgetStatus() {
        const container = document.getElementById('budgetStatusContainer');
        
        if (this.budgets.length === 0) {
            container.innerHTML = '<p class="empty-state">No budgets set. Go to Budget tab to create one.</p>';
            return;
        }

        container.innerHTML = this.budgets.map(budget => {
            const spent = this.calculateSpentForBudget(budget);
            const percentage = (spent / budget.amount) * 100;
            const status = percentage < 100 ? 'under' : percentage === 100 ? 'at' : 'over';
            const statusText = percentage < 100 ? 'Under Budget' : percentage === 100 ? 'At Budget' : 'Over Budget';

            return `
                <div class="budget-status-card ${status}">
                    <h4>${this.getCategoryWithEmoji(budget.category)}</h4>
                    <span class="status-badge ${status}">${statusText}</span>
                    <p style="margin: 10px 0; font-size: 0.9rem; color: #999;">${budget.period}</p>
                    <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">$${spent.toFixed(2)} / $${budget.amount.toFixed(2)}</p>
                    <div class="progress-bar" style="height: 10px;">
                        <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCategoryBreakdown() {
        const categoryTotals = {};
        let totalExpenses = 0;

        // Use filtered expenses based on dashboard period
        const filtered = this.getFilteredDataByPeriod();
        
        // Normalize categories by removing emojis before grouping
        filtered.expenses.forEach(exp => {
            const normalizedCategory = this.getCategoryWithoutEmoji(exp.category);
            categoryTotals[normalizedCategory] = (categoryTotals[normalizedCategory] || 0) + exp.amount;
            totalExpenses += exp.amount;
        });

        const categories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: (amount / totalExpenses) * 100
            }));

        // Update pie chart
        this.updatePieChart(categories);

        // Update category list
        const listContainer = document.getElementById('categoryBreakdownList');
        
        if (categories.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No expenses to display</p>';
            return;
        }

        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'];

        listContainer.innerHTML = categories.map((cat, index) => `
            <div class="breakdown-item">
                <div class="breakdown-label">
                    <div class="color-dot" style="background: ${colors[index % colors.length]}"></div>
                    <span>${this.getCategoryWithEmoji(cat.category)}</span>
                </div>
                <div class="breakdown-value">
                    <div class="amount">$${cat.amount.toFixed(2)}</div>
                    <div class="percentage">${cat.percentage.toFixed(1)}%</div>
                </div>
            </div>
        `).join('');
    }

    updatePieChart(categories) {
        const canvas = document.getElementById('categoryPieChart');
        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        if (categories.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'];

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories.map(c => this.getCategoryWithEmoji(c.category)),
                datasets: [{
                    data: categories.map(c => c.amount),
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / categories.reduce((sum, c) => sum + c.amount, 0)) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updatePaymentMethodBreakdown() {
        const methodTotals = {};
        let totalExpenses = 0;

        // Use filtered expenses based on dashboard period
        const filtered = this.getFilteredDataByPeriod();
        
        filtered.expenses.forEach(exp => {
            methodTotals[exp.paymentMethod] = (methodTotals[exp.paymentMethod] || 0) + exp.amount;
            totalExpenses += exp.amount;
        });

        const methods = Object.entries(methodTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([method, amount]) => ({
                method,
                amount,
                percentage: (amount / totalExpenses) * 100
            }));

        const container = document.getElementById('paymentMethodBreakdown');
        
        if (methods.length === 0) {
            container.innerHTML = '<p class="empty-state">No expenses to display</p>';
            return;
        }

        container.innerHTML = methods.map(m => `
            <div class="breakdown-item">
                <div class="breakdown-label">
                    <span>${this.getPaymentMethodWithEmoji(m.method)}</span>
                </div>
                <div class="breakdown-value">
                    <div class="amount">$${m.amount.toFixed(2)}</div>
                    <div class="percentage">${m.percentage.toFixed(1)}%</div>
                </div>
            </div>
        `).join('');
    }

    updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        
        // Use filtered data based on dashboard period
        const filtered = this.getFilteredDataByPeriod();
        
        // Combine expenses and income
        const allTransactions = [
            ...filtered.expenses.map(exp => ({ ...exp, type: 'expense' })),
            ...filtered.income.map(inc => ({ ...inc, type: 'income' }))
        ];

        // Sort by date (newest first) and take top 5
        const recent = allTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }

        container.innerHTML = recent.map(trans => {
            if (trans.type === 'expense') {
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <h4>${trans.description}</h4>
                            <div class="transaction-meta">
                                <span>📅 ${this.formatDate(trans.date)}</span>
                                <span>${this.getCategoryWithEmoji(trans.category)}</span>
                            </div>
                        </div>
                        <span class="transaction-amount expense">-$${trans.amount.toFixed(2)}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <h4>${trans.source}</h4>
                            <div class="transaction-meta">
                                <span>📅 ${this.formatDate(trans.date)}</span>
                            </div>
                        </div>
                        <span class="transaction-amount income">+$${trans.amount.toFixed(2)}</span>
                    </div>
                `;
            }
        }).join('');
    }

    // Filter Methods
    applyFilters() {
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;
        const category = document.getElementById('filterCategory').value;
        const paymentMethod = document.getElementById('filterPaymentMethod').value;

        let filtered = [...this.expenses];

        if (startDate) {
            filtered = filtered.filter(exp => exp.date >= startDate);
        }

        if (endDate) {
            filtered = filtered.filter(exp => exp.date <= endDate);
        }

        if (category) {
            filtered = filtered.filter(exp => exp.category === category);
        }

        if (paymentMethod) {
            filtered = filtered.filter(exp => exp.paymentMethod === paymentMethod);
        }

        this.displayExpenses(filtered);
    }

    clearFilters() {
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterPaymentMethod').value = '';
        this.displayExpenses();
    }

    // Utility Methods
    formatDate(dateString) {
        // Parse date as local time to avoid timezone issues
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type) {
        // Simple notification - you can enhance this
        alert(message);

    // AI Methods
    saveApiKey() {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        if (!apiKey) {
            this.showAiStatus('Please enter an API key', 'error');
            return;
        }
        
        this.geminiApiKey = apiKey;
        this.saveToStorage('geminiApiKey', apiKey);
        this.showAiStatus('✅ API key saved successfully!', 'success');
        
        // Load the key into the input field
        document.getElementById('geminiApiKey').value = apiKey;
    }

    async testAiConnection() {
        if (!this.geminiApiKey) {
            this.showAiStatus('Please save your API key first', 'error');
            return;
        }

        this.showAiStatus('🔄 Testing connection...', 'info');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Hello'
                        }]
                    }]
                })
            });

            if (response.ok) {
                this.showAiStatus('✅ Connection successful! AI is ready to use.', 'success');
            } else {
                const error = await response.json();
                this.showAiStatus(`❌ Connection failed: ${error.error?.message || 'Invalid API key'}`, 'error');
            }
        } catch (error) {
            this.showAiStatus(`❌ Connection failed: ${error.message}`, 'error');
        }
    }

    async suggestCategory() {
        const description = document.getElementById('expenseDescription').value.trim();
        
        if (!description) {
            alert('Please enter a description first');
            return;
        }

        if (!this.geminiApiKey) {
            alert('Please configure your Gemini API key in Settings first');
            return;
        }

        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Thinking...';
        button.disabled = true;

        try {
            const categories = ['Food', 'Entertainment', 'Groceries', 'Transportation', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Miscellaneous'];
            
            const prompt = `You are a financial categorization assistant. Based on the expense description, suggest the most appropriate category.

Expense description: "${description}"

Available categories: ${categories.join(', ')}

Respond with ONLY the category name, nothing else. Choose the single most appropriate category.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('AI request failed');
            }

            const data = await response.json();
            const suggestedCategory = data.candidates[0].content.parts[0].text.trim();
            
            // Validate the category
            if (categories.includes(suggestedCategory)) {
                document.getElementById('expenseCategory').value = suggestedCategory;
                alert(`✨ AI suggests: ${suggestedCategory}`);
            } else {
                // Try to find a partial match
                const match = categories.find(cat => suggestedCategory.toLowerCase().includes(cat.toLowerCase()));
                if (match) {
                    document.getElementById('expenseCategory').value = match;
                    alert(`✨ AI suggests: ${match}`);
                } else {
                    alert('AI could not determine a category. Please select manually.');
                }
            }
        } catch (error) {
            alert('Failed to get AI suggestion. Please check your API key in Settings.');
            console.error('AI Error:', error);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    showAiStatus(message, type) {
        const statusDiv = document.getElementById('aiStatus');
        statusDiv.style.display = 'block';
        statusDiv.textContent = message;
        
        // Set colors based on type
        if (type === 'success') {
            statusDiv.style.background = 'rgba(81, 207, 102, 0.3)';
            statusDiv.style.border = '1px solid rgba(81, 207, 102, 0.5)';
            statusDiv.style.color = 'white';
        } else if (type === 'error') {
            statusDiv.style.background = 'rgba(255, 107, 107, 0.3)';
            statusDiv.style.border = '1px solid rgba(255, 107, 107, 0.5)';
            statusDiv.style.color = 'white';
        } else {
            statusDiv.style.background = 'rgba(255, 193, 7, 0.3)';
            statusDiv.style.border = '1px solid rgba(255, 193, 7, 0.5)';
            statusDiv.style.color = 'white';
        }
    }
    }
}

// Initialize the app
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new BudgetExpenseTracker();
});

// Made with Bob
