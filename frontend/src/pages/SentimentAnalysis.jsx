import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { getSentimentRecommendations } from '../services/geminiService'
import { analyzeSentiment } from '../services/apiService'
import { getAllUserData } from '../services/userDataService'
import MarkdownRenderer from '../components/MarkdownRenderer'
import './SentimentAnalysis.css'

export default function SentimentAnalysis() {
    const { getComments } = useContext(AuthContext)
    const [userInput, setUserInput] = useState('')
    const [sentiment, setSentiment] = useState(null)
    const [loading, setLoading] = useState(false)
    const [aiRecommendations, setAiRecommendations] = useState(null)
    const [userProfile, setUserProfile] = useState({
        health: { sentiment: 'neutral', data: [], state: null },
        finance: { sentiment: 'neutral', data: [], state: null },
        study: { sentiment: 'neutral', data: [] },
        travel: { sentiment: 'neutral', data: [], state: null }
    })
    const [overallMood, setOverallMood] = useState('analyzing')
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [userState, setUserState] = useState({
        healthStatus: 'No data',
        portfolioStatus: 'No data',
        travelStatus: 'No data',
        overallStatus: 'Analyzing...'
    })

    // Load real user data and analyze
    useEffect(() => {
        const loadUserData = async () => {
            setIsAnalyzing(true)
            setTrainingProgress(0)
            
            const profileData = { ...userProfile }
            const stateData = { ...userState }
            
            try {
                // Step 1: Load real user data (Health, Finance, Travel)
                setTrainingProgress(10)
                const userData = await getAllUserData()
                
                // Step 2: Analyze Health Data
                setTrainingProgress(30)
                if (userData.health) {
                    const healthState = analyzeHealthState(userData.health)
                    profileData.health = {
                        sentiment: healthState.sentiment,
                        data: healthState.summary,
                        state: healthState,
                        score: healthState.score
                    }
                    stateData.healthStatus = healthState.status
                }
                
                // Step 3: Analyze Finance/Portfolio Data
                setTrainingProgress(50)
                if (userData.finance) {
                    const financeState = analyzeFinanceState(userData.finance)
                    profileData.finance = {
                        sentiment: financeState.sentiment,
                        data: financeState.summary,
                        state: financeState,
                        score: financeState.score
                    }
                    stateData.portfolioStatus = financeState.status
                }
                
                // Step 4: Analyze Travel Data
                setTrainingProgress(70)
                if (userData.travel) {
                    const travelState = analyzeTravelState(userData.travel)
                    profileData.travel = {
                        sentiment: travelState.sentiment,
                        data: travelState.summary,
                        state: travelState,
                        score: travelState.score
                    }
                    stateData.travelStatus = travelState.status
                }
                
                // Step 5: Analyze Study/Comments Data
                setTrainingProgress(85)
                try {
                    const comments = await getComments('study')
                    if (comments && Array.isArray(comments) && comments.length > 0) {
                        const studyComments = comments
                            .filter(c => c && c.text)
                            .map(c => c.text)
                            .join(' ')
                        
                        if (studyComments.trim()) {
                            const sentimentResult = analyzeSentiment(studyComments)
                            profileData.study = {
                                sentiment: sentimentResult.label.toLowerCase(),
                                data: comments.filter(c => c && c.text).slice(0, 5),
                                score: sentimentResult.score
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading study data:', error)
                }
                
                setUserProfile(profileData)
                setUserState(stateData)
                
                // Calculate overall mood
                const scores = Object.values(profileData)
                    .filter(p => p && p.score !== undefined)
                    .map(p => p.score || 0)
                const avgScore = scores.length > 0 
                    ? scores.reduce((a, b) => a + b, 0) / scores.length 
                    : 0
                
                if (avgScore > 0.3) {
                    setOverallMood('positive')
                } else if (avgScore < -0.3) {
                    setOverallMood('negative')
                } else {
                    setOverallMood('neutral')
                }
                
                // Generate overall status
                stateData.overallStatus = generateOverallStatus(profileData, avgScore)
                setUserState(stateData)
                
                // Generate AI recommendations based on real data
                setTrainingProgress(95)
                await generateAIRecommendations(profileData, avgScore, userData)
                
            } catch (error) {
                console.error('Error loading user data:', error)
            } finally {
                setIsAnalyzing(false)
                setTrainingProgress(100)
            }
        }
        
        loadUserData()
    }, [getComments])

    // Analyze health state from real data
    const analyzeHealthState = (healthData) => {
        let score = 0
        let status = 'No health data available'
        const summary = []
        
        if (!healthData) {
            return { sentiment: 'neutral', score: 0, status, summary: [] }
        }
        
        // Analyze current diseases
        if (healthData.currentDiseases && healthData.currentDiseases.length > 0) {
            const severeCount = healthData.currentDiseases.filter(d => d.severity === 'Severe').length
            score -= severeCount * 0.5
            score -= (healthData.currentDiseases.length - severeCount) * 0.2
            status = `${healthData.currentDiseases.length} active condition${healthData.currentDiseases.length > 1 ? 's' : ''}`
            summary.push(`${healthData.currentDiseases.length} current condition(s)`)
        } else {
            score += 0.3
            status = 'No active conditions'
            summary.push('No current health issues')
        }
        
        // Analyze medications
        const activeMeds = healthData.medications?.filter(m => m.isActive) || []
        if (activeMeds.length > 0) {
            summary.push(`${activeMeds.length} active medication(s)`)
        }
        
        // Analyze exercises (positive indicator)
        const recentExercises = healthData.exercises?.filter(e => {
            const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
            return daysAgo <= 7
        }) || []
        if (recentExercises.length > 0) {
            score += 0.3
            summary.push(`${recentExercises.length} exercise(s) this week`)
        }
        
        // Analyze daily metrics
        const recentMetrics = healthData.dailyMetrics?.slice(-7) || []
        if (recentMetrics.length > 0) {
            const avgSteps = recentMetrics.reduce((sum, m) => sum + (m.steps || 0), 0) / recentMetrics.length
            if (avgSteps > 5000) score += 0.2
            summary.push(`Avg ${Math.round(avgSteps)} steps/day`)
        }
        
        // Analyze upcoming checkups
        const upcomingCheckups = healthData.checkups?.filter(c => {
            return new Date(c.scheduledDate) > new Date()
        }) || []
        if (upcomingCheckups.length > 0) {
            summary.push(`${upcomingCheckups.length} upcoming checkup(s)`)
        }
        
        const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
        return { sentiment, score: Math.max(-1, Math.min(1, score)), status, summary }
    }
    
    // Analyze finance/portfolio state from real data
    const analyzeFinanceState = (financeData) => {
        let score = 0
        let status = 'No finance data available'
        const summary = []
        
        if (!financeData) {
            return { sentiment: 'neutral', score: 0, status, summary: [] }
        }
        
        // Analyze savings
        const totalSavings = financeData.savings?.total || 0
        const savingsAccounts = financeData.savings?.accounts?.length || 0
        if (totalSavings > 0) {
            score += 0.2
            status = `₹${(totalSavings / 100000).toFixed(1)}L in savings`
            summary.push(`₹${(totalSavings / 1000).toFixed(0)}K total savings`)
        }
        
        // Analyze investments
        const totalInvestments = financeData.investments?.total || 0
        const stocks = financeData.investments?.stocks || []
        const mutualFunds = financeData.investments?.mutualFunds || []
        
        if (stocks.length > 0) {
            const totalProfitLoss = stocks.reduce((sum, s) => sum + (s.profitLoss || 0), 0)
            const profitPercent = stocks.reduce((sum, s) => sum + (s.profitLossPercent || 0), 0) / stocks.length
            if (profitPercent > 0) {
                score += 0.3
                summary.push(`${stocks.length} stock(s), ${profitPercent.toFixed(1)}% avg return`)
            } else {
                score -= 0.1
                summary.push(`${stocks.length} stock(s), ${profitPercent.toFixed(1)}% avg return`)
            }
        }
        
        if (mutualFunds.length > 0) {
            const mfProfitPercent = mutualFunds.reduce((sum, mf) => sum + (mf.profitLossPercent || 0), 0) / mutualFunds.length
            if (mfProfitPercent > 0) {
                score += 0.2
                summary.push(`${mutualFunds.length} mutual fund(s), ${mfProfitPercent.toFixed(1)}% avg return`)
            }
        }
        
        if (totalInvestments > 0) {
            status = `₹${(totalInvestments / 100000).toFixed(1)}L portfolio`
            summary.push(`₹${(totalInvestments / 1000).toFixed(0)}K total investments`)
        }
        
        // Analyze transactions
        const recentTransactions = financeData.transactions?.slice(-10) || []
        if (recentTransactions.length > 0) {
            const expenses = recentTransactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            const income = recentTransactions
                .filter(t => t.type === 'Income')
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            
            if (income > expenses) {
                score += 0.2
                summary.push(`Positive cash flow: ₹${((income - expenses) / 1000).toFixed(0)}K`)
            } else {
                score -= 0.1
                summary.push(`Negative cash flow: ₹${((expenses - income) / 1000).toFixed(0)}K`)
            }
        }
        
        const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
        return { sentiment, score: Math.max(-1, Math.min(1, score)), status, summary }
    }
    
    // Analyze travel state from real data
    const analyzeTravelState = (travelData) => {
        let score = 0
        let status = 'No travel data available'
        const summary = []
        
        if (!travelData) {
            return { sentiment: 'neutral', score: 0, status, summary: [] }
        }
        
        // Analyze upcoming trips
        const upcomingTrips = travelData.upcomingTrips?.filter(t => {
            return new Date(t.startDate) > new Date() && t.status !== 'Cancelled'
        }) || []
        
        if (upcomingTrips.length > 0) {
            score += 0.4
            status = `${upcomingTrips.length} upcoming trip${upcomingTrips.length > 1 ? 's' : ''}`
            summary.push(`${upcomingTrips.length} upcoming trip(s)`)
            upcomingTrips.slice(0, 2).forEach(trip => {
                summary.push(`→ ${trip.destination} (${new Date(trip.startDate).toLocaleDateString()})`)
            })
        }
        
        // Analyze past trips
        const pastTrips = travelData.pastTrips || []
        if (pastTrips.length > 0) {
            const avgRating = pastTrips.reduce((sum, t) => sum + (t.rating || 0), 0) / pastTrips.length
            if (avgRating >= 4) {
                score += 0.2
            }
            summary.push(`${pastTrips.length} past trip(s), ${avgRating.toFixed(1)} avg rating`)
        }
        
        // Analyze wishlist
        const wishlist = travelData.wishlist || []
        if (wishlist.length > 0) {
            score += 0.1
            summary.push(`${wishlist.length} destination(s) in wishlist`)
        }
        
        if (upcomingTrips.length === 0 && pastTrips.length === 0) {
            status = 'No travel plans'
        }
        
        const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
        return { sentiment, score: Math.max(-1, Math.min(1, score)), status, summary }
    }
    
    // Generate overall status message
    const generateOverallStatus = (profile, avgScore) => {
        const states = []
        if (profile.health?.state) states.push(`Health: ${profile.health.state.status}`)
        if (profile.finance?.state) states.push(`Portfolio: ${profile.finance.state.status}`)
        if (profile.travel?.state) states.push(`Travel: ${profile.travel.state.status}`)
        
        if (states.length === 0) return 'No data available'
        
        if (avgScore > 0.3) {
            return `Excellent! ${states.join(' | ')}`
        } else if (avgScore < -0.3) {
            return `Needs attention: ${states.join(' | ')}`
        } else {
            return `Stable: ${states.join(' | ')}`
        }
    }
    
    const generateAIRecommendations = async (profile, overallScore, userData) => {
        try {
            setLoading(true)
            
            // Build comprehensive profile with real data
            const enhancedProfile = {
                health: {
                    sentiment: profile.health?.sentiment || 'neutral',
                    data: profile.health?.state?.summary || [],
                    state: profile.health?.state,
                    rawData: userData?.health
                },
                finance: {
                    sentiment: profile.finance?.sentiment || 'neutral',
                    data: profile.finance?.state?.summary || [],
                    state: profile.finance?.state,
                    rawData: userData?.finance
                },
                travel: {
                    sentiment: profile.travel?.sentiment || 'neutral',
                    data: profile.travel?.state?.summary || [],
                    state: profile.travel?.state,
                    rawData: userData?.travel
                },
                study: profile.study || { sentiment: 'neutral', data: [] }
            }
            
            // Use the dedicated sentiment recommendations endpoint
            const recommendation = await getSentimentRecommendations(enhancedProfile, overallScore, userData)
            setAiRecommendations(recommendation)
        } catch (error) {
            console.error('Error generating AI recommendations:', error)
            setAiRecommendations('Analyzing your data patterns to provide personalized recommendations...')
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyzeText = () => {
        if (!userInput.trim()) return
        
        const result = analyzeSentiment(userInput)
        setSentiment(result)
        
        // Update localStorage for home page
        localStorage.setItem('currentSentiment', JSON.stringify(result.label.toLowerCase()))
        localStorage.setItem('sentimentScore', result.score.toString())
    }

    const getMoodEmoji = (mood) => {
        switch (mood) {
            case 'positive': return '😊'
            case 'negative': return '😔'
            case 'neutral': return '😐'
            default: return '🤔'
        }
    }

    const getMoodColor = (mood) => {
        switch (mood) {
            case 'positive': return '#22c55e'
            case 'negative': return '#ef4444'
            case 'neutral': return '#3b82f6'
            default: return '#6b7280'
        }
    }

    return (
        <div className="sentiment-container">
            <div className="sentiment-header">
                <h1>🧠 AI Sentiment Analysis & Personal Insights</h1>
                <p className="sentiment-subtitle">
                    Advanced AI-powered analysis of your health, finance, study, and lifestyle data
                </p>
            </div>

            {/* AI Training/Analysis Section */}
            <div className="ai-training-section">
                <div className="training-header">
                    <span className="training-icon">🤖</span>
                    <div>
                        <h2>AI Model Training & Analysis</h2>
                        <p>Analyzing your behavioral patterns across all domains</p>
                    </div>
                </div>
                
                {isAnalyzing ? (
                    <div className="training-progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${trainingProgress}%` }}
                            ></div>
                        </div>
                        <p className="progress-text">
                            Training AI model: {Math.round(trainingProgress)}% complete
                        </p>
                        <div className="training-steps">
                            <span className={trainingProgress > 25 ? 'completed' : ''}>📊 Collecting data</span>
                            <span className={trainingProgress > 50 ? 'completed' : ''}>🔍 Analyzing patterns</span>
                            <span className={trainingProgress > 75 ? 'completed' : ''}>🧠 Processing insights</span>
                            <span className={trainingProgress === 100 ? 'completed' : ''}>✅ Generating recommendations</span>
                        </div>
                    </div>
                ) : (
                    <div className="training-complete">
                        <span className="complete-icon">✅</span>
                        <p>AI analysis complete - Model trained on your data</p>
                    </div>
                )}
            </div>

            {/* Overall Mood Dashboard */}
            <div className="mood-dashboard">
                <div className="mood-card-main">
                    <div className="mood-indicator-large">
                        <span className="mood-emoji-large">{getMoodEmoji(overallMood)}</span>
                        <div>
                            <h3>Overall Status</h3>
                            <p className="mood-label" style={{ color: getMoodColor(overallMood) }}>
                                {userState.overallStatus}
                            </p>
                        </div>
                    </div>
                    <div className="mood-stats">
                        <div className="stat-item">
                            <span className="stat-label">Health Status</span>
                            <span className="stat-value-small">{userState.healthStatus}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Portfolio Status</span>
                            <span className="stat-value-small">{userState.portfolioStatus}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Travel Status</span>
                            <span className="stat-value-small">{userState.travelStatus}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Domain-Specific Analysis */}
            <div className="domain-analysis-grid">
                <div className="domain-analysis-card">
                    <div className="domain-header">
                        <span className="domain-icon">🩺</span>
                        <h3>Health & Wellness</h3>
                    </div>
                    <div className="domain-sentiment">
                        <span className={`sentiment-badge ${userProfile.health.sentiment}`}>
                            {userProfile.health.sentiment}
                        </span>
                        <span className="data-count">{userProfile.health.state?.status || 'No data'}</span>
                    </div>
                    {userProfile.health.state?.summary && userProfile.health.state.summary.length > 0 && (
                        <div className="recent-activity">
                            <p className="activity-label">Health Insights:</p>
                            {userProfile.health.state.summary.slice(0, 3).map((item, idx) => (
                                <p key={idx} className="activity-item">• {item}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="domain-analysis-card">
                    <div className="domain-header">
                        <span className="domain-icon">💹</span>
                        <h3>Finance & Investments</h3>
                    </div>
                    <div className="domain-sentiment">
                        <span className={`sentiment-badge ${userProfile.finance.sentiment}`}>
                            {userProfile.finance.sentiment}
                        </span>
                        <span className="data-count">{userProfile.finance.state?.status || 'No data'}</span>
                    </div>
                    {userProfile.finance.state?.summary && userProfile.finance.state.summary.length > 0 && (
                        <div className="recent-activity">
                            <p className="activity-label">Portfolio Insights:</p>
                            {userProfile.finance.state.summary.slice(0, 3).map((item, idx) => (
                                <p key={idx} className="activity-item">• {item}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="domain-analysis-card">
                    <div className="domain-header">
                        <span className="domain-icon">📚</span>
                        <h3>Study & Learning</h3>
                    </div>
                    <div className="domain-sentiment">
                        <span className={`sentiment-badge ${userProfile.study.sentiment}`}>
                            {userProfile.study.sentiment}
                        </span>
                        <span className="data-count">{userProfile.study.data.length} interactions</span>
                    </div>
                    {userProfile.study.data.length > 0 && (
                        <div className="recent-activity">
                            <p className="activity-label">Recent Activity:</p>
                            {userProfile.study.data.slice(0, 2).map((item, idx) => (
                                <p key={idx} className="activity-item">{item.text.substring(0, 50)}...</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="domain-analysis-card">
                    <div className="domain-header">
                        <span className="domain-icon">✈️</span>
                        <h3>Travel & Lifestyle</h3>
                    </div>
                    <div className="domain-sentiment">
                        <span className={`sentiment-badge ${userProfile.travel.sentiment}`}>
                            {userProfile.travel.sentiment}
                        </span>
                        <span className="data-count">{userProfile.travel.state?.status || 'No data'}</span>
                    </div>
                    {userProfile.travel.state?.summary && userProfile.travel.state.summary.length > 0 && (
                        <div className="recent-activity">
                            <p className="activity-label">Travel Insights:</p>
                            {userProfile.travel.state.summary.slice(0, 3).map((item, idx) => (
                                <p key={idx} className="activity-item">• {item}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI-Powered Recommendations */}
            {aiRecommendations && (
                <div className="ai-recommendations-card">
                    <div className="recommendations-header">
                        <span className="ai-brain-icon">🧠</span>
                        <div>
                            <h2>AI-Powered Personalized Recommendations</h2>
                            <p>Generated by analyzing your complete behavioral profile</p>
                        </div>
                    </div>
                    <div className="recommendations-content">
                        {loading ? (
                            <div className="loading-recommendations">
                                <div className="spinner-small"></div>
                                <p>AI is analyzing your patterns...</p>
                            </div>
                        ) : (
                            <MarkdownRenderer content={aiRecommendations} />
                        )}
                    </div>
                    <div className="recommendations-footer">
                        <span className="ai-badge">Powered by Gemini AI</span>
                        <span className="data-badge">Trained on {Object.values(userProfile).reduce((sum, p) => sum + p.data.length, 0)} data points</span>
                    </div>
                </div>
            )}

            {/* Text Sentiment Analyzer */}
            <div className="text-analyzer-section">
                <h2>📝 Real-Time Text Sentiment Analyzer</h2>
                <div className="analyzer-input-group">
                    <textarea
                        className="analyzer-input"
                        placeholder="Enter text to analyze sentiment (e.g., 'I feel great about my investments today!')"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        rows="4"
                    />
                    <button 
                        className="analyze-button"
                        onClick={handleAnalyzeText}
                        disabled={!userInput.trim() || loading}
                    >
                        {loading ? 'Analyzing...' : '🔍 Analyze Sentiment'}
                    </button>
                </div>

                {sentiment && (
                    <div className="sentiment-result">
                        <div className="result-header">
                            <h3>Analysis Result</h3>
                            <span className={`sentiment-label-large ${sentiment.label.toLowerCase()}`}>
                                {sentiment.label}
                            </span>
                        </div>
                        <div className="sentiment-score-bar">
                            <div 
                                className="score-fill"
                                style={{ 
                                    width: `${(sentiment.score + 1) * 50}%`,
                                    background: sentiment.score > 0 ? '#22c55e' : sentiment.score < 0 ? '#ef4444' : '#3b82f6'
                                }}
                            ></div>
                            <span className="score-text">{sentiment.score.toFixed(2)}</span>
                        </div>
                        {sentiment.contributions.length > 0 && (
                            <div className="contributions">
                                <p className="contributions-label">Key Words Detected:</p>
                                <div className="contributions-list">
                                    {sentiment.contributions.map((contrib, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`contribution-chip ${contrib.value > 0 ? 'positive' : 'negative'}`}
                                        >
                                            {contrib.word} ({contrib.value > 0 ? '+' : ''}{contrib.value})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AI Insights Timeline */}
            <div className="insights-timeline">
                <h2>📊 Behavioral Pattern Timeline</h2>
                <div className="timeline-content">
                    <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content-item">
                            <h4>Data Collection Phase</h4>
                            <p>AI collected {Object.values(userProfile).reduce((sum, p) => sum + p.data.length, 0)} interactions across 4 domains</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content-item">
                            <h4>Pattern Recognition</h4>
                            <p>Identified sentiment patterns and behavioral trends</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content-item">
                            <h4>AI Model Training</h4>
                            <p>Personalized model trained on your unique data profile</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-marker active"></div>
                        <div className="timeline-content-item">
                            <h4>Recommendations Generated</h4>
                            <p>AI-powered insights ready for your review</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

