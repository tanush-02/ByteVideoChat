import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function Finance() {
    const { getComments, addComment } = useContext(AuthContext)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [market, setMarket] = useState({
        nifty: 22450,
        sensex: 74320,
        usdInr: 83.6
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setMarket(prev => ({
                nifty: +(prev.nifty + (Math.random() * 40 - 20)).toFixed(2),
                sensex: +(prev.sensex + (Math.random() * 70 - 35)).toFixed(2),
                usdInr: +(prev.usdInr + (Math.random() * 0.08 - 0.04)).toFixed(3)
            }))
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('finance')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    const changeChip = (value) => (
        <span style={{
            color: value >= 0 ? '#22c55e' : '#ef4444',
            background: 'rgba(255,255,255,0.08)',
            padding: '4px 8px',
            borderRadius: 8,
            fontWeight: 700
        }}>{value >= 0 ? '+' : ''}{value}</span>
    )

    return (
        <div className="pageContainer">
            <h2>Finance</h2>
            <div className="statsGrid">
                <div className="statCard">
                    <h3>NIFTY 50</h3>
                    <p className="statNumber">{market.nifty}</p>
                    {changeChip(+(market.nifty - 22450).toFixed(2))}
                </div>
                <div className="statCard">
                    <h3>SENSEX</h3>
                    <p className="statNumber">{market.sensex}</p>
                    {changeChip(+(market.sensex - 74320).toFixed(2))}
                </div>
                <div className="statCard">
                    <h3>USD/INR</h3>
                    <p className="statNumber">{market.usdInr}</p>
                    {changeChip(+(market.usdInr - 83.1).toFixed(3))}
                </div>
            </div>

            <div className="recentActivity" style={{ marginTop: '2rem' }}>
                <h3>Planning Insight</h3>
                <div className="activityItem">
                    <span className="activityIcon">📈</span>
                    <div className="activityDetails">
                        <p>{market.usdInr > 83 ? 'Consider USD expenses today; INR a bit weaker.' : 'Good day for INR purchases.'}</p>
                        <span className="activityTime">Live simulated market ticks</span>
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
                <div className="inputGroup">
                    <input className="authInput" placeholder="Share a thought..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                    <button className="primaryButton" onClick={async () => {
                        try {
                            await addComment('finance', newComment)
                            setNewComment('')
                            const list = await getComments('finance')
                            setComments(list)
                        } catch {
                            localStorage.setItem('postLoginRedirect', `/#finance`)
                            window.location.href = '/auth'
                        }
                    }}>Post</button>
                </div>
            </div>
        </div>
    )
}


