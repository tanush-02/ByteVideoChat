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
