import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPendingMeetings, acceptMeetingRequest, scheduleMeetingRequest } from '../services/meetingService'

export default function Meetings() {
    const navigate = useNavigate()
    const [meetings] = useState([
        {
            id: 1,
            title: "Dermatology Consultation",
            time: "09:00 AM",
            date: "Today",
            participants: 8,
            status: "upcoming"
        },
        {
            id: 2,
            title: "Cardiology Follow-up",
            time: "02:00 PM",
            date: "Today",
            participants: 12,
            status: "upcoming"
        },
        {
            id: 3,
            title: "Travel Agent Meeting",
            time: "10:30 AM",
            date: "Yesterday",
            participants: 5,
            status: "completed"
        },
        {
            id: 4,
            title: "Math Tutoring Session",
            time: "11:00 AM",
            date: "Monday",
            participants: 15,
            status: "completed"
        }
    ])

    const [pendingMeetings, setPendingMeetings] = useState([])
    const [loadingPending, setLoadingPending] = useState(false)
    const [creatingMeeting, setCreatingMeeting] = useState(false)
    const isAdmin = (localStorage.getItem('role') || '').toLowerCase() === 'admin'

    useEffect(() => {
        if (!isAdmin) return
        let timer
        const loadMeetings = async () => {
            try {
                setLoadingPending(true)
                const response = await fetchPendingMeetings()
                setPendingMeetings(response.meetings || [])
            } catch (error) {
                console.error('Failed to load pending meetings', error)
            } finally {
                setLoadingPending(false)
            }
        }
        loadMeetings()
        timer = setInterval(loadMeetings, 15000)
        return () => clearInterval(timer)
    }, [isAdmin])

    const handleCreateMeeting = async () => {
        try {
            setCreatingMeeting(true)
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
            await scheduleMeetingRequest(randomCode)
            alert(`Meeting created! Code: ${randomCode}\nWaiting for admin to join...`)
            // Optionally navigate to home or stay on meetings page
            // navigate('/home')
        } catch (error) {
            alert(error.message || 'Failed to create meeting')
        } finally {
            setCreatingMeeting(false)
        }
    }

    const handleAccept = async (meetingId, meetingCode) => {
        try {
            await acceptMeetingRequest(meetingId)
            setPendingMeetings((prev) => prev.filter((meeting) => meeting._id !== meetingId))
            navigate(`/${meetingCode}`)
        } catch (error) {
            alert(error.message || 'Failed to accept meeting')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return '#4CAF50'
            case 'completed': return '#2196F3'
            case 'cancelled': return '#f44336'
            default: return '#757575'
        }
    }

    return (
        <div className="pageContainer">
            <div className="pageHeader">
                <h2>Meetings</h2>
                <button 
                    className="primaryButton" 
                    onClick={handleCreateMeeting}
                    disabled={creatingMeeting}
                >
                    {creatingMeeting ? 'Creating...' : '+ New Meeting'}
                </button>
            </div>

            {isAdmin && (
                <div className="adminPanel">
                    <div className="adminPanelHeader">
                        <h3>Pending Meeting Requests</h3>
                        {loadingPending && <span className="smallInfo">Refreshing...</span>}
                    </div>
                    {pendingMeetings.length === 0 ? (
                        <p>No pending meetings right now.</p>
                    ) : (
                        <div className="meetingsList">
                            {pendingMeetings.map((meeting) => (
                                <div key={meeting._id} className="meetingCard">
                                    <div className="meetingInfo">
                                        <h3>Meeting Code: {meeting.meetingCode}</h3>
                                        <div className="meetingDetails">
                                            <span className="meetingDate">Requested by {meeting.initiator}</span>
                                            {meeting.scheduledFor && (
                                                <span className="meetingTime">
                                                    Scheduled for {new Date(meeting.scheduledFor).toLocaleString()}
                                                </span>
                                            )}
                                            <span className="meetingStatus" style={{ color: '#fbbf24' }}>
                                                Pending
                                            </span>
                                        </div>
                                    </div>
                                    <div className="meetingActions">
                                        <button
                                            className="actionButton"
                                            onClick={() => handleAccept(meeting._id, meeting.meetingCode)}
                                        >
                                            Accept & Join
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="meetingsList">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="meetingCard">
                        <div className="meetingInfo">
                            <h3>{meeting.title}</h3>
                            <div className="meetingDetails">
                                <span className="meetingTime">{meeting.time}</span>
                                <span className="meetingDate">{meeting.date}</span>
                                <span className="meetingParticipants">{meeting.participants} participants</span>
                            </div>
                        </div>
                        <div className="meetingActions">
                            <span 
                                className="meetingStatus"
                                style={{ color: getStatusColor(meeting.status) }}
                            >
                                {meeting.status}
                            </span>
                            <button className="actionButton">
                                {meeting.status === 'upcoming' ? 'Join' : 'View'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}




