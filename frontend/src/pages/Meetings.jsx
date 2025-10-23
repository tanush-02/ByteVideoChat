import React, { useState } from 'react'

export default function Meetings() {
    const [meetings] = useState([
        {
            id: 1,
            title: "Team Standup",
            time: "09:00 AM",
            date: "Today",
            participants: 8,
            status: "upcoming"
        },
        {
            id: 2,
            title: "Client Presentation",
            time: "02:00 PM",
            date: "Today",
            participants: 12,
            status: "upcoming"
        },
        {
            id: 3,
            title: "Project Review",
            time: "10:30 AM",
            date: "Yesterday",
            participants: 5,
            status: "completed"
        },
        {
            id: 4,
            title: "Weekly Sync",
            time: "11:00 AM",
            date: "Monday",
            participants: 15,
            status: "completed"
        }
    ])

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
                <button className="primaryButton">+ New Meeting</button>
            </div>
            
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




