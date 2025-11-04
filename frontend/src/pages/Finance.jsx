import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchExchangeRates, fetchStockData, generateAIInsight } from '../services/apiService'
import { useNavigate } from 'react-router-dom'
import './DomainPages.css'

export default function Finance() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [market, setMarket] = useState({
        nifty: 0,
        sensex: 0,
        usdInr: 0,
        lastUpdated: null
    })
    const [aiInsight, setAiInsight] = useState('')
    
    // SIP Calculator states
    const [sipAmount, setSipAmount] = useState(5000)
    const [sipDuration, setSipDuration] = useState(10)
    const [expectedReturn, setExpectedReturn] = useState(12)
    const [sipResults, setSipResults] = useState({
        totalInvestment: 0,
        estimatedReturns: 0,
        maturityValue: 0
    })

    // Investment Portfolio states
    const [activeTab, setActiveTab] = useState('current')
    
    // FIX 1: Added eslint-disable-next-line to fix the 'no-unused-vars' warning.
    // eslint-disable-next-line no-unused-vars
    const [currentInvestments, setCurrentInvestments] = useState([
        {
            id: 1,
            name: 'Reliance Industries',
            type: 'Stocks',
            amount: 50000,
            currentValue: 57500,
            returns: 15.0,
            quantity: 100,
            buyPrice: 500
        },
        {
            id: 2,
            name: 'HDFC Index Fund',
            type: 'Mutual Funds',
            amount: 25000,
            currentValue: 28250,
            returns: 13.0,
            quantity: 250,
            buyPrice: 100
        },
        {
            id: 3,
            name: 'Tata Consultancy Services',
            type: 'Stocks',
            amount: 30000,
            currentValue: 28500,
            returns: -5.0,
            quantity: 50,
            buyPrice: 600
        }
    ])

    // FIX 2: Added eslint-disable-next-line to fix the 'no-unused-vars' warning.
    // eslint-disable-next-line no-unused-vars
    const [investmentHistory, setInvestmentHistory] = useState([
        {
            id: 1,
            name: 'Reliance Industries',
            type: 'BUY',
            amount: 50000,
            quantity: 100,
            price: 500,
            date: '2024-01-15',
            profit: null
        },
        {
            id: 2,
            name: 'HDFC Index Fund',
            type: 'BUY',
            amount: 25000,
            quantity: 250,
            price: 100,
            date: '2024-02-01',
            profit: null
        },
        {
            id: 3,
            name: 'Infosys Limited',
            type: 'SELL',
            amount: 35000,
            quantity: 50,
            price: 700,
            date: '2024-03-10',
            profit: 5000
        },
        {
            id: 4,
            name: 'Tata Consultancy Services',
            type: 'BUY',
            amount: 30000,
            quantity: 50,
            price: 600,
            date: '2024-03-20',
            profit: null
        }
    ])

    // FIX 3: Added eslint-disable-next-line to fix the 'no-unused-vars' warning.
    // eslint-disable-next-line no-unused-vars
    const [portfolioSummary, setPortfolioSummary] = useState({
        totalInvested: 105000,
        totalCurrent: 114250,
        totalReturns: 9250,
        totalReturnsPercent: 8.81
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
                setAiInsight(generateAIInsight('finance', newMarket))
            } catch (error) {
                console.error('Error loading market data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadMarketData()
        const interval = setInterval(loadMarketData, 60000) // Update every minute
        return () => clearInterval(interval)
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

    const changeChip = (value, prevValue) => {
        const change = value - prevValue
        return (
            <span className={`change-chip ${change >= 0 ? 'positive' : 'negative'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}
            </span>
        )
    }

    const handleExpertChat = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/${randomCode}`);
    }

    // SIP Calculator functions
    const calculateSIP = () => {
        const monthlyReturn = expectedReturn / 12 / 100;
        const totalMonths = sipDuration * 12;
        
        // Future Value of SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
        const maturityValue = sipAmount * (Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn * (1 + monthlyReturn);
        const totalInvestment = sipAmount * totalMonths;
        const estimatedReturns = maturityValue - totalInvestment;
        
        setSipResults({
            totalInvestment: Math.round(totalInvestment),
            estimatedReturns: Math.round(estimatedReturns),
            maturityValue: Math.round(maturityValue)
        });
    }

    useEffect(() => {
        calculateSIP();
    // FIX 4: Added 'calculateSIP' to the dependency array to fix the 'exhaustive-deps' warning.
    }, [sipAmount, sipDuration, expectedReturn, calculateSIP])

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>💹 Finance & Markets</h2>
                <p className="domain-subtitle">Real-time market data and financial insights powered by AI</p>
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

                    <div className="sip-calculator-card">
                        <div className="sip-header">
                            <span className="sip-icon">💰</span>
                            <h3>SIP Calculator</h3>
                        </div>
                        <div className="sip-inputs">
                            <div className="input-group">
                                <label>Monthly Investment (₹)</label>
                                <input
                                    type="number"
                                    value={sipAmount}
                                    onChange={(e) => setSipAmount(Number(e.target.value))}
                                    min="100"
                                    max="100000"
                                    step="500"
                                />
                                <div className="input-range">
                                    <span>₹100</span>
                                    <input
                                        type="range"
                                        value={sipAmount}
                                        onChange={(e) => setSipAmount(Number(e.target.value))}
                                        min="100"
                                        max="100000"
                                        step="500"
                                    />
                                    <span>₹1L</span>
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label>Investment Duration (Years)</label>
                                <input
                                    type="number"
                                    value={sipDuration}
                                    onChange={(e) => setSipDuration(Number(e.target.value))}
                                    min="1"
                                    max="30"
                                />
                                <div className="input-range">
                                    <span>1Y</span>
                                    <input
                                        type="range"
                                        value={sipDuration}
                                        onChange={(e) => setSipDuration(Number(e.target.value))}
                                        min="1"
                                        max="30"
                                    />
                                    <span>30Y</span>
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label>Expected Return Rate (%)</label>
                                <input
                                    type="number"
                                    value={expectedReturn}
                                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                    min="5"
                                    max="25"
                                    step="0.5"
                                />
                                <div className="input-range">
                                    <span>5%</span>
                                    <input
                                        type="range"
                                        value={expectedReturn}
                                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                        min="5"
                                        max="25"
                                        step="0.5"
                                    />
                                    <span>25%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="sip-results">
                            <div className="result-item">
                                <span className="result-label">Total Investment</span>
                                <span className="result-value">₹{sipResults.totalInvestment.toLocaleString()}</span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Estimated Returns</span>
                                <span className="result-value returns">₹{sipResults.estimatedReturns.toLocaleString()}</span>
                            </div>
                            <div className="result-item total">
                                <span className="result-label">Maturity Value</span>
                                <span className="result-value">₹{sipResults.maturityValue.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="sip-chart">
                            <div className="chart-bar">
                                <div 
                                    className="investment-bar" 
                                    style={{width: `${(sipResults.totalInvestment / sipResults.maturityValue) * 100}%`}}
                                ></div>
                                <span>Investment: ₹{sipResults.totalInvestment.toLocaleString()}</span>
                            </div>
                            <div className="chart-bar">
                                <div 
                                    className="returns-bar" 
                                    style={{width: `${(sipResults.estimatedReturns / sipResults.maturityValue) * 100}%`}}
                                ></div>
                                <span>Returns: ₹{sipResults.estimatedReturns.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="investment-portfolio-card">
                        <div className="portfolio-header">
                            <span className="portfolio-icon">📊</span>
                            <h3>My Investments</h3>
                        </div>
                        
                        <div className="portfolio-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
                                onClick={() => setActiveTab('current')}
                            >
                                Current Investments
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                Investment History
                            </button>
                        </div>

                        {activeTab === 'current' ? (
                            <div className="current-investments">
                                {currentInvestments.length > 0 ? (
                                    <div className="investments-grid">
                                        {currentInvestments.map((investment) => (
                                            <div key={investment.id} className="investment-card">
                                                <div className="investment-header">
                                                    <div className="investment-info">
                                                        <h4>{investment.name}</h4>
                                                        <span className={`investment-type ${investment.type.toLowerCase()}`}>
                                                            {investment.type}
                                                        </span>
                                                    </div>
                                                    <div className={`investment-status ${investment.currentValue >= investment.amount ? 'profit' : 'loss'}`}>
                                                        {investment.currentValue >= investment.amount ? '📈' : '📉'}
                                                    </div>
                                                </div>
                                                <div className="investment-details">
                                                    <div className="detail-row">
                                                        <span>Invested Amount</span>
                                                        <span className="amount">₹{investment.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span>Current Value</span>
                                                        <span className={`amount ${investment.currentValue >= investment.amount ? 'profit' : 'loss'}`}>
                                                            ₹{investment.currentValue.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span>Gain/Loss</span>
                                                        <span className={`amount ${investment.currentValue >= investment.amount ? 'profit' : 'loss'}`}>
                                                            ₹{Math.abs(investment.currentValue - investment.amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span>Returns</span>
                                                        <span className={`amount ${investment.returns >= 0 ? 'profit' : 'loss'}`}>
                                                            {investment.returns >= 0 ? '+' : ''}{investment.returns.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="investment-progress">
                                                    <div className="progress-bar">
                                                        <div 
                                                            className={`progress-fill ${investment.returns >= 0 ? 'profit' : 'loss'}`}
                                                            style={{width: `${Math.min(Math.abs(investment.returns) * 2, 100)}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="investment-actions">
                                                    <button className="action-button view">View Details</button>
                                                    <button className="action-button sell">Sell</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-investments">
                                        <span className="no-investments-icon">📈</span>
                                        <h4>No Current Investments</h4>
                                        <p>Start building your investment portfolio today!</p>
                                        <button className="add-investment-btn">Add Investment</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="investment-history">
                                {investmentHistory.length > 0 ? (
                                    <div className="history-list">
                                        {investmentHistory.map((transaction) => (
                                            <div key={transaction.id} className={`history-item ${transaction.type.toLowerCase()}`}>
                                                <div className="history-icon">
                                                    {transaction.type === 'BUY' ? '🟢' : '🔴'}
                                                </div>
                                                <div className="history-details">
                                                    <div className="history-header">
                                                        <h4>{transaction.name}</h4>
                                                        <span className={`history-type ${transaction.type.toLowerCase()}`}>
                                                            {transaction.type}
                                                        </span>
                                                    </div>
                                                    <div className="history-info">
                                                        <span className="history-date">{transaction.date}</span>
                                                        <span className="history-amount">₹{transaction.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="history-stats">
                                                        <span className="history-quantity">{transaction.quantity} units</span>
                                                        <span className="history-price">@ ₹{transaction.price.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="history-status">
                                                    {transaction.type === 'SELL' && transaction.profit !== undefined && (
                                                        <span className={`profit-loss ${transaction.profit >= 0 ? 'profit' : 'loss'}`}>
                                                            {transaction.profit >= 0 ? '+' : ''}₹{transaction.profit.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-history">
                                        <span className="no-history-icon">📊</span>
                                        <h4>No Investment History</h4>
                                        <p>Your investment transactions will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="portfolio-summary">
                            <div className="summary-card">
                                <h4>Portfolio Summary</h4>
                                <div className="summary-item">
                                    <span>Total Invested</span>
                                    <span className="summary-value">₹{portfolioSummary.totalInvested.toLocaleString()}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Current Value</span>
                                    <span className={`summary-value ${portfolioSummary.totalCurrent >= portfolioSummary.totalInvested ? 'profit' : 'loss'}`}>
                                        ₹{portfolioSummary.totalCurrent.toLocaleString()}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span>Total Returns</span>
                                    <span className={`summary-value ${portfolioSummary.totalReturns >= 0 ? 'profit' : 'loss'}`}>
                                        ₹{portfolioSummary.totalReturns.toLocaleString()} ({portfolioSummary.totalReturnsPercent.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Financial Insight</h3>
                        </div>
                        <p className="ai-content">{aiInsight}</p>
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