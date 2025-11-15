import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchHealthTips, fetchHealthNews } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { 
    getHealthRecord, 
    addDisease, 
    addMedication, 
    addExercise, 
    addDailyMetrics, 
    addDoctor, 
    addCheckup,
    deleteHealthItem 
} from '../services/healthService'
import './DomainPages.css'
import './Healthcare.css'

export default function Healthcare() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [healthTip, setHealthTip] = useState('')
    const [healthNews, setHealthNews] = useState(null)
    const [aiInsight, setAiInsight] = useState('')
    
    // Health tracking state
    const [healthData, setHealthData] = useState(null)
    const [activeTab, setActiveTab] = useState('overview')
    const [showForm, setShowForm] = useState({})
    
    // Form states
    const [diseaseForm, setDiseaseForm] = useState({ name: '', diagnosedDate: '', curedDate: '', notes: '', type: 'current' })
    const [medicationForm, setMedicationForm] = useState({ name: '', dosage: '', frequency: '', startDate: '', endDate: '', notes: '', isActive: true })
    const [exerciseForm, setExerciseForm] = useState({ type: '', duration: '', caloriesBurned: '', date: new Date().toISOString().split('T')[0], notes: '' })
    const [metricsForm, setMetricsForm] = useState({ date: new Date().toISOString().split('T')[0], steps: '', heartRate: '', weight: '', systolic: '', diastolic: '', notes: '' })
    const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', contact: '', email: '', address: '', notes: '' })
    const [checkupForm, setCheckupForm] = useState({ type: '', scheduledDate: '', doctorName: '', location: '', notes: '', reminder: true })

    useEffect(() => {
        const loadHealthData = async () => {
            setLoading(true)
            try {
                const [tip, news] = await Promise.all([
                    fetchHealthTips(),
                    fetchHealthNews()
                ])
                
                setHealthTip(tip)
                setHealthNews(news)
                
                try {
                    const insight = await getDomainInsights('healthcare', `Health tip: ${tip}`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Providing healthcare recommendations and wellness strategies...')
                }
            } catch (error) {
                console.error('Error loading health data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadHealthData()
        const interval = setInterval(loadHealthData, 300000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const list = await getComments('healthcare')
            setComments(list)
        }
        load()
        const id = setInterval(load, 8000)
        return () => clearInterval(id)
    }, [getComments])

    useEffect(() => {
        loadHealthRecord()
    }, [])

    const loadHealthRecord = async () => {
        if (!localStorage.getItem("token")) return
        try {
            const data = await getHealthRecord()
            setHealthData(data)
        } catch (error) {
            console.error('Error loading health record:', error)
        }
    }

    const handleExpertChat = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/${randomCode}`);
    }

    const handleAddDisease = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const disease = {
                name: diseaseForm.name,
                diagnosedDate: diseaseForm.diagnosedDate || undefined,
                curedDate: diseaseForm.type === 'previous' ? diseaseForm.curedDate : undefined,
                notes: diseaseForm.notes || undefined
            }
            if (diseaseForm.type === 'current') {
                disease.severity = 'Mild'
            }
            await addDisease(diseaseForm.type, disease)
            setDiseaseForm({ name: '', diagnosedDate: '', curedDate: '', notes: '', type: 'current' })
            setShowForm({ ...showForm, disease: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add disease. Please try again.")
        }
    }

    const handleAddMedication = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const medication = {
                name: medicationForm.name,
                dosage: medicationForm.dosage,
                frequency: medicationForm.frequency,
                startDate: medicationForm.startDate || undefined,
                endDate: medicationForm.endDate || undefined,
                isActive: medicationForm.isActive,
                notes: medicationForm.notes || undefined
            }
            await addMedication(medication)
            setMedicationForm({ name: '', dosage: '', frequency: '', startDate: '', endDate: '', notes: '', isActive: true })
            setShowForm({ ...showForm, medication: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add medication. Please try again.")
        }
    }

    const handleAddExercise = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const exercise = {
                type: exerciseForm.type,
                duration: parseInt(exerciseForm.duration),
                date: exerciseForm.date || new Date(),
                caloriesBurned: exerciseForm.caloriesBurned ? parseInt(exerciseForm.caloriesBurned) : undefined,
                notes: exerciseForm.notes || undefined
            }
            await addExercise(exercise)
            setExerciseForm({ type: '', duration: '', caloriesBurned: '', date: new Date().toISOString().split('T')[0], notes: '' })
            setShowForm({ ...showForm, exercise: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add exercise. Please try again.")
        }
    }

    const handleAddMetrics = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const metrics = {
                date: metricsForm.date || new Date(),
                steps: metricsForm.steps ? parseInt(metricsForm.steps) : 0,
                heartRate: metricsForm.heartRate ? parseInt(metricsForm.heartRate) : undefined,
                weight: metricsForm.weight ? parseFloat(metricsForm.weight) : undefined,
                bloodPressure: (metricsForm.systolic || metricsForm.diastolic) ? {
                    systolic: metricsForm.systolic ? parseInt(metricsForm.systolic) : undefined,
                    diastolic: metricsForm.diastolic ? parseInt(metricsForm.diastolic) : undefined
                } : undefined,
                notes: metricsForm.notes || undefined
            }
            await addDailyMetrics(metrics)
            setMetricsForm({ date: new Date().toISOString().split('T')[0], steps: '', heartRate: '', weight: '', systolic: '', diastolic: '', notes: '' })
            setShowForm({ ...showForm, metrics: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add metrics. Please try again.")
        }
    }

    const handleAddDoctor = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const doctor = {
                name: doctorForm.name,
                specialization: doctorForm.specialization || undefined,
                contact: doctorForm.contact || undefined,
                email: doctorForm.email || undefined,
                address: doctorForm.address || undefined,
                notes: doctorForm.notes || undefined
            }
            await addDoctor(doctor)
            setDoctorForm({ name: '', specialization: '', contact: '', email: '', address: '', notes: '' })
            setShowForm({ ...showForm, doctor: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add doctor. Please try again.")
        }
    }

    const handleAddCheckup = async (e) => {
        e.preventDefault()
        if (!localStorage.getItem("token")) {
            alert("Please login to add health data")
            return
        }
        try {
            const checkup = {
                type: checkupForm.type,
                scheduledDate: checkupForm.scheduledDate,
                doctorName: checkupForm.doctorName || undefined,
                location: checkupForm.location || undefined,
                notes: checkupForm.notes || undefined,
                reminder: checkupForm.reminder
            }
            await addCheckup(checkup)
            setCheckupForm({ type: '', scheduledDate: '', doctorName: '', location: '', notes: '', reminder: true })
            setShowForm({ ...showForm, checkup: false })
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to add checkup. Please try again.")
        }
    }

    const handleDelete = async (category, itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return
        try {
            await deleteHealthItem(category, itemId)
            await loadHealthRecord()
        } catch (error) {
            alert("Failed to delete item. Please try again.")
        }
    }

    async function handlePostComment() {
        if (!newComment.trim()) return
        try {
            await addComment('healthcare', newComment)
            setNewComment('')
            const list = await getComments('healthcare')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }

    const isAuthenticated = localStorage.getItem("token")

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>🩺 Healthcare & Wellness</h2>
                <p className="domain-subtitle">AI-powered health insights and comprehensive health tracking</p>
            </div>

            {/* Tabs */}
            <div className="health-tabs">
                <button 
                    className={activeTab === 'overview' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={activeTab === 'tracking' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('tracking')}
                >
                    Health Tracking
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading health insights...</p>
                        </div>
                    ) : (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card health-card">
                                    <div className="stat-icon">❤️</div>
                                    <h3>Daily Wellness</h3>
                                    <p className="stat-content">{healthTip}</p>
                                    <p className="stat-update">Updated: {new Date().toLocaleTimeString()}</p>
                                </div>
                                <div className="stat-card health-card">
                                    <div className="stat-icon">💡</div>
                                    <h3>Health Tips</h3>
                                    <p className="stat-content">Stay hydrated, get regular exercise, and maintain a balanced diet for optimal health.</p>
                                    <p className="stat-update">Live Guidance</p>
                                </div>
                                <div className="stat-card health-card">
                                    <div className="stat-icon">📊</div>
                                    <h3>Wellness Metrics</h3>
                                    <p className="stat-content">Track your daily activity, sleep quality, and hydration levels for better health outcomes.</p>
                                    <p className="stat-update">AI Monitored</p>
                                </div>
                            </div>

                            <div className="ai-insight-card">
                                <div className="ai-header">
                                    <span className="ai-icon">🤖</span>
                                    <h3>AI Health Recommendation</h3>
                                </div>
                                <div className="ai-content">
                                    <MarkdownRenderer content={aiInsight} />
                                </div>
                                <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                            </div>

                            {healthNews && (
                                <div className="news-card">
                                    <h3>📰 Latest Health Updates</h3>
                                    <p>{healthNews.content}</p>
                                    <span className="news-source">Source: {healthNews.source}</span>
                                </div>
                            )}

                            <div className="expert-chat-card">
                                <div className="expert-header">
                                    <span className="expert-icon">👨‍⚕️</span>
                                    <div>
                                        <h3>Need Medical Advice?</h3>
                                        <p>Connect with a healthcare expert for personalized consultation</p>
                                    </div>
                                </div>
                                <button className="expert-button" onClick={handleExpertChat}>
                                    <span>📹</span>
                                    Start Video Consultation
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {activeTab === 'tracking' && (
                <div className="health-tracking-container">
                    {!isAuthenticated ? (
                        <div className="login-prompt">
                            <p>Please login to access health tracking features</p>
                            <button 
                                className="login-button" 
                                onClick={() => {
                                    localStorage.setItem('postLoginRedirect', `/#healthcare`)
                                    window.location.href = '/auth'
                                }}
                            >
                                Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Disease Tracking */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>🩺 Disease History</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, disease: !showForm.disease })}>
                                        {showForm.disease ? 'Cancel' : '+ Add Disease'}
                                    </button>
                                </div>
                                
                                {showForm.disease && (
                                    <form className="health-form" onSubmit={handleAddDisease}>
                                        <select value={diseaseForm.type} onChange={(e) => setDiseaseForm({ ...diseaseForm, type: e.target.value })}>
                                            <option value="current">Current Disease</option>
                                            <option value="previous">Previous Disease</option>
                                        </select>
                                        <input type="text" placeholder="Disease Name *" value={diseaseForm.name} onChange={(e) => setDiseaseForm({ ...diseaseForm, name: e.target.value })} required />
                                        <input type="date" placeholder="Diagnosed Date" value={diseaseForm.diagnosedDate} onChange={(e) => setDiseaseForm({ ...diseaseForm, diagnosedDate: e.target.value })} />
                                        {diseaseForm.type === 'previous' && (
                                            <input type="date" placeholder="Cured Date" value={diseaseForm.curedDate} onChange={(e) => setDiseaseForm({ ...diseaseForm, curedDate: e.target.value })} />
                                        )}
                                        <textarea placeholder="Notes" value={diseaseForm.notes} onChange={(e) => setDiseaseForm({ ...diseaseForm, notes: e.target.value })} />
                                        <button type="submit">Add Disease</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.currentDiseases?.map((disease, idx) => (
                                        <div key={idx} className="health-item">
                                            <div className="item-header">
                                                <h4>{disease.name}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('currentDiseases', disease._id)}>×</button>
                                            </div>
                                            <p><strong>Severity:</strong> {disease.severity || 'N/A'}</p>
                                            {disease.diagnosedDate && <p><strong>Diagnosed:</strong> {new Date(disease.diagnosedDate).toLocaleDateString()}</p>}
                                            {disease.notes && <p>{disease.notes}</p>}
                                        </div>
                                    ))}
                                    {healthData?.previousDiseases?.map((disease, idx) => (
                                        <div key={idx} className="health-item">
                                            <div className="item-header">
                                                <h4>{disease.name}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('previousDiseases', disease._id)}>×</button>
                                            </div>
                                            {disease.diagnosedDate && <p><strong>Diagnosed:</strong> {new Date(disease.diagnosedDate).toLocaleDateString()}</p>}
                                            {disease.curedDate && <p><strong>Cured:</strong> {new Date(disease.curedDate).toLocaleDateString()}</p>}
                                            {disease.notes && <p>{disease.notes}</p>}
                                        </div>
                                    ))}
                                    {(!healthData?.currentDiseases?.length && !healthData?.previousDiseases?.length) && (
                                        <p className="empty-state">No diseases recorded yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Medication Tracking */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>💊 Medications</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, medication: !showForm.medication })}>
                                        {showForm.medication ? 'Cancel' : '+ Add Medication'}
                                    </button>
                                </div>
                                
                                {showForm.medication && (
                                    <form className="health-form" onSubmit={handleAddMedication}>
                                        <input type="text" placeholder="Medication Name *" value={medicationForm.name} onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })} required />
                                        <input type="text" placeholder="Dosage *" value={medicationForm.dosage} onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })} required />
                                        <input type="text" placeholder="Frequency (e.g., Once daily) *" value={medicationForm.frequency} onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })} required />
                                        <input type="date" placeholder="Start Date" value={medicationForm.startDate} onChange={(e) => setMedicationForm({ ...medicationForm, startDate: e.target.value })} />
                                        <input type="date" placeholder="End Date" value={medicationForm.endDate} onChange={(e) => setMedicationForm({ ...medicationForm, endDate: e.target.value })} />
                                        <label>
                                            <input type="checkbox" checked={medicationForm.isActive} onChange={(e) => setMedicationForm({ ...medicationForm, isActive: e.target.checked })} />
                                            Active Medication
                                        </label>
                                        <textarea placeholder="Notes" value={medicationForm.notes} onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })} />
                                        <button type="submit">Add Medication</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.medications?.map((med, idx) => (
                                        <div key={idx} className={`health-item ${med.isActive ? 'active' : ''}`}>
                                            <div className="item-header">
                                                <h4>{med.name}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('medications', med._id)}>×</button>
                                            </div>
                                            <p><strong>Dosage:</strong> {med.dosage}</p>
                                            <p><strong>Frequency:</strong> {med.frequency}</p>
                                            {med.startDate && <p><strong>Start:</strong> {new Date(med.startDate).toLocaleDateString()}</p>}
                                            {med.endDate && <p><strong>End:</strong> {new Date(med.endDate).toLocaleDateString()}</p>}
                                            <p><strong>Status:</strong> {med.isActive ? 'Active' : 'Inactive'}</p>
                                            {med.notes && <p>{med.notes}</p>}
                                        </div>
                                    ))}
                                    {!healthData?.medications?.length && (
                                        <p className="empty-state">No medications recorded yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Exercise Tracking */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>🏃 Exercise Tracking</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, exercise: !showForm.exercise })}>
                                        {showForm.exercise ? 'Cancel' : '+ Add Exercise'}
                                    </button>
                                </div>
                                
                                {showForm.exercise && (
                                    <form className="health-form" onSubmit={handleAddExercise}>
                                        <input type="text" placeholder="Exercise Type (e.g., Running, Walking) *" value={exerciseForm.type} onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value })} required />
                                        <input type="number" placeholder="Duration (minutes) *" value={exerciseForm.duration} onChange={(e) => setExerciseForm({ ...exerciseForm, duration: e.target.value })} required />
                                        <input type="number" placeholder="Calories Burned" value={exerciseForm.caloriesBurned} onChange={(e) => setExerciseForm({ ...exerciseForm, caloriesBurned: e.target.value })} />
                                        <input type="date" value={exerciseForm.date} onChange={(e) => setExerciseForm({ ...exerciseForm, date: e.target.value })} />
                                        <textarea placeholder="Notes" value={exerciseForm.notes} onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })} />
                                        <button type="submit">Add Exercise</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.exercises?.slice().reverse().map((ex, idx) => (
                                        <div key={idx} className="health-item">
                                            <div className="item-header">
                                                <h4>{ex.type}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('exercises', ex._id)}>×</button>
                                            </div>
                                            <p><strong>Duration:</strong> {ex.duration} minutes</p>
                                            {ex.caloriesBurned && <p><strong>Calories:</strong> {ex.caloriesBurned}</p>}
                                            {ex.date && <p><strong>Date:</strong> {new Date(ex.date).toLocaleDateString()}</p>}
                                            {ex.notes && <p>{ex.notes}</p>}
                                        </div>
                                    ))}
                                    {!healthData?.exercises?.length && (
                                        <p className="empty-state">No exercises recorded yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Daily Metrics */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>📊 Daily Metrics</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, metrics: !showForm.metrics })}>
                                        {showForm.metrics ? 'Cancel' : '+ Add Metrics'}
                                    </button>
                                </div>
                                
                                {showForm.metrics && (
                                    <form className="health-form" onSubmit={handleAddMetrics}>
                                        <input type="date" value={metricsForm.date} onChange={(e) => setMetricsForm({ ...metricsForm, date: e.target.value })} />
                                        <input type="number" placeholder="Steps Count" value={metricsForm.steps} onChange={(e) => setMetricsForm({ ...metricsForm, steps: e.target.value })} />
                                        <input type="number" placeholder="Heart Rate (bpm)" value={metricsForm.heartRate} onChange={(e) => setMetricsForm({ ...metricsForm, heartRate: e.target.value })} />
                                        <input type="number" step="0.1" placeholder="Weight (kg)" value={metricsForm.weight} onChange={(e) => setMetricsForm({ ...metricsForm, weight: e.target.value })} />
                                        <div className="form-row">
                                            <input type="number" placeholder="Systolic BP" value={metricsForm.systolic} onChange={(e) => setMetricsForm({ ...metricsForm, systolic: e.target.value })} />
                                            <input type="number" placeholder="Diastolic BP" value={metricsForm.diastolic} onChange={(e) => setMetricsForm({ ...metricsForm, diastolic: e.target.value })} />
                                        </div>
                                        <textarea placeholder="Notes" value={metricsForm.notes} onChange={(e) => setMetricsForm({ ...metricsForm, notes: e.target.value })} />
                                        <button type="submit">Add Metrics</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.dailyMetrics?.slice().reverse().map((metric, idx) => (
                                        <div key={idx} className="health-item">
                                            <div className="item-header">
                                                <h4>{new Date(metric.date).toLocaleDateString()}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('dailyMetrics', metric._id)}>×</button>
                                            </div>
                                            {metric.steps > 0 && <p><strong>Steps:</strong> {metric.steps.toLocaleString()}</p>}
                                            {metric.heartRate && <p><strong>Heart Rate:</strong> {metric.heartRate} bpm</p>}
                                            {metric.weight && <p><strong>Weight:</strong> {metric.weight} kg</p>}
                                            {metric.bloodPressure?.systolic && (
                                                <p><strong>Blood Pressure:</strong> {metric.bloodPressure.systolic}/{metric.bloodPressure.diastolic} mmHg</p>
                                            )}
                                            {metric.notes && <p>{metric.notes}</p>}
                                        </div>
                                    ))}
                                    {!healthData?.dailyMetrics?.length && (
                                        <p className="empty-state">No metrics recorded yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Doctors */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>👨‍⚕️ Doctors</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, doctor: !showForm.doctor })}>
                                        {showForm.doctor ? 'Cancel' : '+ Add Doctor'}
                                    </button>
                                </div>
                                
                                {showForm.doctor && (
                                    <form className="health-form" onSubmit={handleAddDoctor}>
                                        <input type="text" placeholder="Doctor Name *" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} required />
                                        <input type="text" placeholder="Specialization" value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })} />
                                        <input type="text" placeholder="Contact Number" value={doctorForm.contact} onChange={(e) => setDoctorForm({ ...doctorForm, contact: e.target.value })} />
                                        <input type="email" placeholder="Email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
                                        <textarea placeholder="Address" value={doctorForm.address} onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })} />
                                        <textarea placeholder="Notes" value={doctorForm.notes} onChange={(e) => setDoctorForm({ ...doctorForm, notes: e.target.value })} />
                                        <button type="submit">Add Doctor</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.doctors?.map((doctor, idx) => (
                                        <div key={idx} className="health-item">
                                            <div className="item-header">
                                                <h4>{doctor.name}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('doctors', doctor._id)}>×</button>
                                            </div>
                                            {doctor.specialization && <p><strong>Specialization:</strong> {doctor.specialization}</p>}
                                            {doctor.contact && <p><strong>Contact:</strong> {doctor.contact}</p>}
                                            {doctor.email && <p><strong>Email:</strong> {doctor.email}</p>}
                                            {doctor.address && <p><strong>Address:</strong> {doctor.address}</p>}
                                            {doctor.notes && <p>{doctor.notes}</p>}
                                        </div>
                                    ))}
                                    {!healthData?.doctors?.length && (
                                        <p className="empty-state">No doctors added yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Future Checkups */}
                            <div className="health-section">
                                <div className="section-header">
                                    <h3>📅 Future Checkups</h3>
                                    <button className="add-button" onClick={() => setShowForm({ ...showForm, checkup: !showForm.checkup })}>
                                        {showForm.checkup ? 'Cancel' : '+ Add Checkup'}
                                    </button>
                                </div>
                                
                                {showForm.checkup && (
                                    <form className="health-form" onSubmit={handleAddCheckup}>
                                        <input type="text" placeholder="Checkup Type *" value={checkupForm.type} onChange={(e) => setCheckupForm({ ...checkupForm, type: e.target.value })} required />
                                        <input type="datetime-local" placeholder="Scheduled Date *" value={checkupForm.scheduledDate} onChange={(e) => setCheckupForm({ ...checkupForm, scheduledDate: e.target.value })} required />
                                        <input type="text" placeholder="Doctor Name" value={checkupForm.doctorName} onChange={(e) => setCheckupForm({ ...checkupForm, doctorName: e.target.value })} />
                                        <input type="text" placeholder="Location" value={checkupForm.location} onChange={(e) => setCheckupForm({ ...checkupForm, location: e.target.value })} />
                                        <label>
                                            <input type="checkbox" checked={checkupForm.reminder} onChange={(e) => setCheckupForm({ ...checkupForm, reminder: e.target.checked })} />
                                            Set Reminder
                                        </label>
                                        <textarea placeholder="Notes" value={checkupForm.notes} onChange={(e) => setCheckupForm({ ...checkupForm, notes: e.target.value })} />
                                        <button type="submit">Add Checkup</button>
                                    </form>
                                )}

                                <div className="items-grid">
                                    {healthData?.checkups?.filter(c => new Date(c.scheduledDate) >= new Date()).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map((checkup, idx) => (
                                        <div key={idx} className="health-item checkup-item">
                                            <div className="item-header">
                                                <h4>{checkup.type}</h4>
                                                <button className="delete-btn" onClick={() => handleDelete('checkups', checkup._id)}>×</button>
                                            </div>
                                            <p><strong>Scheduled:</strong> {new Date(checkup.scheduledDate).toLocaleString()}</p>
                                            {checkup.doctorName && <p><strong>Doctor:</strong> {checkup.doctorName}</p>}
                                            {checkup.location && <p><strong>Location:</strong> {checkup.location}</p>}
                                            <p><strong>Reminder:</strong> {checkup.reminder ? 'Yes' : 'No'}</p>
                                            {checkup.notes && <p>{checkup.notes}</p>}
                                        </div>
                                    ))}
                                    {!healthData?.checkups?.filter(c => new Date(c.scheduledDate) >= new Date()).length && (
                                        <p className="empty-state">No upcoming checkups scheduled</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="community-section">
                <h3>💬 Community Wellness</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No discussions yet. Start a conversation!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share your wellness tip or question..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && newComment.trim()) {
                                    handlePostComment()
                                }
                            }}
                        />
                        <button className="post-button" onClick={handlePostComment} disabled={!newComment.trim()}>
                            Post
                        </button>
                    </div>
                ) : (
                    <div className="login-prompt">
                        <p>You need to be logged in to share insights</p>
                        <button 
                            className="login-button" 
                            onClick={() => {
                                localStorage.setItem('postLoginRedirect', `/#healthcare`)
                                window.location.href = '/auth'
                            }}
                        >
                            Login to Comment
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
