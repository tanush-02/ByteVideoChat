import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchStudyTips, fetchEducationalContent } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
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
    const [mindMapNodes, setMindMapNodes] = useState([
        { id: 'main-topic', label: 'Main Topic', parentId: null, color: '#f87171', size: 'large', completed: false },
        { id: 'reading', label: 'Reading', parentId: 'main-topic', color: '#60a5fa', size: 'medium', completed: false },
        { id: 'practice', label: 'Practice', parentId: 'main-topic', color: '#34d399', size: 'medium', completed: false },
        { id: 'review', label: 'Review', parentId: 'main-topic', color: '#facc15', size: 'medium', completed: false },
        { id: 'notes', label: 'Notes', parentId: 'reading', color: '#38bdf8', size: 'small', completed: false },
        { id: 'mock-tests', label: 'Mock Tests', parentId: 'practice', color: '#4ade80', size: 'small', completed: false }
    ])
    const [mindMapForm, setMindMapForm] = useState({
        label: '',
        parentId: 'main-topic',
        color: '#60a5fa',
        size: 'small'
    })
    const [lastTap, setLastTap] = useState({ id: null, time: 0 })

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
                
                // Fetch AI insights from Gemini API
                try {
                    const insight = await getDomainInsights('study', `Study tip: ${tip}`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Providing learning strategies and study recommendations...')
                }
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
        const randomCode = "StudyHelp";
        navigate(`/${randomCode}`);
    }

    const colorPalette = ['#f87171', '#fb923c', '#facc15', '#34d399', '#60a5fa', '#a78bfa']
    const containerSize = 640

    const mindMapPositions = useMemo(() => {
        if (!mindMapNodes.length) return []
        const nodeMap = new Map()
        const preparedNodes = mindMapNodes.map(node => ({
            ...node,
            children: []
        }))
        preparedNodes.forEach(node => nodeMap.set(node.id, node))
        preparedNodes.forEach(node => {
            if (node.parentId && nodeMap.has(node.parentId)) {
                nodeMap.get(node.parentId).children.push(node)
            }
        })

        const positions = {}
        const radiusStep = 140
        const center = containerSize / 2

        const roots = preparedNodes.filter(node => !node.parentId)
        roots.forEach(root => {
            root.level = 0
            positions[root.id] = { ...root, x: center, y: center }
            placeChildren(root)
        })

        function placeChildren(parent) {
            if (!parent.children.length) return
            const angleStep = (Math.PI * 2) / parent.children.length
            const startAngle = -Math.PI / 2
            parent.children.forEach((child, index) => {
                const angle = startAngle + index * angleStep
                const radius = radiusStep * (parent.level + 1)
                const x = center + radius * Math.cos(angle)
                const y = center + radius * Math.sin(angle)
                child.level = parent.level + 1
                positions[child.id] = { ...child, x, y }
                placeChildren(child)
            })
        }

        return Object.values(positions)
    }, [mindMapNodes])

    const handleAddMindMapNode = () => {
        if (!mindMapForm.label.trim()) {
            alert('Please enter a node label')
            return
        }

        const newNode = {
            id: `node-${Date.now()}`,
            label: mindMapForm.label.trim(),
            parentId: mindMapForm.parentId,
            color: mindMapForm.color,
            size: mindMapForm.size,
            completed: false
        }
        setMindMapNodes(prev => [...prev, newNode])
        setMindMapForm({
            label: '',
            parentId: mindMapForm.parentId,
            color: mindMapForm.color,
            size: mindMapForm.size
        })
    }

    const handleResetMindMap = () => {
        if (window.confirm('Reset mind map to default layout?')) {
            setMindMapNodes([
                { id: 'main-topic', label: 'Main Topic', parentId: null, color: '#f87171', size: 'large', completed: false },
                { id: 'reading', label: 'Reading', parentId: 'main-topic', color: '#60a5fa', size: 'medium', completed: false },
                { id: 'practice', label: 'Practice', parentId: 'main-topic', color: '#34d399', size: 'medium', completed: false },
                { id: 'review', label: 'Review', parentId: 'main-topic', color: '#facc15', size: 'medium', completed: false },
                { id: 'notes', label: 'Notes', parentId: 'reading', color: '#38bdf8', size: 'small', completed: false },
                { id: 'mock-tests', label: 'Mock Tests', parentId: 'practice', color: '#4ade80', size: 'small', completed: false }
            ])
        }
    }

    const nodeSizeMap = {
        large: 140,
        medium: 110,
        small: 90
    }

    const completeNode = (id) => {
        setMindMapNodes(prev => prev.map(n => n.id === id ? { ...n, completed: true } : n))
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

                    <div className="mindmap-section">
                        <div className="mindmap-header">
                            <div>
                                <h3>🧠 Study Mind Map Builder</h3>
                                <p>Organize your ideas visually. Add nodes to build your own map.</p>
                            </div>
                            <button className="mindmap-reset" onClick={handleResetMindMap}>
                                Reset Map
                            </button>
                        </div>
                        <div className="mindmap-layout">
                            <div className="mindmap-board" style={{ width: containerSize, height: containerSize }}>
                                <svg className="mindmap-links" width={containerSize} height={containerSize}>
                                    {mindMapPositions.map(node => {
                                        if (!node.parentId) return null
                                        const parent = mindMapPositions.find(n => n.id === node.parentId)
                                        if (!parent) return null
                                        return (
                                            <line
                                                key={`${node.id}-link`}
                                                x1={parent.x}
                                                y1={parent.y}
                                                x2={node.x}
                                                y2={node.y}
                                                stroke={node.color}
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                opacity="0.5"
                                            />
                                        )
                                    })}
                                </svg>
                                {mindMapPositions.map(node => (
                                    <div
                                        key={node.id}
                                        className={`mindmap-node level-${node.level}`}
                                        style={{
                                            left: node.x,
                                            top: node.y,
                                            width: nodeSizeMap[node.size] || 100,
                                            height: nodeSizeMap[node.size] || 100,
                                            background: node.completed ? '#9CA3AF' : node.color,
                                            visibility: 'visible'
                                        }}
                                        onDoubleClick={() => completeNode(node.id)}
                                        onTouchEnd={() => {
                                            const now = Date.now()
                                            if (lastTap.id === node.id && now - lastTap.time < 300) {
                                                completeNode(node.id)
                                            }
                                            setLastTap({ id: node.id, time: now })
                                        }}
                                    >
                                        <span>{node.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mindmap-form">
                                <h4>Add Node</h4>
                                <div className="form-grid">
                                    <input
                                        type="text"
                                        placeholder="Node label"
                                        value={mindMapForm.label}
                                        onChange={(e) => setMindMapForm({ ...mindMapForm, label: e.target.value })}
                                    />
                                    <select
                                        value={mindMapForm.parentId}
                                        onChange={(e) => setMindMapForm({ ...mindMapForm, parentId: e.target.value })}
                                    >
                                        {mindMapNodes.map(node => (
                                            <option key={node.id} value={node.id}>
                                                Attach to: {node.label}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={mindMapForm.size}
                                        onChange={(e) => setMindMapForm({ ...mindMapForm, size: e.target.value })}
                                    >
                                        <option value="large">Large bubble</option>
                                        <option value="medium">Medium bubble</option>
                                        <option value="small">Small bubble</option>
                                    </select>
                                </div>
                                <div className="color-picker-row">
                                    <span>Color:</span>
                                    <div className="color-swatches">
                                        {colorPalette.map(color => (
                                            <button
                                                key={color}
                                                className={`color-swatch ${mindMapForm.color === color ? 'active' : ''}`}
                                                style={{ background: color }}
                                                onClick={() => setMindMapForm({ ...mindMapForm, color })}
                                                type="button"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button className="submit-button" onClick={handleAddMindMapNode}>
                                    + Add Node
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Learning Insight</h3>
                        </div>
                        <div className="ai-content">
                            <MarkdownRenderer content={aiInsight} />
                        </div>
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
