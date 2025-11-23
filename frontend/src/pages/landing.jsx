import React, { useEffect, useState } from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

// Import page components
import Healthcare from './Healthcare'
import Finance from './Finance'
import Study from './Study'
import Travelling from './Travelling'
import SentimentAnalysis from './SentimentAnalysis'
import Meetings from './Meetings'
import Settings from './Settings'
import AISolution from './AISolution'

export default function LandingPage() {
    const [activePage, setActivePage] = useState('aisolution')
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // Check if user is logged in
    useEffect(() => {
        const checkAuth = () => {
            setIsLoggedIn(!!localStorage.getItem("token"))
        }
        checkAuth()
        // Listen for storage changes (logout/login from other tabs)
        window.addEventListener('storage', checkAuth)
        return () => window.removeEventListener('storage', checkAuth)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("token")
        setIsLoggedIn(false)
        navigate("/")
    }

    const sidebarOptions = [
        { id: 'aisolution', label: 'AI Solution', icon: '🤖' },
        { id: 'healthcare', label: 'Healthcare', icon: '🩺' },
        { id: 'finance', label: 'Finance', icon: '💹' },
        { id: 'study', label: 'Study', icon: '📚' },
        { id: 'travelling', label: 'Travelling', icon: '✈️' },
        { id: 'sentiment', label: 'Sentiment', icon: '🧠' },
         { id: 'meetings', label: 'Meetings', icon: '📞' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ]

    // Sync active section with URL hash to support redirecting back after login
    useEffect(() => {
        const setFromHash = () => {
            const hash = window.location.hash.replace('#','');
            if (hash && sidebarOptions.find(s => s.id === hash)) {
                setActivePage(hash)
            }
        }
        setFromHash()
        window.addEventListener('hashchange', setFromHash)
        return () => window.removeEventListener('hashchange', setFromHash)
    }, [])

    const renderActivePage = () => {
        switch (activePage) {
            case 'aisolution':
                return <AISolution />
            case 'healthcare':
                return <Healthcare />
            case 'finance':
                return <Finance />
            case 'study':
                return <Study />
            case 'travelling':
                return <Travelling />
            case 'sentiment':
                return <SentimentAnalysis />
            case 'meetings':
                return <Meetings />
            case 'settings':
                return <Settings />
            default:
                return <AISolution />
        }
    }

    return (
        <div className='landingPageContainer'>
            {/* Navbar */}
            <nav className='navbar'>
                <div className='navHeader'>
                    <h2>BYTE.AI</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => navigate("/aljk23")}>Join as Guest</p>
                    {isLoggedIn ? (
                        <>
                            <div className="btn btn-primary" onClick={() => navigate("/home")} role='button'>
                                Chat
                            </div>
                            <div className="btn btn-danger" onClick={handleLogout} role='button'>
                                Logout
                            </div>
                        </>
                    ) : (
                        <div className="btn btn-danger" onClick={() => navigate("/auth")} role='button'>
                            Login
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Layout */}
            <div className="mainLayout">
                {/* Sidebar */}
                <div className="sidebar">
                
                    <div className="sidebarOptions">
                        {sidebarOptions.map((option) => (
                            <div
                                key={option.id}
                                className={`sidebarOption ${activePage === option.id ? 'active' : ''}`}
                                onClick={() => setActivePage(option.id)}
                            >
                                <span className="optionIcon">{option.icon}</span>
                                <span className="optionLabel">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mainContent">
                    {renderActivePage()}
                </div>
            </div>
        </div>
    )
}
