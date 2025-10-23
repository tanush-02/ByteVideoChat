import React, { useState } from 'react'

export default function Profile() {
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Tech Solutions Inc.',
        position: 'Software Engineer',
        bio: 'Passionate about technology and video communication solutions.'
    })

    const [isEditing, setIsEditing] = useState(false)

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = () => {
        // Here you would typically save to backend
        console.log('Profile saved:', profile)
        setIsEditing(false)
    }

    return (
        <div className="pageContainer">
            <div className="profileHeader">
                <h2>Profile</h2>
                <button 
                    className="primaryButton"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            <div className="profileContent">
                <div className="profileAvatar">
                    <div className="avatar">
                        <span className="avatarText">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                    {isEditing && (
                        <button className="changeAvatarButton">Change Photo</button>
                    )}
                </div>

                <div className="profileForm">
                    <div className="formGroup">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="formGroup">
                        <label>Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="formGroup">
                        <label>Phone</label>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="formGroup">
                        <label>Company</label>
                        <input
                            type="text"
                            value={profile.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="formGroup">
                        <label>Position</label>
                        <input
                            type="text"
                            value={profile.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="formGroup">
                        <label>Bio</label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            disabled={!isEditing}
                            rows="4"
                        />
                    </div>

                    {isEditing && (
                        <div className="formActions">
                            <button className="primaryButton" onClick={handleSave}>
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}



