import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function Study() {
    const { getComments, addComment } = useContext(AuthContext)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [focus, setFocus] = useState(0.78)
    const [nextBreakIn, setNextBreakIn] = useState(25)

    useEffect(() => {
        const tick = setInterval(() => {
            setFocus(prev => Math.max(0.4, Math.min(0.98, +(prev + (Math.random() * 0.08 - 0.04)).toFixed(2))))
            setNextBreakIn(prev => prev > 0 ? prev - 1 : 25)
        }, 1000)
        return () => clearInterval(tick)
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

    return (
        <div className="pageContainer">
            <h2>Study</h2>
            <div className="statsGrid">
                <div className="statCard">
                    <h3>Focus Score</h3>
                    <p className="statNumber">{Math.round(focus * 100)}%</p>
                </div>
                <div className="statCard">
                    <h3>Next Break</h3>
                    <p className="statNumber">{nextBreakIn}s</p>
                </div>
                <div className="statCard">
                    <h3>Suggested Session</h3>
                    <p className="statNumber">{focus > 0.8 ? 'Deep Work (45m)' : 'Light Review (20m)'}</p>
                </div>
            </div>

            <div className="recentActivity" style={{ marginTop: '2rem' }}>
                <h3>Tip</h3>
                <div className="activityItem">
                    <span className="activityIcon">🧠</span>
                    <div className="activityDetails">
                        <p>{focus > 0.8 ? 'Great focus — tackle the hardest topic now.' : 'Focus dipping — schedule a short, active break.'}</p>
                        <span className="activityTime">Updates every second</span>
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
                                await addComment('study', newComment)
                                setNewComment('')
                                const list = await getComments('study')
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
                                localStorage.setItem('postLoginRedirect', `/#study`)
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


