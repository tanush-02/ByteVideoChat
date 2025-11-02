import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function Healthcare() {
    const { getComments, addComment } = useContext(AuthContext)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [vitals, setVitals] = useState({ heartRate: 72, stress: 0.32, sleepHours: 7.1 })
    const [tips, setTips] = useState([
        'Hydrate every hour',
        'Take a 5-min stretch break',
        'Blink often to relax your eyes',
        'Short walk boosts creativity'
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            setVitals(prev => ({
                heartRate: Math.max(54, Math.min(100, Math.round(prev.heartRate + (Math.random() * 6 - 3)))) ,
                stress: Math.max(0.1, Math.min(0.95, +(prev.stress + (Math.random() * 0.1 - 0.05)).toFixed(2))),
                sleepHours: Math.max(4, Math.min(9, +(prev.sleepHours + (Math.random() * 0.2 - 0.1)).toFixed(1)))
            }))
        }, 3500)
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

    const nextTip = tips[(Math.floor(Date.now() / 10000)) % tips.length]

    return (
        <div className="pageContainer">
            <h2>Healthcare</h2>
            <div className="statsGrid">
                <div className="statCard">
                    <h3>Heart Rate</h3>
                    <p className="statNumber">{vitals.heartRate} bpm</p>
                </div>
                <div className="statCard">
                    <h3>Stress Level</h3>
                    <p className="statNumber">{Math.round(vitals.stress * 100)}%</p>
                </div>
                <div className="statCard">
                    <h3>Sleep (last night)</h3>
                    <p className="statNumber">{vitals.sleepHours} h</p>
                </div>
            </div>

            <div className="recentActivity" style={{ marginTop: '2rem' }}>
                <h3>Wellness Tip</h3>
                <div className="activityItem">
                    <span className="activityIcon">💡</span>
                    <div className="activityDetails">
                        <p>{nextTip}</p>
                        <span className="activityTime">Updates every 10s</span>
                    </div>
                </div>
            </div>

            <div className="recentActivity" style={{ marginTop: '2rem' }}>
                <h3>Community Thoughts</h3>
                <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: '1rem' }}>
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="activityItem">
                            <span className="activityIcon">👤</span>
                            <div className="activityDetails">
                                <p>{c.text}</p>
                                <span className="activityTime">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p>No comments yet</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="inputGroup">
                        <input className="authInput" placeholder="Share a thought..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <button className="primaryButton" onClick={async () => {
                            try {
                                await addComment('healthcare', newComment)
                                setNewComment('')
                                const list = await getComments('healthcare')
                                setComments(list)
                            } catch (err) {
                                console.error("Error posting comment:", err)
                                alert("Failed to post comment. Please try again.")
                            }
                        }}>Post</button>
                    </div>
                ) : (
                    <div style={{ 
                        padding: '1rem', 
                        background: '#f0f0f0', 
                        borderRadius: '8px', 
                        textAlign: 'center',
                        border: '2px dashed #ccc'
                    }}>
                        <p style={{ marginBottom: '0.5rem', color: '#666' }}>You need to be logged in to comment</p>
                        <button 
                            className="primaryButton" 
                            onClick={() => {
                                localStorage.setItem('postLoginRedirect', `/#healthcare`)
                                window.location.href = '/auth'
                            }}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Login to Comment
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}


