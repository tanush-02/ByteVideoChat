import httpStatus from "http-status";
import { Finance } from "../models/finance.model.js";
import { User } from "../models/user.model.js";

// Get or create finance record for user
const getFinanceRecord = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        
        if (!financeRecord) {
            financeRecord = new Finance({
                userId: user.username,
                savings: { total: 0, accounts: [] },
                investments: { total: 0, stocks: [], mutualFunds: [], otherInvestments: [] },
                transactions: [],
                sipPlans: []
            });
            await financeRecord.save();
        }

        return res.status(httpStatus.OK).json(financeRecord);
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Update finance record
const updateFinanceRecord = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        // Update fields if provided
        const updateFields = ['savings', 'investments', 'transactions', 'sipPlans'];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                financeRecord[field] = req.body[field];
            }
        });

        // Recalculate totals
        if (financeRecord.savings.accounts) {
            financeRecord.savings.total = financeRecord.savings.accounts.reduce(
                (sum, acc) => sum + (acc.balance || 0), 0
            );
        }

        if (financeRecord.investments) {
            const stocksTotal = (financeRecord.investments.stocks || []).reduce(
                (sum, stock) => sum + (stock.currentValue || stock.totalInvested || 0), 0
            );
            const mfTotal = (financeRecord.investments.mutualFunds || []).reduce(
                (sum, mf) => sum + (mf.currentValue || mf.amount || 0), 0
            );
            const otherTotal = (financeRecord.investments.otherInvestments || []).reduce(
                (sum, inv) => sum + (inv.currentValue || inv.amount || 0), 0
            );
            financeRecord.investments.total = stocksTotal + mfTotal + otherTotal;
        }

        await financeRecord.save();
        return res.status(httpStatus.OK).json({ message: "Finance record updated", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add transaction
const addTransaction = async (req, res) => {
    const { token, transaction } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        financeRecord.transactions.unshift(transaction); // Add to beginning
        await financeRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Transaction added", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add savings account
const addSavingsAccount = async (req, res) => {
    const { token, account } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        financeRecord.savings.accounts.push(account);
        financeRecord.savings.total = financeRecord.savings.accounts.reduce(
            (sum, acc) => sum + (acc.balance || 0), 0
        );
        await financeRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Savings account added", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add stock investment
const addStock = async (req, res) => {
    const { token, stock } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        financeRecord.investments.stocks.push(stock);
        // Recalculate investments total
        const stocksTotal = financeRecord.investments.stocks.reduce(
            (sum, s) => sum + (s.currentValue || s.totalInvested || 0), 0
        );
        const mfTotal = (financeRecord.investments.mutualFunds || []).reduce(
            (sum, mf) => sum + (mf.currentValue || mf.amount || 0), 0
        );
        const otherTotal = (financeRecord.investments.otherInvestments || []).reduce(
            (sum, inv) => sum + (inv.currentValue || inv.amount || 0), 0
        );
        financeRecord.investments.total = stocksTotal + mfTotal + otherTotal;
        await financeRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Stock added", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add mutual fund
const addMutualFund = async (req, res) => {
    const { token, mutualFund } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        financeRecord.investments.mutualFunds.push(mutualFund);
        // Recalculate investments total
        const stocksTotal = (financeRecord.investments.stocks || []).reduce(
            (sum, s) => sum + (s.currentValue || s.totalInvested || 0), 0
        );
        const mfTotal = financeRecord.investments.mutualFunds.reduce(
            (sum, mf) => sum + (mf.currentValue || mf.amount || 0), 0
        );
        const otherTotal = (financeRecord.investments.otherInvestments || []).reduce(
            (sum, inv) => sum + (inv.currentValue || inv.amount || 0), 0
        );
        financeRecord.investments.total = stocksTotal + mfTotal + otherTotal;
        await financeRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Mutual fund added", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add SIP plan
const addSIPPlan = async (req, res) => {
    const { token, sipPlan } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            financeRecord = new Finance({ userId: user.username });
        }

        financeRecord.sipPlans.push(sipPlan);
        await financeRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "SIP plan added", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Delete item from array
const deleteItem = async (req, res) => {
    const { token, category, itemId } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const financeRecord = await Finance.findOne({ userId: user.username });
        if (!financeRecord) {
            return res.status(404).json({ message: "Finance record not found" });
        }

        const validCategories = ['transactions', 'sipPlans'];
        const nestedCategories = {
            'savingsAccounts': 'savings.accounts',
            'stocks': 'investments.stocks',
            'mutualFunds': 'investments.mutualFunds',
            'otherInvestments': 'investments.otherInvestments'
        };

        if (validCategories.includes(category)) {
            financeRecord[category] = financeRecord[category].filter(
                item => item._id.toString() !== itemId
            );
        } else if (nestedCategories[category]) {
            const path = nestedCategories[category].split('.');
            financeRecord[path[0]][path[1]] = financeRecord[path[0]][path[1]].filter(
                item => item._id.toString() !== itemId
            );
            // Recalculate totals
            if (category === 'savingsAccounts') {
                financeRecord.savings.total = financeRecord.savings.accounts.reduce(
                    (sum, acc) => sum + (acc.balance || 0), 0
                );
            } else if (category === 'stocks' || category === 'mutualFunds' || category === 'otherInvestments') {
                const stocksTotal = (financeRecord.investments.stocks || []).reduce(
                    (sum, s) => sum + (s.currentValue || s.totalInvested || 0), 0
                );
                const mfTotal = (financeRecord.investments.mutualFunds || []).reduce(
                    (sum, mf) => sum + (mf.currentValue || mf.amount || 0), 0
                );
                const otherTotal = (financeRecord.investments.otherInvestments || []).reduce(
                    (sum, inv) => sum + (inv.currentValue || inv.amount || 0), 0
                );
                financeRecord.investments.total = stocksTotal + mfTotal + otherTotal;
            }
        } else {
            return res.status(400).json({ message: "Invalid category" });
        }

        await financeRecord.save();
        return res.status(httpStatus.OK).json({ message: "Item deleted", data: financeRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { 
    getFinanceRecord, 
    updateFinanceRecord, 
    addTransaction, 
    addSavingsAccount, 
    addStock, 
    addMutualFund,
    addSIPPlan,
    deleteItem
};

