import React, { useState } from 'react'

export default function Settings() {
    const [settings, setSettings] = useState({
        notifications: true,
        autoJoin: false,
        videoQuality: 'high',
        audioQuality: 'high',
        theme: 'light'
    })

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    return (
        <div className="pageContainer">
            <h2>Settings</h2>
            
            <div className="settingsSections">
                <div className="settingsSection">
                    <h3>General</h3>
                    <div className="settingItem">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.notifications}
                                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                            />
                            Enable notifications
                        </label>
                    </div>
                    <div className="settingItem">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.autoJoin}
                                onChange={(e) => handleSettingChange('autoJoin', e.target.checked)}
                            />
                            Auto-join meetings
                        </label>
                    </div>
                </div>

                <div className="settingsSection">
                    <h3>Video & Audio</h3>
                    <div className="settingItem">
                        <label>Video Quality</label>
                        <select 
                            value={settings.videoQuality}
                            onChange={(e) => handleSettingChange('videoQuality', e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="settingItem">
                        <label>Audio Quality</label>
                        <select 
                            value={settings.audioQuality}
                            onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div className="settingsSection">
                    <h3>Appearance</h3>
                    <div className="settingItem">
                        <label>Theme</label>
                        <select 
                            value={settings.theme}
                            onChange={(e) => handleSettingChange('theme', e.target.value)}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                </div>

                <div className="settingsActions">
                    <button className="primaryButton">Save Changes</button>
                    <button className="secondaryButton">Reset to Default</button>
                </div>
            </div>
        </div>
    )
}




