import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchHealthTips, fetchHealthNews } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import './DomainPages.css'

export default function Healthcare() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [healthTip, setHealthTip] = useState('')
    const [healthNews, setHealthNews] = useState(null)
    const [aiInsight, setAiInsight] = useState('')

    useEffect(() => {
        const loadHealthData = async () => {
            setLoading(true)
            try {
                const [tip, news] = await Promise.all([
                    fetchHealthTips(),
                    fetchHealthNews()
                ])
                
                setHealthTip(tip)
                setHealthNews(news)
                
                // Fetch AI insights from Gemini API
                try {
                    const insight = await getDomainInsights('healthcare', `Health tip: ${tip}`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Providing healthcare recommendations and wellness strategies...')
                }
            } catch (error) {
                console.error('Error loading health data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadHealthData()
        const interval = setInterval(loadHealthData, 300000) // Update every 5 minutes
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('healthcare')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    const handleExpertChat = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/${randomCode}`);
    }

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>🩺 Healthcare & Wellness</h2>
                <p className="domain-subtitle">AI-powered health insights and wellness guidance</p>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading health insights...</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card health-card">
                            <div className="stat-icon">❤️</div>
                            <h3>Daily Wellness</h3>
                            <p className="stat-content">{healthTip}</p>
                            <p className="stat-update">Updated: {new Date().toLocaleTimeString()}</p>
                        </div>
                        <div className="stat-card health-card">
                            <div className="stat-icon">💡</div>
                            <h3>Health Tips</h3>
                            <p className="stat-content">Stay hydrated, get regular exercise, and maintain a balanced diet for optimal health.</p>
                            <p className="stat-update">Live Guidance</p>
                        </div>
                        <div className="stat-card health-card">
                            <div className="stat-icon">📊</div>
                            <h3>Wellness Metrics</h3>
                            <p className="stat-content">Track your daily activity, sleep quality, and hydration levels for better health outcomes.</p>
                            <p className="stat-update">AI Monitored</p>
                        </div>
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Health Recommendation</h3>
                        </div>
                        <div className="ai-content">
                            <MarkdownRenderer content={aiInsight} />
                        </div>
                        <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                    </div>

                    {healthNews && (
                        <div className="news-card">
                            <h3>📰 Latest Health Updates</h3>
                            <p>{healthNews.content}</p>
                            <span className="news-source">Source: {healthNews.source}</span>
                        </div>
                    )}

                    <div className="expert-chat-card">
                        <div className="expert-header">
                            <span className="expert-icon">👨‍⚕️</span>
                            <div>
                                <h3>Need Medical Advice?</h3>
                                <p>Connect with a healthcare expert for personalized consultation</p>
                            </div>
                        </div>
                        <button className="expert-button" onClick={handleExpertChat}>
                            <span>📹</span>
                            Start Video Consultation
                        </button>
                    </div>
                </>
            )}

            <div className="community-section">
                <h3>💬 Community Wellness</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No discussions yet. Start a conversation!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share your wellness tip or question..." 
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
                                localStorage.setItem('postLoginRedirect', `/#healthcare`)
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
            await addComment('healthcare', newComment)
            setNewComment('')
            const list = await getComments('healthcare')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }
}
