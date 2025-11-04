import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [getHistoryOfUser])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    let formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    let joinMeeting = (meetingCode) => {
        routeTo(`/${meetingCode}`);
    }

    return (
        <div className="historyContainer">
            {/* Background Elements */}
            <div className="historyBackground">
                <div className="historyGradient"></div>
                <div className="historyPattern"></div>
            </div>

            {/* Header */}
            <div className="historyHeader">
                <button 
                    className="backButton"
                    onClick={() => routeTo("/home")}
                >
                    <span className="backIcon">←</span>
                    <span>Back to Home</span>
                </button>
                <div className="headerContent">
                    <h1>Meeting History</h1>
                    <p>Your recent video call sessions</p>
                </div>
            </div>

            {/* Content */}
            <div className="historyContent">
                {loading ? (
                    <div className="loadingState">
                        <div className="loadingSpinner"></div>
                        <p>Loading your meeting history...</p>
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="emptyState">
                        <div className="emptyIcon">📋</div>
                        <h3>No meetings yet</h3>
                        <p>Start your first video call to see it here</p>
                        <button 
                            className="primaryButton"
                            onClick={() => routeTo("/home")}
                        >
                            Start a Meeting
                        </button>
                    </div>
                ) : (
                    <div className="meetingsList">
                        {meetings.map((meeting, index) => (
                            <div key={index} className="meetingCard">
                                <div className="meetingCardHeader">
                                    <div className="meetingIcon">
                                        <span>📹</span>
                                    </div>
                                    <div className="meetingInfo">
                                        <h3>Meeting {meeting.meetingCode}</h3>
                                        <div className="meetingMeta">
                                            <span className="meetingDate">
                                                📅 {formatDate(meeting.date)}
                                            </span>
                                            <span className="meetingTime">
                                                🕐 {formatTime(meeting.date)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="meetingActions">
                                        <button 
                                            className="joinButton"
                                            onClick={() => joinMeeting(meeting.meetingCode)}
                                        >
                                            <span>Join Again</span>
                                            <span className="buttonArrow">→</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="meetingCardFooter">
                                    <div className="meetingCode">
                                        <span className="codeLabel">Code:</span>
                                        <span className="codeValue">{meeting.meetingCode}</span>
                                    </div>
                                    <div className="meetingStatus">
                                        <span className="statusDot"></span>
                                        <span>Completed</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Section */}
            {meetings.length > 0 && (
                <div className="historyStats">
                    <div className="statsCard">
                        <div className="statItem">
                            <div className="statNumber">{meetings.length}</div>
                            <div className="statLabel">Total Meetings</div>
                        </div>
                        <div className="statItem">
                            <div className="statNumber">
                                {meetings.filter(m => {
                                    const meetingDate = new Date(m.date);
                                    const today = new Date();
                                    return meetingDate.toDateString() === today.toDateString();
                                }).length}
                            </div>
                            <div className="statLabel">Today</div>
                        </div>
                        <div className="statItem">
                            <div className="statNumber">
                                {meetings.filter(m => {
                                    const meetingDate = new Date(m.date);
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return meetingDate >= weekAgo;
                                }).length}
                            </div>
                            <div className="statLabel">This Week</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}