import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchHealthTips, fetchHealthNews, generateAIInsight, fetchLiveHealthMetrics, fetchMedicationReminders } from '../services/apiService'
import { useNavigate } from 'react-router-dom'
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
    const [healthMetrics, setHealthMetrics] = useState(null)
    const [medicationReminders, setMedicationReminders] = useState([])
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const loadHealthData = async () => {
            setLoading(true)
            try {
                const [tip, news, metrics, medications] = await Promise.all([
                    fetchHealthTips(),
                    fetchHealthNews(),
                    fetchLiveHealthMetrics(),
                    fetchMedicationReminders()
                ])
                
                setHealthTip(tip)
                setHealthNews(news)
                setHealthMetrics(metrics)
                setMedicationReminders(medications)
                setAiInsight(generateAIInsight('healthcare', metrics))
            } catch (error) {
                console.error('Error loading health data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadHealthData()
        const interval = setInterval(loadHealthData, 30000) // Update every 30 seconds for live data
        
        // Update current time every second for medication reminders
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
        
        return () => {
            clearInterval(interval)
            clearInterval(timeInterval)
        }
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

    const toggleMedicationTaken = async (index) => {
        const updatedMedications = [...medicationReminders]
        updatedMedications[index].taken = !updatedMedications[index].taken
        setMedicationReminders(updatedMedications)
        
        // In a real app, this would sync with backend
        // For now, we'll just update the local state
    }

    const getNextMedication = () => {
        if (!medicationReminders.length) return null
        
        const now = currentTime
        const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
        
        return medicationReminders.find(med => med.time > currentTimeStr && !med.taken) || null
    }

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

                    <div className="contentSection">
                        <h2>Live Health Metrics</h2>
                        {healthMetrics && (
                            <div className="healthMetrics">
                                <div className="metricCard">
                                    <div className="metricIcon">❤️</div>
                                    <div className="metricValue">{healthMetrics.heartRate} BPM</div>
                                    <div className="metricLabel">Heart Rate</div>
                                    <div className="metricStatus">
                                        {healthMetrics.heartRate >= 60 && healthMetrics.heartRate <= 100 ? 'Normal' : 'Check Required'}
                                    </div>
                                </div>
                                
                                <div className="metricCard">
                                    <div className="metricIcon">🩺</div>
                                    <div className="metricValue">
                                        {healthMetrics.bloodPressure.systolic}/{healthMetrics.bloodPressure.diastolic}
                                    </div>
                                    <div className="metricLabel">Blood Pressure</div>
                                    <div className="metricStatus">
                                        {healthMetrics.bloodPressure.systolic < 120 && healthMetrics.bloodPressure.diastolic < 80 ? 'Normal' : 'Monitor'}
                                    </div>
                                </div>
                                
                                <div className="metricCard">
                                    <div className="metricIcon">💨</div>
                                    <div className="metricValue">{healthMetrics.oxygenSaturation}%</div>
                                    <div className="metricLabel">Oxygen Saturation</div>
                                    <div className="metricStatus">
                                        {healthMetrics.oxygenSaturation >= 95 ? 'Excellent' : 'Low'}
                                    </div>
                                </div>
                                
                                <div className="metricCard">
                                    <div className="metricIcon">🌡️</div>
                                    <div className="metricValue">{healthMetrics.bodyTemperature}°C</div>
                                    <div className="metricLabel">Body Temperature</div>
                                    <div className="metricStatus">
                                        {healthMetrics.bodyTemperature >= 36.1 && healthMetrics.bodyTemperature <= 37.2 ? 'Normal' : 'Check Required'}
                                    </div>
                                </div>
                                
                                <div className="metricCard">
                                    <div className="metricIcon">🚶</div>
                                    <div className="metricValue">{healthMetrics.stepsToday.toLocaleString()}</div>
                                    <div className="metricLabel">Steps Today</div>
                                    <div className="metricStatus">
                                        {healthMetrics.stepsToday >= 10000 ? 'Goal Met!' : `${Math.round((healthMetrics.stepsToday/10000)*100)}%`}
                                    </div>
                                </div>
                                
                                <div className="metricCard">
                                    <div className="metricIcon">😴</div>
                                    <div className="metricValue">{healthMetrics.sleepHours}h</div>
                                    <div className="metricLabel">Sleep Last Night</div>
                                    <div className="metricStatus">
                                        {healthMetrics.sleepHours >= 7 && healthMetrics.sleepHours <= 9 ? 'Good' : 'Needs Attention'}
                                    </div>
                                </div>
                                
                                <div className="overallStatus">
                                    <h3>Overall Health Status: {healthMetrics.healthStatus}</h3>
                                    <div className={`statusIndicator ${healthMetrics.healthStatus.toLowerCase().replace(' ', '')}`}></div>
                                </div>
                            </div>
                        )}
                        
                        {medicationReminders.length > 0 && (
                            <div className="medicationSection">
                                <h3>💊 Medication Reminders</h3>
                                <div className="medicationList">
                                    {medicationReminders.map((med, index) => {
                                        const isOverdue = med.time < currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')
                                        return (
                                            <div key={index} className={`medicationItem ${med.taken ? 'taken' : ''} ${isOverdue && !med.taken ? 'overdue' : ''}`}>
                                                <div className="medicationInfo">
                                                    <div className="medicationName">{med.name}</div>
                                                    <div className="medicationDosage">{med.dosage}</div>
                                                    <div className="medicationTime">{med.time}</div>
                                                </div>
                                                <button 
                                                    className={`takeButton ${med.taken ? 'takenButton' : ''}`}
                                                    onClick={() => toggleMedicationTaken(index)}
                                                >
                                                    {med.taken ? '✓ Taken' : 'Take Now'}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                {getNextMedication() && (
                                    <div className="nextMedication">
                                        <strong>Next medication:</strong> {getNextMedication().name} at {getNextMedication().time}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Health Recommendation</h3>
                        </div>
                        <p className="ai-content">{aiInsight}</p>
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
}
