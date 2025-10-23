import React from 'react'

export default function Dashboard() {
    return (
        <div className="pageContainer">
            <h2>Dashboard</h2>
            <div className="dashboardContent">
                <div className="statsGrid">
                    <div className="statCard">
                        <h3>Total Meetings</h3>
                        <p className="statNumber">24</p>
                    </div>
                    <div className="statCard">
                        <h3>Active Users</h3>
                        <p className="statNumber">156</p>
                    </div>
                    <div className="statCard">
                        <h3>Meeting Hours</h3>
                        <p className="statNumber">48.5</p>
                    </div>
                    <div className="statCard">
                        <h3>Success Rate</h3>
                        <p className="statNumber">98%</p>
                    </div>
                </div>
                <div className="recentActivity">
                    <h3>Recent Activity</h3>
                    <div className="activityList">
                        <div className="activityItem">
                            <span className="activityIcon">📹</span>
                            <div className="activityDetails">
                                <p>Meeting with Team Alpha</p>
                                <span className="activityTime">2 hours ago</span>
                            </div>
                        </div>
                        <div className="activityItem">
                            <span className="activityIcon">👥</span>
                            <div className="activityDetails">
                                <p>Group call with 5 participants</p>
                                <span className="activityTime">4 hours ago</span>
                            </div>
                        </div>
                        <div className="activityItem">
                            <span className="activityIcon">🎯</span>
                            <div className="activityDetails">
                                <p>Project review meeting</p>
                                <span className="activityTime">1 day ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}




