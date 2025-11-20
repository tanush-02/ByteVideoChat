import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchWeatherData, fetchTravelInfo } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import './DomainPages.css'

export default function Travelling() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [weather, setWeather] = useState({
        temp: null,
        condition: '',
        humidity: null,
        windSpeed: null,
        lastUpdated: null
    })
    const [travelInfo, setTravelInfo] = useState(null)
    const [aiInsight, setAiInsight] = useState('')
    const [city, setCity] = useState('Mumbai')

    useEffect(() => {
        const loadTravelData = async () => {
            setLoading(true)
            try {
                const [weatherData, travelData] = await Promise.all([
                    fetchWeatherData(city),
                    fetchTravelInfo('India')
                ])
                
                setWeather(weatherData)
                setTravelInfo(travelData)
                
                // Fetch AI insights from Gemini API (use 'travel' for backend)
                try {
                    const insight = await getDomainInsights('travelling', `Weather in ${city}: ${weatherData.temp}°C, ${weatherData.condition}, Wind: ${weatherData.windSpeed} km/h`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Providing travel recommendations and weather-based insights...')
                }
            } catch (error) {
                console.error('Error loading travel data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTravelData()
        const interval = setInterval(loadTravelData, 300000) // Update every 5 minutes
        return () => clearInterval(interval)
    }, [city])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('travelling')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    const handleExpertChat = () => {
        const randomCode = "Travelling";
        navigate(`/${randomCode}`);
    }

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>✈️ Travel & Weather</h2>
                <p className="domain-subtitle">Real-time weather data and travel insights powered by AI</p>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading weather and travel data...</p>
                </div>
            ) : (
                <>
                    <div className="city-selector">
                        <label>Select City:</label>
                        <select value={city} onChange={(e) => setCity(e.target.value)} className="city-select">
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Kolkata">Kolkata</option>
                            <option value="Hyderabad">Hyderabad</option>
                        </select>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card travel-card">
                            <div className="stat-icon">🌡️</div>
                            <h3>Temperature</h3>
                            <p className="stat-number">{weather.temp}°C</p>
                            <p className="stat-update">Updated: {weather.lastUpdated ? new Date(weather.lastUpdated).toLocaleTimeString() : 'Just now'}</p>
                        </div>
                        <div className="stat-card travel-card">
                            <div className="stat-icon">☁️</div>
                            <h3>Condition</h3>
                            <p className="stat-number">{weather.condition}</p>
                            <p className="stat-update">Live Weather Data</p>
                        </div>
                        <div className="stat-card travel-card">
                            <div className="stat-icon">💨</div>
                            <h3>Wind Speed</h3>
                            <p className="stat-number">{weather.windSpeed} km/h</p>
                            <p className="stat-update">Humidity: {weather.humidity}%</p>
                        </div>
                    </div>

                    {travelInfo && (
                        <div className="travel-info-card">
                            <h3>🌍 Travel Information</h3>
                            <div className="travel-details">
                                <p><strong>Country:</strong> {travelInfo.country}</p>
                                <p><strong>Capital:</strong> {travelInfo.capital}</p>
                                <p><strong>Currency:</strong> {travelInfo.currency}</p>
                                <p><strong>Timezone:</strong> {travelInfo.timezone}</p>
                            </div>
                        </div>
                    )}

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Travel Recommendation</h3>
                        </div>
                        <div className="ai-content">
                            <MarkdownRenderer content={aiInsight} />
                        </div>
                        <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                    </div>

                    <div className="expert-chat-card">
                        <div className="expert-header">
                            <span className="expert-icon">👨‍✈️</span>
                            <div>
                                <h3>Need Travel Planning Help?</h3>
                                <p>Connect with a travel expert for personalized itinerary and advice</p>
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
                <h3>💬 Travel Community</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No travel tips shared yet. Share your experience!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share a travel tip or ask a question..." 
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
                                localStorage.setItem('postLoginRedirect', `/#travelling`)
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
            await addComment('travelling', newComment)
            setNewComment('')
            const list = await getComments('travelling')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }
}
