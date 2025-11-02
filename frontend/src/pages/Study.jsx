import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchStudyTips, fetchEducationalContent, generateAIInsight } from '../services/apiService'
import { useNavigate } from 'react-router-dom'
import './DomainPages.css'

export default function Study() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [studyTip, setStudyTip] = useState('')
    const [educationalContent, setEducationalContent] = useState(null)
    const [aiInsight, setAiInsight] = useState('')

    useEffect(() => {
        const loadStudyData = async () => {
            setLoading(true)
            try {
                const [tip, content] = await Promise.all([
                    fetchStudyTips(),
                    fetchEducationalContent('learning')
                ])
                
                setStudyTip(tip)
                setEducationalContent(content)
                setAiInsight(generateAIInsight('study', {}))
            } catch (error) {
                console.error('Error loading study data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadStudyData()
        const interval = setInterval(loadStudyData, 300000) // Update every 5 minutes
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('study')
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
                <h2>📚 Study & Learning</h2>
                <p className="domain-subtitle">AI-powered learning strategies and educational resources</p>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading learning resources...</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card study-card">
                            <div className="stat-icon">🎯</div>
                            <h3>Study Tip of the Day</h3>
                            <p className="stat-content">{studyTip}</p>
                            <p className="stat-update">Updated: {new Date().toLocaleTimeString()}</p>
                        </div>
                        <div className="stat-card study-card">
                            <div className="stat-icon">📖</div>
                            <h3>Learning Resource</h3>
                            <p className="stat-content">
                                {educationalContent?.summary || 'Explore new topics and expand your knowledge'}
                            </p>
                            {educationalContent?.url && (
                                <a href={educationalContent.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                    Learn More →
                                </a>
                            )}
                        </div>
                        <div className="stat-card study-card">
                            <div className="stat-icon">⏱️</div>
                            <h3>Pomodoro Timer</h3>
                            <p className="stat-content">Use the 25-5 technique: Focus for 25 minutes, then take a 5-minute break</p>
                            <p className="stat-update">Recommended Technique</p>
                        </div>
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Learning Insight</h3>
                        </div>
                        <p className="ai-content">{aiInsight}</p>
                        <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                    </div>

                    <div className="expert-chat-card">
                        <div className="expert-header">
                            <span className="expert-icon">👨‍🏫</span>
                            <div>
                                <h3>Need Learning Support?</h3>
                                <p>Connect with an educational expert for personalized guidance</p>
                            </div>
                        </div>
                        <button className="expert-button" onClick={handleExpertChat}>
                            <span>📹</span>
                            Start Video Tutoring Session
                        </button>
                    </div>
                </>
            )}

            <div className="community-section">
                <h3>💬 Study Community</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No discussions yet. Share your learning experience!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share a study tip or ask a question..." 
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
                                localStorage.setItem('postLoginRedirect', `/#study`)
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
            await addComment('study', newComment)
            setNewComment('')
            const list = await getComments('study')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }
}
