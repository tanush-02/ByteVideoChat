import React, { useEffect, useMemo, useState } from 'react'
import { analyzeSentiment } from '../services/apiService'
import './DomainPages.css'

export default function Sentiment() {
    const [text, setText] = useState('')
    const [result, setResult] = useState({ score: 0, label: 'Neutral', contributions: [], tokens: 0 })

    useEffect(() => {
        const id = setTimeout(() => {
            setResult(analyzeSentiment(text))
        }, 200)
        return () => clearTimeout(id)
    }, [text])

    const gaugeColor = useMemo(() => {
        if (result.score > 0.2) return 'linear-gradient(90deg, #22c55e, #16a34a)'
        if (result.score < -0.2) return 'linear-gradient(90deg, #ef4444, #dc2626)'
        return 'linear-gradient(90deg, #64748b, #475569)'
    }, [result.score])

    const gaugeWidth = useMemo(() => `${Math.round((result.score + 1) * 50)}%`, [result.score])

    const emoji = useMemo(() => {
        if (result.score > 0.5) return '😄'
        if (result.score > 0.2) return '🙂'
        if (result.score < -0.5) return '😠'
        if (result.score < -0.2) return '🙁'
        return '😐'
    }, [result.score])

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>🧠 Sentiment Analysis</h2>
                <p className="domain-subtitle">Analyze text tone in real-time. Paste comments, notes, or any content.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card study-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginTop: 0, color: 'white' }}>Enter Text</h3>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type or paste text to analyze sentiment..."
                        style={{
                            width: '100%',
                            minHeight: '140px',
                            resize: 'vertical',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>

                <div className="stat-card finance-card">
                    <div className="stat-header">
                        <h3>Overall Sentiment</h3>
                        <span className="live-badge">LIVE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '2rem' }}>{emoji}</div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>{result.label}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Score: {result.score.toFixed(2)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 9999, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: gaugeWidth, height: '100%', background: gaugeColor, transition: 'width 250ms ease' }} />
                    </div>
                    <p className="stat-update" style={{ marginTop: '0.75rem' }}>{result.tokens} tokens analyzed</p>
                </div>

                <div className="stat-card travel-card" style={{ gridColumn: 'span 2' }}>
                    <div className="stat-header">
                        <h3>Top Contributing Words</h3>
                    </div>
                    {result.contributions.length ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                            {result.contributions.map((c, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 12,
                                    padding: '0.75rem 1rem'
                                }}>
                                    <div style={{ color: 'white', fontWeight: 600 }}>{c.word}</div>
                                    <div style={{ fontSize: '0.9rem', color: c.value >= 0 ? '#22c55e' : '#ef4444' }}>
                                        {c.value >= 0 ? '+' : ''}{c.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Start typing to see contributing words.</p>
                    )}
                </div>
            </div>
        </div>
    )
}




