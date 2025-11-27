import React, { useState, useEffect } from 'react'
import { getSolutionProcedure, getPersonalizedRecommendations } from '../services/geminiService'
import { getAllUserData } from '../services/userDataService'
import MarkdownRenderer from '../components/MarkdownRenderer'
import './DomainPages.css'
import './AISolution.css'

const domains = [
    { id: 'finance', label: 'Finance', icon: '💹', color: '#22c55e' },
    { id: 'healthcare', label: 'Healthcare', icon: '🩺', color: '#ef4444' },
    { id: 'study', label: 'Study', icon: '📚', color: '#3b82f6' },
    { id: 'travel', label: 'Travel', icon: '✈️', color: '#f59e0b' },
]

const createInitialInsight = () => ({
    status: 'Collecting data...',
    summary: [],
    sentiment: 'neutral',
    score: 0
})

export default function AISolution() {
    const [selectedDomain, setSelectedDomain] = useState('finance')
    const [query, setQuery] = useState('')
    const [context, setContext] = useState('')
    const [loading, setLoading] = useState(false)
    const [procedure, setProcedure] = useState(null)
    const [error, setError] = useState(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [userInsights, setUserInsights] = useState({
        health: createInitialInsight(),
        finance: createInitialInsight(),
        travel: createInitialInsight()
    })
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [personalizedContext, setPersonalizedContext] = useState('')
    const [personalizedNarrative, setPersonalizedNarrative] = useState('AI is capturing your health, finance, and lifestyle patterns...')
    const [recommendations, setRecommendations] = useState('')
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [solutionHighlights, setSolutionHighlights] = useState([])
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        setIsAuthenticated(!!token)
    }, [])

    const fetchRecommendations = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            setRecommendations('Sign in to let AI coach tune itself to your personal data.')
            return
        }
        try {
            setRecommendationsLoading(true)
            const rec = await getPersonalizedRecommendations()
            setRecommendations(rec)
        } catch (err) {
            console.error('Error fetching personalized recommendations:', err)
            setRecommendations('We are syncing your records. Add health, finance, or travel data to unlock deeper coaching.')
        } finally {
            setRecommendationsLoading(false)
        }
    }

    useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                setPersonalizedNarrative('Sign in to let AI capture your lifestyle signals and craft tailored plans.')
                setIsAnalyzing(false)
                setTrainingProgress(100)
                return
            }
            setIsAnalyzing(true)
            setTrainingProgress(10)
            try {
                const data = await getAllUserData()
                setTrainingProgress(45)

                const healthState = analyzeHealthState(data.health)
                const financeState = analyzeFinanceState(data.finance)
                const travelState = analyzeTravelState(data.travel)

                const insights = {
                    health: healthState,
                    finance: financeState,
                    travel: travelState
                }

                setUserInsights(insights)
                setTrainingProgress(75)

                const contextSummary = buildPersonalizedContext(insights)
                setPersonalizedContext(contextSummary)
                setPersonalizedNarrative(buildNarrativeFromInsights(insights))

                await fetchRecommendations()
            } catch (err) {
                console.error('Error loading user data:', err)
                setPersonalizedNarrative('We are still reading your lifestyle data. Add records or retry in a moment.')
            } finally {
                setTrainingProgress(100)
                setTimeout(() => setIsAnalyzing(false), 600)
            }
        }

        loadUserData()
    }, [])

    const handleGenerateProcedure = async () => {
        if (!selectedDomain) {
            setError('Please select a domain')
            return
        }

        setLoading(true)
        setError(null)
        setProcedure(null)
        setCurrentStep(0)

        try {
            const combinedContext = [context, personalizedContext]
                .filter(Boolean)
                .join('\n\n')

            const procedureData = await getSolutionProcedure(
                selectedDomain,
                query || '',
                combinedContext
            )

            setProcedure(procedureData)
            setSolutionHighlights(deriveHighlights(procedureData))
            await fetchRecommendations()
        } catch (err) {
            console.error('Error generating procedure:', err)
            setError('Failed to generate solution procedure. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDomainSelect = (domainId) => {
        setSelectedDomain(domainId)
        setProcedure(null)
        setCurrentStep(0)
        setError(null)
        // Don't auto-fetch domain info - let user generate solution first
    }

    const selectedDomainConfig = domains.find(d => d.id === selectedDomain)

    return (
        <div className="ai-solution-container">
            <div className="ai-solution-header">
                <h2>🤖 AI Solution Provider</h2>
                <p className="ai-solution-subtitle">
                    Get step-by-step AI-powered solutions for your domain needs
                </p>
            </div>

            {/* Domain Selection */}
            <div className="domain-selector-section">
                <h3>Select Domain</h3>
                <div className="domain-buttons">
                    {domains.map((domain) => (
                        <button
                            key={domain.id}
                            className={`domain-button ${selectedDomain === domain.id ? 'active' : ''}`}
                            onClick={() => handleDomainSelect(domain.id)}
                            style={{
                                borderColor: selectedDomain === domain.id ? domain.color : 'rgba(255, 255, 255, 0.3)',
                                background: selectedDomain === domain.id 
                                    ? `linear-gradient(135deg, ${domain.color}20, ${domain.color}10)`
                                    : 'rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <span className="domain-button-icon">{domain.icon}</span>
                            <span className="domain-button-label">{domain.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Query Input Section */}
            <div className="query-section">
                <div className="query-input-group">
                    <label htmlFor="query-input">Your Question or Goal</label>
                    <input
                        id="query-input"
                        type="text"
                        placeholder={`e.g., "How to create a budget plan" or "Plan a healthy diet"`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="query-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerateProcedure()}
                    />
                </div>
                <div className="context-input-group">
                    <label htmlFor="context-input">Additional Context (Optional)</label>
                    <textarea
                        id="context-input"
                        placeholder="Provide any additional context or requirements..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="context-input"
                        rows="3"
                    />
                </div>
                <button
                    className="generate-button"
                    onClick={handleGenerateProcedure}
                    disabled={loading}
                    style={{
                        background: selectedDomainConfig 
                            ? `linear-gradient(135deg, ${selectedDomainConfig.color}, ${selectedDomainConfig.color}dd)`
                            : 'linear-gradient(135deg, #667eea, #764ba2)'
                    }}
                >
                    {loading ? (
                        <>
                            <span className="spinner-small"></span>
                            Generating Solution...
                        </>
                    ) : (
                        <>
                            <span>🚀</span>
                            Generate Step-by-Step Solution
                        </>
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    <span>❌</span>
                    <p>{error}</p>
                </div>
            )}

            {/* AI Training & User Insight Section */}
            <div className="ai-training-widget">
                <div className="training-copy">
                    <p className="eyebrow-text">Live AI Pipeline</p>
                    <h3>Training with your lifestyle, finance & travel signals</h3>
                    <p>We digest your wellness history, investments, and upcoming plans to fine-tune every recommendation.</p>
                    <ul>
                        <li>Reads your health vitals, medications, workouts</li>
                        <li>Understands savings, investments, cash flow</li>
                        <li>Tracks travel goals and lifestyle patterns</li>
                    </ul>
                </div>
                <div className="training-status">
                    <p>{isAnalyzing ? 'Training in progress' : 'Training complete'}</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${trainingProgress}%` }}></div>
                    </div>
                    <div className="training-steps">
                        <span className={trainingProgress > 20 ? 'completed' : ''}>📊 Reading data</span>
                        <span className={trainingProgress > 50 ? 'completed' : ''}>🧠 Learning patterns</span>
                        <span className={trainingProgress === 100 ? 'completed' : ''}>✅ Generating insights</span>
                    </div>
                </div>
            </div>

            <div className="user-insight-grid">
                {[
                    { key: 'health', label: 'Health & Wellness', icon: '🩺', color: '#ef4444' },
                    { key: 'finance', label: 'Finance & Investments', icon: '💹', color: '#22c55e' },
                    { key: 'travel', label: 'Lifestyle & Travel', icon: '✈️', color: '#f59e0b' },
                ].map(({ key, label, icon, color }) => (
                    <div className="insight-card" key={key}>
                        <div className="insight-header">
                            <span className="insight-icon">{icon}</span>
                            <div>
                                <p className="insight-label">{label}</p>
                                <p className="insight-status" style={{ color }}>{userInsights[key]?.status || 'Analyzing...'}</p>
                            </div>
                        </div>
                        <ul className="insight-summary">
                            {(userInsights[key]?.summary?.length ? userInsights[key].summary : ['No recent data'])
                                .slice(0, 3)
                                .map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="personalized-summary-card">
                <h3>AI Personalized Briefing</h3>
                <p>{personalizedNarrative}</p>
            </div>

            <div className="recommendations-card">
                <div className="recommendations-header">
                    <span>🧠 Personalized Wellbeing Plan</span>
                    <small>Powered by your latest health, finance & travel data</small>
                </div>
                <div className="recommendations-content">
                    {recommendationsLoading ? (
                        <div className="loading-recommendations">
                            <div className="spinner-small"></div>
                            <p>AI coach is tailoring your plan...</p>
                        </div>
                    ) : (
                        <MarkdownRenderer content={recommendations || 'Connect your account to unlock personalized recommendations.'} />
                    )}
                </div>
            </div>

            {/* Domain Information - Removed auto-display to improve UX */}

            {/* Procedure Display */}
            {procedure && (
                <div className="procedure-container">
                    <div className="procedure-header">
                        <div className="procedure-header-content">
                            <span className="procedure-icon">📋</span>
                            <div>
                                <h3>Step-by-Step Solution</h3>
                                <p className="procedure-subtitle">
                                    {selectedDomainConfig?.label} • {procedure.query || 'General Solution'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="reset-button"
                            onClick={() => {
                                setProcedure(null)
                                setCurrentStep(0)
                                setSolutionHighlights([])
                            }}
                        >
                            Reset
                        </button>
                    </div>

                    {solutionHighlights.length > 0 && (
                        <div className="solution-highlights">
                            <p className="eyebrow-text">AI detected focus areas</p>
                            <div className="highlight-chips">
                                {solutionHighlights.map((highlight, idx) => (
                                    <span className="highlight-chip" key={`${highlight}-${idx}`}>
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step Navigation */}
                    {procedure.steps && procedure.steps.length > 0 && (
                        <div className="step-navigation">
                            <button
                                className="nav-button"
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                            >
                                ← Previous
                            </button>
                            <span className="step-counter">
                                Step {currentStep + 1} of {procedure.steps.length}
                            </span>
                            <button
                                className="nav-button"
                                onClick={() => setCurrentStep(Math.min(procedure.steps.length - 1, currentStep + 1))}
                                disabled={currentStep === procedure.steps.length - 1}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Steps Display */}
                    {procedure.steps && procedure.steps.length > 0 ? (
                        <div className="steps-container">
                            {procedure.steps.map((step, index) => (
                                <div
                                    key={step.number}
                                    className={`step-card ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className="step-number">
                                        {index < currentStep ? '✓' : step.number}
                                    </div>
                                    <div className="step-content">
                                        <h4>Step {step.number}</h4>
                                        <MarkdownRenderer content={step.description} className="step-description" />
                                    </div>
                                    {index === currentStep && (
                                        <div className="step-indicator" style={{ background: selectedDomainConfig?.color }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="procedure-content">
                            <div className="procedure-text">
                                <MarkdownRenderer content={procedure.procedure} />
                            </div>
                        </div>
                    )}

                    {/* Full Procedure Text - only show when AI didn't return structured steps */}
                    {(!procedure.steps || procedure.steps.length === 0) && (
                        <div className="full-procedure">
                            <h4>Complete Procedure</h4>
                            <div className="procedure-text-full">
                                <MarkdownRenderer content={procedure.procedure} />
                            </div>
                            <p className="procedure-timestamp">
                                Generated at {new Date(procedure.timestamp).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && !procedure && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Generating your personalized solution...</p>
                </div>
            )}
        </div>
    )
}

const analyzeHealthState = (healthData) => {
    if (!healthData) {
        return {
            status: 'No health data linked',
            summary: ['Sync wearable or add records to unlock coaching'],
            sentiment: 'neutral',
            score: 0
        }
    }

    let score = 0
    const summary = []
    const currentConditions = healthData.currentDiseases || []
    const severe = currentConditions.filter(d => d.severity === 'Severe').length

    if (currentConditions.length > 0) {
        score -= 0.2 * currentConditions.length
        score -= 0.3 * severe
        summary.push(`${currentConditions.length} active condition(s)`)
    } else {
        summary.push('No active conditions')
        score += 0.3
    }

    const exercises = (healthData.exercises || []).filter(e => {
        const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
        return daysAgo <= 7
    })
    if (exercises.length > 0) {
        summary.push(`${exercises.length} workout(s) this week`)
        score += 0.3
    }

    const checkups = (healthData.checkups || []).filter(c => new Date(c.scheduledDate) > new Date())
    if (checkups.length > 0) {
        summary.push(`${checkups.length} upcoming checkup(s)`)
    }

    const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    return {
        status: sentiment === 'positive' ? 'On-track wellness' : sentiment === 'negative' ? 'Needs attention' : 'Monitor status',
        summary,
        sentiment,
        score
    }
}

const analyzeFinanceState = (financeData) => {
    if (!financeData) {
        return {
            status: 'No financial data linked',
            summary: ['Connect finance dashboard to tailor planning'],
            sentiment: 'neutral',
            score: 0
        }
    }

    let score = 0
    const summary = []

    const savings = financeData.savings?.total || 0
    if (savings > 0) {
        summary.push(`₹${(savings / 1000).toFixed(0)}K saved`)
        score += 0.2
    }

    const investments = financeData.investments?.total || 0
    if (investments > 0) {
        summary.push(`₹${(investments / 1000).toFixed(0)}K invested`)
        score += 0.2
    }

    const stocks = financeData.investments?.stocks || []
    if (stocks.length > 0) {
        const profitPercent = stocks.reduce((sum, s) => sum + (s.profitLossPercent || 0), 0) / stocks.length
        summary.push(`${stocks.length} stocks • ${profitPercent.toFixed(1)}% avg return`)
        score += profitPercent > 0 ? 0.2 : -0.1
    }

    const transactions = (financeData.transactions || []).slice(-10)
    if (transactions.length > 0) {
        const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0)
        const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0)
        if (income > expenses) {
            summary.push('Positive cash flow last 10 entries')
            score += 0.2
        } else {
            summary.push('Expenses exceed recent income')
            score -= 0.2
        }
    }

    const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    return {
        status: sentiment === 'positive' ? 'Healthy financial posture' : sentiment === 'negative' ? 'Tight cash flow' : 'Stable outlook',
        summary,
        sentiment,
        score
    }
}

const analyzeTravelState = (travelData) => {
    if (!travelData) {
        return {
            status: 'No travel data linked',
            summary: ['Add upcoming trips to align wellbeing routines'],
            sentiment: 'neutral',
            score: 0
        }
    }

    let score = 0
    const summary = []

    const upcomingTrips = (travelData.upcomingTrips || []).filter(t => new Date(t.startDate) > new Date() && t.status !== 'Cancelled')
    if (upcomingTrips.length > 0) {
        summary.push(`${upcomingTrips.length} upcoming trip(s)`)
        score += 0.3
    }

    const pastTrips = travelData.pastTrips || []
    if (pastTrips.length > 0) {
        const avgRating = pastTrips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / pastTrips.length
        summary.push(`${pastTrips.length} past trips • ${avgRating.toFixed(1)}/5 avg rating`)
        score += avgRating >= 4 ? 0.1 : 0
    }

    const wishlist = travelData.wishlist || []
    if (wishlist.length > 0) {
        summary.push(`${wishlist.length} bucket-list destination(s)`)
    }

    const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    return {
        status: sentiment === 'positive' ? 'Inspired lifestyle' : sentiment === 'negative' ? 'Needs lifestyle balance' : 'Adventure ready',
        summary,
        sentiment,
        score
    }
}

const buildPersonalizedContext = (insights) => {
    return `User Profile Summary:
HEALTH: ${insights.health.status}. Highlights: ${insights.health.summary.join('; ') || 'n/a'}
FINANCE: ${insights.finance.status}. Highlights: ${insights.finance.summary.join('; ') || 'n/a'}
TRAVEL: ${insights.travel.status}. Highlights: ${insights.travel.summary.join('; ') || 'n/a'}

Tailor recommendations to bridge gaps and leverage strengths mentioned above.`
}

const buildNarrativeFromInsights = (insights) => {
    const sections = [
        `Health — ${insights.health.status}: ${insights.health.summary.slice(0, 2).join(', ') || 'No records yet.'}`,
        `Finance — ${insights.finance.status}: ${insights.finance.summary.slice(0, 2).join(', ') || 'No records yet.'}`,
        `Travel — ${insights.travel.status}: ${insights.travel.summary.slice(0, 2).join(', ') || 'No records yet.'}`
    ]
    return sections.join(' • ')
}

const deriveHighlights = (procedureData) => {
    if (!procedureData) return []
    if (procedureData.steps && procedureData.steps.length > 0) {
        return procedureData.steps.slice(0, 4).map(step => step.description.split('.').shift())
    }
    return procedureData.procedure
        ? procedureData.procedure.split('\n').slice(0, 4).map(line => line.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
        : []
}
