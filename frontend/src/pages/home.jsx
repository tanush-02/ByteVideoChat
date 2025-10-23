import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const {addToUserHistory} = useContext(AuthContext);
    
    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    let handleCreateMeeting = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setMeetingCode(randomCode);
        setIsCreating(true);
    }

    let handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/auth")
    }

    return (
        <div className="homeContainer">
            {/* Background Elements */}
            <div className="homeBackground">
                <div className="homeGradient"></div>
                <div className="homePattern"></div>
            </div>

            {/* Navigation */}
            <nav className="homeNavbar">
                <div className="navBrand">
                    <div className="brandIcon">🎥</div>
                    <h1>BYTE.ai</h1>
                </div>
                <div className="navActions">
                    <button 
                        className="navButton historyButton"
                        onClick={() => navigate("/history")}
                    >
                        <span className="buttonIcon">📋</span>
                        <span>History</span>
                    </button>
                    <button 
                        className="navButton logoutButton"
                        onClick={handleLogout}
                    >
                        <span className="buttonIcon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="homeMain">
                <div className="homeContent">
                    <div className="heroSection">
                        <h2 className="heroTitle">
                            <span className="gradientText">Connect</span> with your loved ones
                        </h2>
                        <p className="heroSubtitle">
                            High-quality video calls with crystal clear audio and seamless experience
                        </p>

                        <div className="meetingActions">
                            <div className="joinSection">
                                <h3>Join a Meeting</h3>
                                <div className="inputGroup">
                                    <input
                                        type="text"
                                        placeholder="Enter meeting code"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                                        className="meetingInput"
                                        maxLength="6"
                                    />
                                    <button 
                                        className="actionButton joinButton"
                                        onClick={handleJoinVideoCall}
                                        disabled={!meetingCode.trim()}
                                    >
                                        <span>Join Meeting</span>
                                        <span className="buttonArrow">→</span>
                                    </button>
                                </div>
                            </div>

                            <div className="divider">
                                <span>OR</span>
                            </div>

                            <div className="createSection">
                                <h3>Start a New Meeting</h3>
                                <button 
                                    className="actionButton createButton"
                                    onClick={handleCreateMeeting}
                                >
                                    <span className="buttonIcon">➕</span>
                                    <span>Create Meeting</span>
                                </button>
                            </div>
                        </div>

                        {isCreating && meetingCode && (
                            <div className="meetingCreated">
                                <div className="successCard">
                                    <div className="successIcon">✅</div>
                                    <div className="successContent">
                                        <h4>Meeting Created!</h4>
                                        <p>Share this code with others: <strong>{meetingCode}</strong></p>
                                        <button 
                                            className="copyButton"
                                            onClick={() => {
                                                navigator.clipboard.writeText(meetingCode);
                                            }}
                                        >
                                            📋 Copy Code
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="featuresSection">
                        <h3>Why Choose Tanush Video Call?</h3>
                        <div className="featuresGrid">
                            <div className="featureCard">
                                <div className="featureIcon">🔒</div>
                                <h4>Secure</h4>
                                <p>End-to-end encryption for all your conversations</p>
                            </div>
                            <div className="featureCard">
                                <div className="featureIcon">⚡</div>
                                <h4>Fast</h4>
                                <p>Low latency and high-quality video streaming</p>
                            </div>
                            <div className="featureCard">
                                <div className="featureIcon">📱</div>
                                <h4>Cross-Platform</h4>
                                <p>Works on all devices and browsers</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="homeVisual">
                    <div className="visualContainer">
                        <div className="videoPreview">
                            <div className="videoPlaceholder">
                                <div className="videoIcon">📹</div>
                                <p>Video Call Preview</p>
                            </div>
                        </div>
                        <div className="floatingElements">
                            <div className="floatingElement element1">💬</div>
                            <div className="floatingElement element2">📊</div>
                            <div className="floatingElement element3">🎯</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default withAuth(HomeComponent)