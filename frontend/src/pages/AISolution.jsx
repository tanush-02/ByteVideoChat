import React, { useState } from 'react'
import { getSolutionProcedure } from '../services/geminiService'
import MarkdownRenderer from '../components/MarkdownRenderer'
import './DomainPages.css'
import './AISolution.css'

const domains = [
    { id: 'finance', label: 'Finance', icon: '💹', color: '#22c55e' },
    { id: 'healthcare', label: 'Healthcare', icon: '🩺', color: '#ef4444' },
    { id: 'study', label: 'Study', icon: '📚', color: '#3b82f6' },
    { id: 'travel', label: 'Travel', icon: '✈️', color: '#f59e0b' },
]

export default function AISolution() {
    const [selectedDomain, setSelectedDomain] = useState('finance')
    const [query, setQuery] = useState('')
    const [context, setContext] = useState('')
    const [loading, setLoading] = useState(false)
    const [procedure, setProcedure] = useState(null)
    const [error, setError] = useState(null)
    const [currentStep, setCurrentStep] = useState(0)

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
            // Generate step-by-step procedure
            const procedureData = await getSolutionProcedure(
                selectedDomain,
                query || '',
                context || ''
            )
            setProcedure(procedureData)
            // Don't auto-fetch domain info - it's unnecessary and clutters the UI
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
                            }}
                        >
                            Reset
                        </button>
                    </div>

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

                    {/* Full Procedure Text */}
                    <div className="full-procedure">
                        <h4>Complete Procedure</h4>
                        <div className="procedure-text-full">
                            <MarkdownRenderer content={procedure.procedure} />
                        </div>
                        <p className="procedure-timestamp">
                            Generated at {new Date(procedure.timestamp).toLocaleString()}
                        </p>
                    </div>
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

