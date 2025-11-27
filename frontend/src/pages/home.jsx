import React, { useContext, useState, useEffect } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';
import { scheduleMeetingRequest } from '../services/meetingService';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scheduleStatus, setScheduleStatus] = useState({ state: 'idle', message: '' });
    const [aiInsights, setAiInsights] = useState({
        mood: 'analyzing',
        nextAction: 'Click to start analysis',
        sentiment: 0,
        recommendations: ['Open sentiment analysis for detailed insights']
    });

    const {addToUserHistory} = useContext(AuthContext);

    useEffect(() => {
        // Get real sentiment data from localStorage or API
        const getSentimentData = () => {
            try {
                const storedSentiment = localStorage.getItem('currentSentiment');
                const storedScore = localStorage.getItem('sentimentScore');
                
                if (storedSentiment && storedScore) {
                    const sentiment = JSON.parse(storedSentiment);
                    const score = parseFloat(storedScore);
                    
                    setAiInsights({
                        mood: sentiment === 'positive' ? 'productive' : sentiment === 'negative' ? 'needs attention' : 'neutral',
                        sentiment: Math.round(Math.abs(score) * 100),
                        nextAction: sentiment === 'positive' ? 'Great time for important tasks' : 
                                   sentiment === 'negative' ? 'Consider taking a break' : 'Stay engaged',
                        recommendations: [
                            sentiment === 'positive' ? 'Capitalize on your positive energy' :
                            sentiment === 'negative' ? 'Take a mindfulness break' :
                            'Engage in mood-boosting activities',
                            'Check detailed analysis in Sentiment page'
                        ]
                    });
                }
            } catch (error) {
                console.log('No sentiment data available');
            }
        };

        getSentimentData();
        const interval = setInterval(getSentimentData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handle keyboard navigation for sidebar
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [sidebarOpen]);
    
    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    let handleCreateMeeting = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setMeetingCode(randomCode);
        setIsCreating(true);
        setScheduleStatus({ state: 'pending', message: 'Notifying admin...' });

        try {
            await scheduleMeetingRequest(randomCode);
            setScheduleStatus({ state: 'waiting', message: 'Waiting for admin to join the meeting...' });
        } catch (error) {
            console.error('Failed to schedule meeting', error);
            setScheduleStatus({ state: 'error', message: error.message || 'Failed to notify admin' });
        }
    }

    let handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("username")
        navigate("/")
    }

    return (
        <div className="homeContainer">
            {/* AI Insights Sidebar */}
            <div 
                className={`aiSidebar ${sidebarOpen ? 'open' : ''}`}
                role="complementary"
                aria-label="AI Insights Sidebar"
                aria-hidden={!sidebarOpen}
            >
                <div className="sidebarHeader">
                    <h3>🧠 AI Insights</h3>
                    <button 
                        className="closeSidebar"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close AI Insights Sidebar"
                        tabIndex={sidebarOpen ? 0 : -1}
                    >
                        ×
                    </button>
                </div>
                
                <div className="sidebarContent">
                    <div className="insightCard">
                        <h4>Your Current Mood</h4>
                        <div className="moodIndicator" role="status" aria-live="polite">
                            <span className="moodEmoji" aria-hidden="true">
                                {aiInsights.mood === 'productive' ? '🚀' : 
                                 aiInsights.mood === 'needs attention' ? '⚠️' : '😌'}
                            </span>
                            <span className="moodText">{aiInsights.mood}</span>
                        </div>
                    </div>

                    <div className="insightCard">
                        <h4>Sentiment Score</h4>
                        <div className="sentimentBar" role="progressbar" aria-valuenow={aiInsights.sentiment} aria-valuemin="0" aria-valuemax="100">
                            <div 
                                className="sentimentFill"
                                style={{width: `${aiInsights.sentiment}%`}}
                            ></div>
                            <span className="sentimentScore">{aiInsights.sentiment}%</span>
                        </div>
                    </div>

                    <div className="insightCard">
                        <h4>Recommended Next Action</h4>
                        <div className="nextAction" role="status" aria-live="polite">
                            <span className="actionIcon" aria-hidden="true">💡</span>
                            <span>{aiInsights.nextAction}</span>
                        </div>
                    </div>

                    <div className="insightCard">
                        <h4>AI Recommendations</h4>
                        <div className="recommendations">
                            {aiInsights.recommendations.map((rec, index) => (
                                <div key={index} className="recommendation">
                                    <span className="recIcon" aria-hidden="true">✨</span>
                                    <span>{rec}</span>
                                </div>
                            ))}
                        </div>
                        <button 
                            className="sentimentButton"
                            onClick={() => navigate("/sentiment")}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                            tabIndex={sidebarOpen ? 0 : -1}
                            aria-label="Navigate to full sentiment analysis page"
                        >
                            🧠 View Full Analysis
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle Button */}
            <button 
                className="sidebarToggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open AI Insights Sidebar"
                aria-expanded={sidebarOpen}
                aria-controls="ai-sidebar"
            >
                🧠 AI
            </button>

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
                        className="navButton sentimentButton"
                        onClick={() => navigate("/sentiment")}
                    >
                        <span className="buttonIcon">🧠</span>
                        <span>Sentiment</span>
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
                            <span className="gradientText">Connect</span> with your Experts
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

                            <div className="divider">
                                <span>OR</span>
                            </div>

                            <div className="videoChatSection">
                                <h3>Quick Video Chat</h3>
                                <button 
                                    className="actionButton videoChatButton"
                                    onClick={() => {
                                        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                                        navigate(`/${randomCode}`);
                                    }}
                                >
                                    <span className="buttonIcon">📹</span>
                                    <span>Start Video Chat</span>
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
                                        {scheduleStatus.message && (
                                            <p className={`scheduleMessage ${scheduleStatus.state}`}>
                                                {scheduleStatus.message}
                                            </p>
                                        )}
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