import mongoose, { Schema } from "mongoose";

const financeSchema = new Schema(
    {
        userId: { type: String, required: true },
        // Savings
        savings: {
            total: { type: Number, default: 0 },
            accounts: [{
                name: { type: String, required: true },
                type: { type: String, enum: ['Savings', 'Current', 'Fixed Deposit', 'Recurring Deposit'], default: 'Savings' },
                balance: { type: Number, default: 0 },
                bank: { type: String },
                accountNumber: { type: String },
                interestRate: { type: Number, default: 0 },
                createdAt: { type: Date, default: Date.now }
            }]
        },
        // Investments
        investments: {
            total: { type: Number, default: 0 },
            stocks: [{
                symbol: { type: String, required: true },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                buyPrice: { type: Number, required: true },
                currentPrice: { type: Number, default: 0 },
                totalInvested: { type: Number, required: true },
                currentValue: { type: Number, default: 0 },
                profitLoss: { type: Number, default: 0 },
                profitLossPercent: { type: Number, default: 0 },
                purchaseDate: { type: Date, default: Date.now },
                notes: { type: String }
            }],
            mutualFunds: [{
                name: { type: String, required: true },
                type: { type: String, enum: ['Equity', 'Debt', 'Hybrid', 'ELSS'], default: 'Equity' },
                amount: { type: Number, required: true },
                units: { type: Number, default: 0 },
                nav: { type: Number, default: 0 },
                currentValue: { type: Number, default: 0 },
                profitLoss: { type: Number, default: 0 },
                profitLossPercent: { type: Number, default: 0 },
                startDate: { type: Date, default: Date.now },
                sipAmount: { type: Number, default: 0 },
                isSIP: { type: Boolean, default: false },
                notes: { type: String }
            }],
            otherInvestments: [{
                name: { type: String, required: true },
                type: { type: String, enum: ['Gold', 'Real Estate', 'Bonds', 'Crypto', 'Other'], default: 'Other' },
                amount: { type: Number, required: true },
                currentValue: { type: Number, default: 0 },
                purchaseDate: { type: Date, default: Date.now },
                notes: { type: String }
            }]
        },
        // Transactions
        transactions: [{
            type: { type: String, enum: ['Income', 'Expense', 'Investment', 'Withdrawal', 'Transfer'], required: true },
            category: { type: String, required: true },
            amount: { type: Number, required: true },
            description: { type: String },
            date: { type: Date, default: Date.now },
            paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'], default: 'UPI' },
            tags: [{ type: String }],
            relatedInvestment: { type: String }, // Reference to investment ID if applicable
            createdAt: { type: Date, default: Date.now }
        }],
        // SIP Plans
        sipPlans: [{
            name: { type: String, required: true },
            amount: { type: Number, required: true },
            frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
            startDate: { type: Date, required: true },
            endDate: { type: Date },
            fundName: { type: String },
            isActive: { type: Boolean, default: true },
            totalInvested: { type: Number, default: 0 },
            currentValue: { type: Number, default: 0 },
            notes: { type: String }
        }]
    },
    { timestamps: true }
);

const Finance = mongoose.model("Finance", financeSchema);

export { Finance };

