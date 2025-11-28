import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchExchangeRates, fetchStockData } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { 
    getFinanceData, 
    addTransaction, 
    addStock, 
    addSavingsAccount, 
    addMutualFund,
    addSIPPlan,
    deleteFinanceItem,
    calculateSIP
} from '../services/financeService'
import './DomainPages.css'
import './Finance.css'

export default function Finance() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [financeLoading, setFinanceLoading] = useState(true)
    const [market, setMarket] = useState({
        nifty: 0,
        sensex: 0,
        usdInr: 0,
        lastUpdated: null
    })
    const [aiInsight, setAiInsight] = useState('')
    const [financeData, setFinanceData] = useState(null)
    const [activeTab, setActiveTab] = useState('overview')
    
    // SIP Calculator state
    const [sipInputs, setSipInputs] = useState({
        monthlyAmount: 5000,
        annualReturn: 12,
        years: 10
    })
    const [sipResult, setSipResult] = useState(null)
    
    // Form states
    const [showAddTransaction, setShowAddTransaction] = useState(false)
    const [showAddStock, setShowAddStock] = useState(false)
    const [showAddSavings, setShowAddSavings] = useState(false)
    const [newTransaction, setNewTransaction] = useState({
        type: 'Expense',
        category: '',
        amount: '',
        description: '',
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0]
    })
    const [newStock, setNewStock] = useState({
        symbol: '',
        name: '',
        quantity: '',
        buyPrice: '',
        currentPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
    })
    const [newSavings, setNewSavings] = useState({
        name: '',
        type: 'Savings',
        balance: '',
        bank: '',
        accountNumber: '',
        interestRate: ''
    })

    useEffect(() => {
        const loadMarketData = async () => {
            setLoading(true)
            try {
                const [exchangeData, stockData] = await Promise.all([
                    fetchExchangeRates(),
                    fetchStockData()
                ])
                
                const newMarket = {
                    nifty: Math.round(stockData.nifty),
                    sensex: Math.round(stockData.sensex),
                    usdInr: parseFloat(exchangeData.usdInr.toFixed(3)),
                    lastUpdated: new Date()
                }
                
                setMarket(newMarket)
                
                try {
                    const insight = await getDomainInsights('finance', `Current market data: NIFTY ${newMarket.nifty}, SENSEX ${newMarket.sensex}, USD/INR ${newMarket.usdInr}`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Analyzing market trends and providing financial recommendations...')
                }
            } catch (error) {
                console.error('Error loading market data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadMarketData()
        const interval = setInterval(loadMarketData, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const loadFinanceData = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                setFinanceLoading(false)
                return
            }
            
            try {
                const data = await getFinanceData(token)
                setFinanceData(data)
            } catch (error) {
                console.error('Error loading finance data:', error)
            } finally {
                setFinanceLoading(false)
            }
        }
        
        loadFinanceData()
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('finance')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    useEffect(() => {
        if (sipInputs.monthlyAmount && sipInputs.annualReturn && sipInputs.years) {
            const result = calculateSIP(
                parseFloat(sipInputs.monthlyAmount),
                parseFloat(sipInputs.annualReturn),
                parseFloat(sipInputs.years)
            )
            setSipResult(result)
        }
    }, [sipInputs])

    const changeChip = (value, prevValue) => {
        const change = value - prevValue
        return (
            <span className={`change-chip ${change >= 0 ? 'positive' : 'negative'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}
            </span>
        )
    }

    const handleExpertChat = () => {
        const randomCode = "Finance";
        navigate(`/${randomCode}`);
    }

    const handleAddTransaction = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            alert("Please login to add transactions")
            return
        }
        
        try {
            await addTransaction(token, {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
                date: new Date(newTransaction.date)
            })
            const data = await getFinanceData(token)
            setFinanceData(data)
            setShowAddTransaction(false)
            setNewTransaction({
                type: 'Expense',
                category: '',
                amount: '',
                description: '',
                paymentMethod: 'UPI',
                date: new Date().toISOString().split('T')[0]
            })
        } catch (error) {
            console.error("Error adding transaction:", error)
            alert("Failed to add transaction")
        }
    }

    const handleAddStock = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            alert("Please login to add stocks")
            return
        }

        if (!newStock.symbol || !newStock.name || !newStock.quantity || !newStock.buyPrice) {
            alert("Please fill in all required fields for the stock")
            return
        }
        
        try {
            const stock = {
                symbol: newStock.symbol.toUpperCase(),
                name: newStock.name,
                quantity: parseFloat(newStock.quantity),
                buyPrice: parseFloat(newStock.buyPrice),
                currentPrice: parseFloat(newStock.currentPrice || newStock.buyPrice),
                totalInvested: parseFloat(newStock.quantity) * parseFloat(newStock.buyPrice),
                currentValue: parseFloat(newStock.quantity) * parseFloat(newStock.currentPrice || newStock.buyPrice),
                purchaseDate: newStock.purchaseDate ? new Date(newStock.purchaseDate) : new Date(),
                notes: newStock.notes?.trim() || ''
            }
            stock.profitLoss = stock.currentValue - stock.totalInvested
            stock.profitLossPercent = (stock.profitLoss / stock.totalInvested) * 100
            
            await addStock(token, stock)
            const data = await getFinanceData(token)
            setFinanceData(data)
            setShowAddStock(false)
            setNewStock({
                symbol: '',
                name: '',
                quantity: '',
                buyPrice: '',
                currentPrice: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                notes: ''
            })
        } catch (error) {
            console.error("Error adding stock:", error)
            alert("Failed to add stock")
        }
    }

    const handleAddSavings = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            alert("Please login to add savings account")
            return
        }
        
        try {
            await addSavingsAccount(token, {
                ...newSavings,
                balance: parseFloat(newSavings.balance),
                interestRate: parseFloat(newSavings.interestRate || 0)
            })
            const data = await getFinanceData(token)
            setFinanceData(data)
            setShowAddSavings(false)
            setNewSavings({
                name: '',
                type: 'Savings',
                balance: '',
                bank: '',
                accountNumber: '',
                interestRate: ''
            })
        } catch (error) {
            console.error("Error adding savings account:", error)
            alert("Failed to add savings account")
        }
    }

    const handleDeleteItem = async (category, itemId) => {
        const token = localStorage.getItem("token")
        if (!token) return
        
        if (!window.confirm("Are you sure you want to delete this item?")) return
        
        try {
            await deleteFinanceItem(token, category, itemId)
            const data = await getFinanceData(token)
            setFinanceData(data)
        } catch (error) {
            console.error("Error deleting item:", error)
            alert("Failed to delete item")
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>💹 Finance & Markets</h2>
                <p className="domain-subtitle">Real-time market data, SIP calculator, portfolio tracking, and financial insights</p>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading real-time market data...</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card finance-card">
                            <div className="stat-header">
                                <h3>NIFTY 50</h3>
                                <span className="live-badge">LIVE</span>
                            </div>
                            <p className="stat-number">{market.nifty.toLocaleString()}</p>
                            {changeChip(market.nifty, 22450)}
                            <p className="stat-update">Updated: {market.lastUpdated?.toLocaleTimeString()}</p>
                        </div>
                        <div className="stat-card finance-card">
                            <div className="stat-header">
                                <h3>SENSEX</h3>
                                <span className="live-badge">LIVE</span>
                            </div>
                            <p className="stat-number">{market.sensex.toLocaleString()}</p>
                            {changeChip(market.sensex, 74320)}
                            <p className="stat-update">Updated: {market.lastUpdated?.toLocaleTimeString()}</p>
                        </div>
                        <div className="stat-card finance-card">
                            <div className="stat-header">
                                <h3>USD/INR</h3>
                                <span className="live-badge">LIVE</span>
                            </div>
                            <p className="stat-number">{market.usdInr}</p>
                            {changeChip(market.usdInr, 83.1)}
                            <p className="stat-update">Updated: {market.lastUpdated?.toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="finance-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            📊 Overview
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'sip' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sip')}
                        >
                            💰 SIP Calculator
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'stocks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stocks')}
                        >
                            📈 Stocks
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('transactions')}
                        >
                            💳 Transactions
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'savings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('savings')}
                        >
                            🏦 Savings & Investments
                        </button>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            {financeData && (
                                <div className="summary-cards">
                                    <div className="summary-card">
                                        <h3>Total Savings</h3>
                                        <p className="summary-amount">{formatCurrency(financeData.savings?.total || 0)}</p>
                                        <span className="summary-label">{financeData.savings?.accounts?.length || 0} Accounts</span>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Investments</h3>
                                        <p className="summary-amount">{formatCurrency(financeData.investments?.total || 0)}</p>
                                        <span className="summary-label">
                                            {((financeData.investments?.stocks?.length || 0) + 
                                              (financeData.investments?.mutualFunds?.length || 0) + 
                                              (financeData.investments?.otherInvestments?.length || 0))} Holdings
                                        </span>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Net Worth</h3>
                                        <p className="summary-amount">
                                            {formatCurrency((financeData.savings?.total || 0) + (financeData.investments?.total || 0))}
                                        </p>
                                        <span className="summary-label">Combined Assets</span>
                                    </div>
                                </div>
                            )}

                            <div className="ai-insight-card">
                                <div className="ai-header">
                                    <span className="ai-icon">🤖</span>
                                    <h3>AI Financial Insight</h3>
                                </div>
                                <div className="ai-content">
                                    <MarkdownRenderer content={aiInsight} />
                                </div>
                                <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                            </div>

                            <div className="expert-chat-card">
                                <div className="expert-header">
                                    <span className="expert-icon">👨‍💼</span>
                                    <div>
                                        <h3>Need Expert Advice?</h3>
                                        <p>Connect with a financial expert for personalized guidance</p>
                                    </div>
                                </div>
                                <button className="expert-button" onClick={handleExpertChat}>
                                    <span>📹</span>
                                    Start Video Chat with Expert
                                </button>
                            </div>
                        </>
                    )}

                    {/* SIP Calculator Tab */}
                    {activeTab === 'sip' && (
                        <div className="sip-calculator-card">
                            <h3>💰 SIP Calculator</h3>
                            <p className="sip-description">Calculate your potential returns from Systematic Investment Plans</p>
                            
                            <div className="sip-inputs">
                                <div className="sip-input-group">
                                    <label>Monthly Investment (₹)</label>
                                    <input
                                        type="number"
                                        value={sipInputs.monthlyAmount}
                                        onChange={(e) => setSipInputs({...sipInputs, monthlyAmount: e.target.value})}
                                        min="100"
                                        step="100"
                                    />
                                </div>
                                <div className="sip-input-group">
                                    <label>Expected Annual Return (%)</label>
                                    <input
                                        type="number"
                                        value={sipInputs.annualReturn}
                                        onChange={(e) => setSipInputs({...sipInputs, annualReturn: e.target.value})}
                                        min="1"
                                        max="30"
                                        step="0.1"
                                    />
                                </div>
                                <div className="sip-input-group">
                                    <label>Investment Period (Years)</label>
                                    <input
                                        type="number"
                                        value={sipInputs.years}
                                        onChange={(e) => setSipInputs({...sipInputs, years: e.target.value})}
                                        min="1"
                                        max="50"
                                        step="1"
                                    />
                                </div>
                            </div>

                            {sipResult && (
                                <div className="sip-results">
                                    <div className="sip-result-item">
                                        <span className="result-label">Total Invested</span>
                                        <span className="result-value">{formatCurrency(sipResult.totalInvested)}</span>
                                    </div>
                                    <div className="sip-result-item">
                                        <span className="result-label">Estimated Returns</span>
                                        <span className="result-value positive">{formatCurrency(sipResult.returns)}</span>
                                    </div>
                                    <div className="sip-result-item highlight">
                                        <span className="result-label">Maturity Value</span>
                                        <span className="result-value">{formatCurrency(sipResult.futureValue)}</span>
                                    </div>
                                    <div className="sip-result-item">
                                        <span className="result-label">Return Percentage</span>
                                        <span className="result-value positive">{sipResult.returnPercentage}%</span>
                                    </div>
                                </div>
                            )}

                            {localStorage.getItem("token") && (
                                <button 
                                    className="save-sip-button"
                                    onClick={async () => {
                                        const token = localStorage.getItem("token")
                                        try {
                                            await addSIPPlan(token, {
                                                name: `SIP - ${sipInputs.monthlyAmount}/month @ ${sipInputs.annualReturn}%`,
                                                amount: parseFloat(sipInputs.monthlyAmount),
                                                frequency: 'Monthly',
                                                startDate: new Date(),
                                                isActive: true,
                                                totalInvested: sipResult.totalInvested,
                                                currentValue: sipResult.futureValue
                                            })
                                            alert("SIP plan saved!")
                                            const data = await getFinanceData(token)
                                            setFinanceData(data)
                                        } catch (error) {
                                            alert("Failed to save SIP plan")
                                        }
                                    }}
                                >
                                    💾 Save SIP Plan
                                </button>
                            )}
                        </div>
                    )}

                    {/* Stocks Tab */}
                    {activeTab === 'stocks' && (
                        <div className="stocks-section">
                            <div className="section-header">
                                <h3>📈 Stock Portfolio</h3>
                                {localStorage.getItem("token") && (
                                    <button className="add-button" onClick={() => setShowAddStock(true)}>
                                        + Add Stock
                                    </button>
                                )}
                            </div>

                            {showAddStock && (
                                <div className="add-form-card">
                                    <h4>Add New Stock</h4>
                                    <div className="form-grid">
                                        <input
                                            type="text"
                                            placeholder="Symbol (e.g., RELIANCE)"
                                            value={newStock.symbol}
                                            onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Company Name"
                                            value={newStock.name}
                                            onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Quantity"
                                            value={newStock.quantity}
                                            onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Buy Price (₹)"
                                            value={newStock.buyPrice}
                                            onChange={(e) => setNewStock({...newStock, buyPrice: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Current Price (₹) - Optional"
                                            value={newStock.currentPrice}
                                            onChange={(e) => setNewStock({...newStock, currentPrice: e.target.value})}
                                        />
                                        <input
                                            type="date"
                                            placeholder="Purchase Date"
                                            value={newStock.purchaseDate}
                                            onChange={(e) => setNewStock({...newStock, purchaseDate: e.target.value})}
                                        />
                                        <textarea
                                            placeholder="Notes (optional)"
                                            value={newStock.notes}
                                            onChange={(e) => setNewStock({...newStock, notes: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="submit-button" onClick={handleAddStock}>Add Stock</button>
                                        <button className="cancel-button" onClick={() => setShowAddStock(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            {financeLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading portfolio...</p>
                                </div>
                            ) : financeData?.investments?.stocks?.length > 0 ? (
                                <div className="stocks-grid">
                                    {financeData.investments.stocks.map((stock) => (
                                        <div key={stock._id} className="stock-card">
                                            <div className="stock-header">
                                                <div>
                                                    <h4>{stock.symbol}</h4>
                                                    <p>{stock.name}</p>
                                                </div>
                                                <button 
                                                    className="delete-button"
                                                    onClick={() => handleDeleteItem('stocks', stock._id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="stock-details">
                                                <div className="stock-detail-item">
                                                    <span>Quantity:</span>
                                                    <span>{stock.quantity}</span>
                                                </div>
                                                <div className="stock-detail-item">
                                                    <span>Buy Price:</span>
                                                    <span>{formatCurrency(stock.buyPrice)}</span>
                                                </div>
                                                <div className="stock-detail-item">
                                                    <span>Current Price:</span>
                                                    <span>{formatCurrency(stock.currentPrice || stock.buyPrice)}</span>
                                                </div>
                                                <div className="stock-detail-item">
                                                    <span>Invested:</span>
                                                    <span>{formatCurrency(stock.totalInvested)}</span>
                                                </div>
                                                <div className="stock-detail-item">
                                                    <span>Current Value:</span>
                                                    <span>{formatCurrency(stock.currentValue || stock.totalInvested)}</span>
                                                </div>
                                                <div className={`stock-detail-item ${stock.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                                                    <span>P&L:</span>
                                                    <span>
                                                        {formatCurrency(stock.profitLoss || 0)} 
                                                        ({stock.profitLossPercent?.toFixed(2) || 0}%)
                                                    </span>
                                                </div>
                                                <div className="stock-detail-item">
                                                    <span>Purchased On:</span>
                                                    <span>{formatDate(stock.purchaseDate || stock.createdAt)}</span>
                                                </div>
                                                {stock.notes && (
                                                    <div className="stock-notes">
                                                        <span>Notes:</span>
                                                        <p>{stock.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No stocks in your portfolio yet. Add your first stock to get started!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="transactions-section">
                            <div className="section-header">
                                <h3>💳 Transaction History</h3>
                                {localStorage.getItem("token") && (
                                    <button className="add-button" onClick={() => setShowAddTransaction(true)}>
                                        + Add Transaction
                                    </button>
                                )}
                            </div>

                            {showAddTransaction && (
                                <div className="add-form-card">
                                    <h4>Add New Transaction</h4>
                                    <div className="form-grid">
                                        <select
                                            value={newTransaction.type}
                                            onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                                        >
                                            <option value="Income">Income</option>
                                            <option value="Expense">Expense</option>
                                            <option value="Investment">Investment</option>
                                            <option value="Withdrawal">Withdrawal</option>
                                            <option value="Transfer">Transfer</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Category"
                                            value={newTransaction.category}
                                            onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount (₹)"
                                            value={newTransaction.amount}
                                            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={newTransaction.description}
                                            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                                        />
                                        <select
                                            value={newTransaction.paymentMethod}
                                            onChange={(e) => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={newTransaction.date}
                                            onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="submit-button" onClick={handleAddTransaction}>Add Transaction</button>
                                        <button className="cancel-button" onClick={() => setShowAddTransaction(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            {financeLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading transactions...</p>
                                </div>
                            ) : financeData?.transactions?.length > 0 ? (
                                <div className="transactions-list">
                                    {financeData.transactions.map((transaction) => (
                                        <div key={transaction._id} className="transaction-item">
                                            <div className="transaction-icon">
                                                {transaction.type === 'Income' ? '💰' : 
                                                 transaction.type === 'Expense' ? '💸' : 
                                                 transaction.type === 'Investment' ? '📈' : '💳'}
                                            </div>
                                            <div className="transaction-details">
                                                <div className="transaction-main">
                                                    <h4>{transaction.category}</h4>
                                                    <p className={`transaction-amount ${transaction.type === 'Income' ? 'positive' : 'negative'}`}>
                                                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                    </p>
                                                </div>
                                                <div className="transaction-meta">
                                                    <span>{transaction.description || 'No description'}</span>
                                                    <span>{formatDate(transaction.date)}</span>
                                                    <span>{transaction.paymentMethod}</span>
                                                </div>
                                            </div>
                                            <button 
                                                className="delete-button"
                                                onClick={() => handleDeleteItem('transactions', transaction._id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No transactions yet. Add your first transaction to start tracking!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Savings & Investments Tab */}
                    {activeTab === 'savings' && (
                        <div className="savings-section">
                            <div className="section-header">
                                <h3>🏦 Savings & Investments</h3>
                                {localStorage.getItem("token") && (
                                    <button className="add-button" onClick={() => setShowAddSavings(true)}>
                                        + Add Account
                                    </button>
                                )}
                            </div>

                            {showAddSavings && (
                                <div className="add-form-card">
                                    <h4>Add Savings Account</h4>
                                    <div className="form-grid">
                                        <input
                                            type="text"
                                            placeholder="Account Name"
                                            value={newSavings.name}
                                            onChange={(e) => setNewSavings({...newSavings, name: e.target.value})}
                                        />
                                        <select
                                            value={newSavings.type}
                                            onChange={(e) => setNewSavings({...newSavings, type: e.target.value})}
                                        >
                                            <option value="Savings">Savings</option>
                                            <option value="Current">Current</option>
                                            <option value="Fixed Deposit">Fixed Deposit</option>
                                            <option value="Recurring Deposit">Recurring Deposit</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Balance (₹)"
                                            value={newSavings.balance}
                                            onChange={(e) => setNewSavings({...newSavings, balance: e.target.value})}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Bank Name"
                                            value={newSavings.bank}
                                            onChange={(e) => setNewSavings({...newSavings, bank: e.target.value})}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Account Number (Optional)"
                                            value={newSavings.accountNumber}
                                            onChange={(e) => setNewSavings({...newSavings, accountNumber: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Interest Rate (%)"
                                            value={newSavings.interestRate}
                                            onChange={(e) => setNewSavings({...newSavings, interestRate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="submit-button" onClick={handleAddSavings}>Add Account</button>
                                        <button className="cancel-button" onClick={() => setShowAddSavings(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            {financeLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading savings...</p>
                                </div>
                            ) : (
                                <>
                                    {financeData?.savings?.accounts?.length > 0 && (
                                        <div className="savings-accounts">
                                            <h4>Savings Accounts</h4>
                                            <div className="accounts-grid">
                                                {financeData.savings.accounts.map((account) => (
                                                    <div key={account._id} className="account-card">
                                                        <div className="account-header">
                                                            <h5>{account.name}</h5>
                                                            <button 
                                                                className="delete-button"
                                                                onClick={() => handleDeleteItem('savingsAccounts', account._id)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        <p className="account-balance">{formatCurrency(account.balance)}</p>
                                                        <div className="account-details">
                                                            <span>{account.type}</span>
                                                            {account.bank && <span>{account.bank}</span>}
                                                            {account.interestRate > 0 && <span>{account.interestRate}% p.a.</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {financeData?.investments?.mutualFunds?.length > 0 && (
                                        <div className="mutual-funds">
                                            <h4>Mutual Funds</h4>
                                            <div className="investments-grid">
                                                {financeData.investments.mutualFunds.map((mf) => (
                                                    <div key={mf._id} className="investment-card">
                                                        <h5>{mf.name}</h5>
                                                        <p className="investment-amount">{formatCurrency(mf.currentValue || mf.amount)}</p>
                                                        <div className="investment-details">
                                                            <span>{mf.type}</span>
                                                            {mf.isSIP && <span className="sip-badge">SIP</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {financeData?.sipPlans?.length > 0 && (
                                        <div className="sip-plans">
                                            <h4>Active SIP Plans</h4>
                                            <div className="sip-plans-grid">
                                                {financeData.sipPlans.filter(sip => sip.isActive).map((sip) => (
                                                    <div key={sip._id} className="sip-plan-card">
                                                        <h5>{sip.name}</h5>
                                                        <p className="sip-amount">{formatCurrency(sip.amount)}/{sip.frequency}</p>
                                                        <div className="sip-details">
                                                            <span>Started: {formatDate(sip.startDate)}</span>
                                                            <span>Total: {formatCurrency(sip.totalInvested)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(!financeData?.savings?.accounts?.length && 
                                      !financeData?.investments?.mutualFunds?.length && 
                                      !financeData?.sipPlans?.length) && (
                                        <div className="empty-state">
                                            <p>No savings accounts or investments yet. Add your first account to get started!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="community-section">
                <h3>💬 Community Insights</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No insights shared yet. Be the first!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share your financial insight..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && newComment.trim()) {
                                    handlePostComment()
                                }
                            }}
                        />
                        <button className="post-button" onClick={handlePostComment} disabled={!newComment.trim()}>
                            Post
                        </button>
                    </div>
                ) : (
                    <div className="login-prompt">
                        <p>You need to be logged in to share insights</p>
                        <button 
                            className="login-button" 
                            onClick={() => {
                                localStorage.setItem('postLoginRedirect', `/#finance`)
                                window.location.href = '/auth'
                            }}
                        >
                            Login to Comment
                        </button>
                    </div>
                )}
            </div>
        </div>
    )

    async function handlePostComment() {
        if (!newComment.trim()) return
        try {
            await addComment('finance', newComment)
            setNewComment('')
            const list = await getComments('finance')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }
}
