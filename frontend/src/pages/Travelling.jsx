import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function Travelling() {
    const { getComments, addComment } = useContext(AuthContext)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [weather, setWeather] = useState({ temp: 28, condition: 'Sunny', rainChance: 0.1 })

    useEffect(() => {
        const conditions = ['Sunny','Cloudy','Rainy','Windy','Clear','Humid']
        const interval = setInterval(() => {
            setWeather(prev => ({
                temp: Math.max(12, Math.min(40, Math.round(prev.temp + (Math.random() * 2 - 1)))),
                condition: conditions[Math.floor(Math.random()*conditions.length)],
                rainChance: Math.max(0, Math.min(1, +(prev.rainChance + (Math.random()*0.2 - 0.1)).toFixed(2)))
            }))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('travelling')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    return (
        <div className="pageContainer">
            <h2>Travelling</h2>
            <div className="statsGrid">
                <div className="statCard">
                    <h3>Temperature</h3>
                    <p className="statNumber">{weather.temp}°C</p>
                </div>
                <div className="statCard">
                    <h3>Condition</h3>
                    <p className="statNumber">{weather.condition}</p>
                </div>
                <div className="statCard">
                    <h3>Rain Chance</h3>
                    <p className="statNumber">{Math.round(weather.rainChance * 100)}%</p>
                </div>
            </div>

            <div className="recentActivity" style={{ marginTop: '2rem' }}>
                <h3>Planner</h3>
                <div className="activityItem">
                    <span className="activityIcon">🧭</span>
                    <div className="activityDetails">
                        <p>{weather.rainChance > 0.5 ? 'Carry an umbrella and buffer time.' : 'Great day for commuting or a short trip.'}</p>
                        <span className="activityTime">Live simulated weather</span>
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
                            await addComment('travelling', newComment)
                            setNewComment('')
                            const list = await getComments('travelling')
                            setComments(list)
                        } catch {
                            localStorage.setItem('postLoginRedirect', `/#travelling`)
                            window.location.href = '/auth'
                        }
                    }}>Post</button>
                </div>
            </div>
        </div>
    )
}


