import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { fetchWeatherData, fetchTravelInfo } from '../services/apiService'
import { getDomainInsights } from '../services/geminiService'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { 
    getTravelRecord, 
    addFuturePlan, 
    addActivePlan,
    addHistoryPlan,
    deletePlan, 
    activatePlan, 
    completePlan 
} from '../services/travelService'
import './DomainPages.css'
import './Travelling.css'

export default function Travelling() {
    const { getComments, addComment } = useContext(AuthContext)
    const navigate = useNavigate()
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [weather, setWeather] = useState({
        temp: null,
        condition: '',
        humidity: null,
        windSpeed: null,
        lastUpdated: null
    })
    const [travelInfo, setTravelInfo] = useState(null)
    const [aiInsight, setAiInsight] = useState('')
    const [city, setCity] = useState('Mumbai')
    
    // Travel plans state
    const [activeTab, setActiveTab] = useState('map') // 'map', 'future', 'active', 'history'
    const [travelPlans, setTravelPlans] = useState({
        futurePlans: [],
        activePlans: [],
        travelHistory: []
    })
    const [loadingPlans, setLoadingPlans] = useState(false)
    
    // Map state
    const [mapWaypoints, setMapWaypoints] = useState([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [savePlanData, setSavePlanData] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        description: '',
        budget: ''
    })
    
    // Route calculation state
    const [routeInputs, setRouteInputs] = useState({
        source: '',
        destination: '',
        vehicle: 'car' // car, foot, bicycle, motorcycle
    })
    const [routeData, setRouteData] = useState(null)
    const [calculatingRoute, setCalculatingRoute] = useState(false)
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }) // Default: India center

    useEffect(() => {
        const loadTravelData = async () => {
            setLoading(true)
            try {
                const [weatherData, travelData] = await Promise.all([
                    fetchWeatherData(city),
                    fetchTravelInfo('India')
                ])
                
                setWeather(weatherData)
                setTravelInfo(travelData)
                
                // Fetch AI insights from Gemini API
                try {
                    const insight = await getDomainInsights('travelling', `Weather in ${city}: ${weatherData.temp}°C, ${weatherData.condition}, Wind: ${weatherData.windSpeed} km/h`)
                    setAiInsight(insight)
                } catch (error) {
                    console.error('Error fetching AI insights:', error)
                    setAiInsight('Providing travel recommendations and weather-based insights...')
                }
            } catch (error) {
                console.error('Error loading travel data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTravelData()
        const interval = setInterval(loadTravelData, 300000) // Update every 5 minutes
        return () => clearInterval(interval)
    }, [city])

    useEffect(() => {
        const loadComments = async () => {
            const list = await getComments('travelling')
            setComments(list)
        }
        loadComments()
        const id = setInterval(loadComments, 8000)
        return () => clearInterval(id)
    }, [getComments])

    useEffect(() => {
        const loadTravelPlans = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            setLoadingPlans(true)
            try {
                const data = await getTravelRecord(token)
                setTravelPlans({
                    futurePlans: data.futurePlans || [],
                    activePlans: data.activePlans || [],
                    travelHistory: data.travelHistory || []
                })
            } catch (error) {
                console.error('Error loading travel plans:', error)
            } finally {
                setLoadingPlans(false)
            }
        }
        loadTravelPlans()
    }, [])

    const handleExpertChat = () => {
        const randomCode = "Travelling";
        navigate(`/${randomCode}`);
    }

    // Geocode location name to coordinates
    const geocodeLocation = async (locationName) => {
        try {
            // Using Nominatim (OpenStreetMap geocoding service) - free, no API key needed
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'ByteVideoChat Travel App'
                    }
                }
            )
            const data = await response.json()
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    name: data[0].display_name
                }
            }
            return null
        } catch (error) {
            console.error('Geocoding error:', error)
            return null
        }
    }

    // Calculate route using OSRM (Open Source Routing Machine)
    const calculateRoute = async () => {
        if (!routeInputs.source || !routeInputs.destination) {
            alert('Please enter both source and destination')
            return
        }

        setCalculatingRoute(true)
        try {
            // Geocode source and destination
            const [sourceCoords, destCoords] = await Promise.all([
                geocodeLocation(routeInputs.source),
                geocodeLocation(routeInputs.destination)
            ])

            if (!sourceCoords || !destCoords) {
                alert('Could not find one or both locations. Please check the location names.')
                setCalculatingRoute(false)
                return
            }

            // Determine profile based on vehicle type
            const profileMap = {
                car: 'driving',
                foot: 'walking',
                bicycle: 'cycling',
                motorcycle: 'driving'
            }
            const profile = profileMap[routeInputs.vehicle] || 'driving'

            // Use OSRM routing service (public instance)
            const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${sourceCoords.lng},${sourceCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`
            
            const routeResponse = await fetch(osrmUrl)
            const routeResult = await routeResponse.json()

            if (routeResult.code === 'Ok' && routeResult.routes && routeResult.routes.length > 0) {
                const route = routeResult.routes[0]
                const distance = (route.distance / 1000).toFixed(2) // Convert to km
                const duration = Math.round(route.duration / 60) // Convert to minutes

                setRouteData({
                    geometry: route.geometry,
                    distance: distance,
                    duration: duration,
                    source: sourceCoords,
                    destination: destCoords
                })

                // Update waypoints for saving
                setMapWaypoints([
                    {
                        name: routeInputs.source,
                        latitude: sourceCoords.lat,
                        longitude: sourceCoords.lng,
                        order: 1
                    },
                    {
                        name: routeInputs.destination,
                        latitude: destCoords.lat,
                        longitude: destCoords.lng,
                        order: 2
                    }
                ])

                // Update map center to show the route
                const centerLat = (sourceCoords.lat + destCoords.lat) / 2
                const centerLng = (sourceCoords.lng + destCoords.lng) / 2
                setMapCenter({ lat: centerLat, lng: centerLng })
            } else {
                alert('Could not calculate route. Please try different locations.')
            }
        } catch (error) {
            console.error('Route calculation error:', error)
            alert('Error calculating route. Please try again.')
        } finally {
            setCalculatingRoute(false)
        }
    }

    const handleSaveRoute = () => {
        if (!routeData || mapWaypoints.length < 2) {
            alert('Please calculate a route first')
            return
        }
        setSavePlanData({
            ...savePlanData,
            destination: routeInputs.destination
        })
        setShowSaveDialog(true)
    }

    const handleConfirmSave = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            alert('Please login to save travel plans')
            return
        }

        if (!savePlanData.title || !savePlanData.destination || !savePlanData.startDate || !savePlanData.endDate) {
            alert('Please fill in all required fields')
            return
        }

        try {
            const startDate = new Date(savePlanData.startDate)
            const endDate = new Date(savePlanData.endDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
            
            // Determine trip category based on dates
            let tripCategory = 'future' // default
            if (endDate < today) {
                tripCategory = 'history' // Trip has ended
            } else if (startDate <= today && endDate >= today) {
                tripCategory = 'active' // Trip is currently ongoing
            } else if (startDate > today) {
                tripCategory = 'future' // Trip is in the future
            }

            // Prepare route data with full geometry
            // Ensure waypoints have all required fields or use empty array
            let waypointsToSave = []
            if (mapWaypoints && mapWaypoints.length > 0) {
                waypointsToSave = mapWaypoints.map(wp => ({
                    name: wp.name || '',
                    latitude: wp.latitude || 0,
                    longitude: wp.longitude || 0,
                    order: wp.order || 0
                }))
            } else {
                // If no waypoints, create basic ones from source/destination if route was calculated
                if (routeData && routeData.source && routeData.destination) {
                    waypointsToSave = [
                        {
                            name: routeInputs.source || 'Source',
                            latitude: routeData.source.lat,
                            longitude: routeData.source.lng,
                            order: 1
                        },
                        {
                            name: routeInputs.destination || 'Destination',
                            latitude: routeData.destination.lat,
                            longitude: routeData.destination.lng,
                            order: 2
                        }
                    ]
                }
            }

            // Optimize route data - only store essential geometry or simplify it
            let optimizedRouteData = null
            if (routeData && routeData.geometry) {
                // Store only coordinates array to reduce size, or store full geometry if needed
                // For very large routes, we can simplify by storing only key points
                if (routeData.geometry.coordinates && routeData.geometry.coordinates.length > 1000) {
                    // For very long routes, simplify by taking every nth point
                    const step = Math.ceil(routeData.geometry.coordinates.length / 500)
                    optimizedRouteData = {
                        type: routeData.geometry.type,
                        coordinates: routeData.geometry.coordinates.filter((_, index) => index % step === 0)
                    }
                } else {
                    optimizedRouteData = routeData.geometry
                }
            }

            const routeDataToSave = {
                waypoints: waypointsToSave,
                routeData: optimizedRouteData, // Store optimized GeoJSON geometry
                distance: routeData ? parseFloat(routeData.distance) : null,
                duration: routeData ? routeData.duration : null
            }

            const plan = {
                title: savePlanData.title,
                destination: savePlanData.destination,
                startDate: startDate.toISOString(), // Convert to ISO string for proper serialization
                endDate: endDate.toISOString(), // Convert to ISO string for proper serialization
                description: savePlanData.description || '',
                budget: savePlanData.budget ? parseFloat(savePlanData.budget) : null,
                route: routeDataToSave
            }

            // Save to appropriate category based on dates
            let response
            if (tripCategory === 'history') {
                // Trip has already ended - save directly to history
                plan.completedAt = new Date().toISOString()
                console.log('Saving to history:', plan)
                response = await addHistoryPlan(token, plan)
                console.log('History plan save response:', response)
            } else if (tripCategory === 'active') {
                // Trip is currently ongoing - save to active plans
                console.log('Saving to active:', plan)
                response = await addActivePlan(token, plan)
                console.log('Active plan save response:', response)
            } else {
                // Trip is in the future - save to future plans
                console.log('Saving to future:', plan)
                response = await addFuturePlan(token, plan)
                console.log('Future plan save response:', response)
            }
            
            // Verify the save was successful
            if (!response || !response.data) {
                throw new Error('Save response was invalid')
            }
            
            // Reload plans
            const data = await getTravelRecord(token)
            console.log('Reloaded travel plans:', {
                future: data.futurePlans?.length || 0,
                active: data.activePlans?.length || 0,
                history: data.travelHistory?.length || 0
            })
            setTravelPlans({
                futurePlans: data.futurePlans || [],
                activePlans: data.activePlans || [],
                travelHistory: data.travelHistory || []
            })

            // Reset
            setMapWaypoints([])
            setRouteData(null)
            setShowSaveDialog(false)
            setSavePlanData({
                title: '',
                destination: '',
                startDate: '',
                endDate: '',
                description: '',
                budget: ''
            })
            setRouteInputs({
                source: '',
                destination: '',
                vehicle: 'car'
            })
            
            alert(`Travel plan saved successfully as ${tripCategory === 'history' ? 'previous' : tripCategory} trip!`)
        } catch (error) {
            console.error('Error saving plan:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
            console.error('Full error details:', error.response?.data)
            alert(`Failed to save travel plan: ${errorMessage}. Please check the console for details.`)
        }
    }

    const handleActivatePlan = async (planId) => {
        const token = localStorage.getItem('token')
        if (!token) return

        if (!window.confirm('Move this plan to active plans?')) return

        try {
            await activatePlan(token, planId)
            const data = await getTravelRecord(token)
            setTravelPlans({
                futurePlans: data.futurePlans || [],
                activePlans: data.activePlans || [],
                travelHistory: data.travelHistory || []
            })
        } catch (error) {
            console.error('Error activating plan:', error)
            alert('Failed to activate plan')
        }
    }

    const handleCompletePlan = async (planId, fromCategory) => {
        const token = localStorage.getItem('token')
        if (!token) return

        const actualSpent = prompt('Enter actual amount spent (optional):')
        const rating = prompt('Rate your trip (1-5, optional):')
        const notes = prompt('Add notes (optional):')

        try {
            await completePlan(
                token, 
                planId, 
                fromCategory,
                actualSpent ? parseFloat(actualSpent) : null,
                rating ? parseInt(rating) : null,
                notes || null
            )
            const data = await getTravelRecord(token)
            setTravelPlans({
                futurePlans: data.futurePlans || [],
                activePlans: data.activePlans || [],
                travelHistory: data.travelHistory || []
            })
        } catch (error) {
            console.error('Error completing plan:', error)
            alert('Failed to complete plan')
        }
    }

    const handleDeletePlan = async (category, planId) => {
        const token = localStorage.getItem('token')
        if (!token) return

        if (!window.confirm('Are you sure you want to delete this plan?')) return

        try {
            await deletePlan(token, category, planId)
            const data = await getTravelRecord(token)
            setTravelPlans({
                futurePlans: data.futurePlans || [],
                activePlans: data.activePlans || [],
                travelHistory: data.travelHistory || []
            })
        } catch (error) {
            console.error('Error deleting plan:', error)
            alert('Failed to delete plan')
        }
    }

    const handleViewRoute = (plan) => {
        if (!plan.route || !plan.route.waypoints || plan.route.waypoints.length < 2) {
            alert('This plan does not have route information')
            return
        }

        // Switch to map tab
        setActiveTab('map')

        // Set route inputs
        setRouteInputs({
            source: plan.route.waypoints[0]?.name || '',
            destination: plan.route.waypoints[plan.route.waypoints.length - 1]?.name || '',
            vehicle: 'car'
        })

        // Set waypoints
        setMapWaypoints(plan.route.waypoints)

        // If route has geometry data, restore it
        if (plan.route.routeData) {
            const sourceCoords = plan.route.waypoints[0]
            const destCoords = plan.route.waypoints[plan.route.waypoints.length - 1]
            
            setRouteData({
                geometry: plan.route.routeData,
                distance: plan.route.distance || null,
                duration: plan.route.duration || null,
                source: {
                    lat: sourceCoords.latitude,
                    lng: sourceCoords.longitude,
                    name: sourceCoords.name
                },
                destination: {
                    lat: destCoords.latitude,
                    lng: destCoords.longitude,
                    name: destCoords.name
                }
            })

            // Update map center
            const centerLat = (sourceCoords.latitude + destCoords.latitude) / 2
            const centerLng = (sourceCoords.longitude + destCoords.longitude) / 2
            setMapCenter({ lat: centerLat, lng: centerLng })
        } else {
            // Just set waypoints and center map
            const sourceCoords = plan.route.waypoints[0]
            const destCoords = plan.route.waypoints[plan.route.waypoints.length - 1]
            const centerLat = (sourceCoords.latitude + destCoords.latitude) / 2
            const centerLng = (sourceCoords.longitude + destCoords.longitude) / 2
            setMapCenter({ lat: centerLat, lng: centerLng })
        }
    }

    // Initialize and update Leaflet map
    useEffect(() => {
        // Only run when map tab is active
        if (activeTab !== 'map') return
        
        // Wait for Leaflet to load
        if (typeof window === 'undefined' || !window.L) {
            // Retry after a short delay if Leaflet isn't loaded yet
            const timer = setTimeout(() => {
                if (window.L) {
                    // Trigger re-render
                    setMapCenter(prev => ({ ...prev }))
                }
            }, 100)
            return () => clearTimeout(timer)
        }

        const mapId = 'route-map'
        const mapElement = document.getElementById(mapId)
        if (!mapElement) return

        let map = null

        // Remove existing map if any
        if (mapElement._leaflet_id) {
            window.L.map(mapId).remove()
        }
        mapElement.innerHTML = ''

        // Initialize map
        map = window.L.map(mapId).setView([mapCenter.lat, mapCenter.lng], 6)

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map)

        // If we have route data, draw the route
        if (routeData && routeData.geometry) {
            // Convert GeoJSON coordinates to LatLng array
            const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
            
            // Draw route polyline
            const routeLayer = window.L.polyline(coordinates, {
                color: '#22c55e',
                weight: 5,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(map)

            // Add start marker (green pin)
            const startMarker = window.L.marker([routeData.source.lat, routeData.source.lng], {
                icon: window.L.divIcon({
                    className: 'custom-marker start-marker',
                    html: '<div class="marker-pin start"></div><div class="marker-label">Start</div>',
                    iconSize: [30, 42],
                    iconAnchor: [15, 42],
                    popupAnchor: [0, -42]
                })
            }).addTo(map)
            startMarker.bindPopup(`<strong>Start:</strong> ${routeInputs.source}`)

            // Add end marker (red pin)
            const endMarker = window.L.marker([routeData.destination.lat, routeData.destination.lng], {
                icon: window.L.divIcon({
                    className: 'custom-marker end-marker',
                    html: '<div class="marker-pin end"></div><div class="marker-label">End</div>',
                    iconSize: [30, 42],
                    iconAnchor: [15, 42],
                    popupAnchor: [0, -42]
                })
            }).addTo(map)
            endMarker.bindPopup(`<strong>End:</strong> ${routeInputs.destination}`)

            // Fit map to show the entire route
            const bounds = window.L.latLngBounds(coordinates)
            map.fitBounds(bounds, { padding: [50, 50] })
        } else {
            // Default view
            map.setView([mapCenter.lat, mapCenter.lng], 6)
        }

        // Cleanup function
        return () => {
            if (map) {
                map.remove()
            }
        }
    }, [routeData, mapCenter, routeInputs, activeTab])

    async function handlePostComment() {
        if (!newComment.trim()) return
        try {
            await addComment('travelling', newComment)
            setNewComment('')
            const list = await getComments('travelling')
            setComments(list)
        } catch (err) {
            console.error("Error posting comment:", err)
            alert("Failed to post comment. Please try again.")
        }
    }

    return (
        <div className="domain-container">
            <div className="domain-header">
                <h2>✈️ Travel & Weather</h2>
                <p className="domain-subtitle">Plan your trips, track routes, and get real-time weather insights</p>
            </div>

            {/* Tabs */}
            <div className="travel-tabs">
                <button 
                    className={activeTab === 'map' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('map')}
                >
                    🗺️ Map & Route
                </button>
                <button 
                    className={activeTab === 'future' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('future')}
                >
                    📅 Future Plans ({travelPlans.futurePlans.length})
                </button>
                <button 
                    className={activeTab === 'active' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('active')}
                >
                    🚀 Active Plans ({travelPlans.activePlans.length})
                </button>
                <button 
                    className={activeTab === 'history' ? 'tab-active' : ''} 
                    onClick={() => setActiveTab('history')}
                >
                    📚 History ({travelPlans.travelHistory.length})
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading weather and travel data...</p>
                </div>
            ) : (
                <>
                    {/* Map Tab */}
                    {activeTab === 'map' && (
                        <div className="map-section">
                            <div className="route-planning-container">
                                <div className="route-input-panel">
                                    <h3 className="route-panel-title">Route Planner</h3>
                                    
                                    <div className="route-input-group">
                                        <label htmlFor="source">Source</label>
                                        <input
                                            id="source"
                                            type="text"
                                            className="route-input"
                                            placeholder="Enter source location"
                                            value={routeInputs.source}
                                            onChange={(e) => setRouteInputs({...routeInputs, source: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="route-input-group">
                                        <label htmlFor="destination">Destination</label>
                                        <input
                                            id="destination"
                                            type="text"
                                            className="route-input"
                                            placeholder="Enter destination location"
                                            value={routeInputs.destination}
                                            onChange={(e) => setRouteInputs({...routeInputs, destination: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="route-input-group">
                                        <label htmlFor="vehicle">Vehicle</label>
                                        <select
                                            id="vehicle"
                                            className="route-select"
                                            value={routeInputs.vehicle}
                                            onChange={(e) => setRouteInputs({...routeInputs, vehicle: e.target.value})}
                                        >
                                            <option value="car">🚗 Car</option>
                                            <option value="foot">🚶 Foot</option>
                                            <option value="bicycle">🚴 Bicycle</option>
                                            <option value="motorcycle">🏍️ Motorcycle</option>
                                        </select>
                                    </div>
                                    
                                    <button 
                                        className="calculate-route-btn"
                                        onClick={calculateRoute}
                                        disabled={calculatingRoute || !routeInputs.source || !routeInputs.destination}
                                    >
                                        {calculatingRoute ? 'Calculating...' : 'Calculate Route'}
                                    </button>
                                    
                                    {routeData && (
                                        <div className="route-info-panel">
                                            <div className="route-stat">
                                                <span className="route-stat-label">Distance:</span>
                                                <span className="route-stat-value">{routeData.distance} km</span>
                                            </div>
                                            <div className="route-stat">
                                                <span className="route-stat-label">Duration:</span>
                                                <span className="route-stat-value">{routeData.duration} min</span>
                                            </div>
                                            <button 
                                                className="save-route-btn"
                                                onClick={handleSaveRoute}
                                            >
                                                💾 Save Route
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="map-container">
                                    <div id="route-map" className="leaflet-map"></div>
                                    {routeData && (
                                        <div className="map-overlay-info">
                                            <div className="route-marker source">📍 {routeInputs.source}</div>
                                            <div className="route-marker destination">📍 {routeInputs.destination}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Future Plans Tab */}
                    {activeTab === 'future' && (
                        <div className="plans-section">
                            {loadingPlans ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading plans...</p>
                                </div>
                            ) : travelPlans.futurePlans.length === 0 ? (
                                <div className="empty-state">
                                    <p>No future travel plans yet. Create a route on the Map tab and save it!</p>
                                </div>
                            ) : (
                                <div className="plans-grid">
                                    {travelPlans.futurePlans.map((plan) => (
                                        <div key={plan._id} className="plan-card">
                                            <h3>{plan.title}</h3>
                                            <p><strong>Destination:</strong> {plan.destination}</p>
                                            <p><strong>Dates:</strong> {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</p>
                                            {plan.budget && <p><strong>Budget:</strong> ₹{plan.budget}</p>}
                                            {plan.description && <p>{plan.description}</p>}
                                            {plan.route?.waypoints && plan.route.waypoints.length > 0 && (
                                                <div className="route-info">
                                                    <strong>Route:</strong> {plan.route.waypoints.map(wp => wp.name).join(' → ')}
                                                </div>
                                            )}
                                            <div className="plan-actions">
                                                <button 
                                                    className="plan-btn view"
                                                    onClick={() => handleViewRoute(plan)}
                                                >
                                                    🗺️ View Route
                                                </button>
                                                <button 
                                                    className="plan-btn activate"
                                                    onClick={() => handleActivatePlan(plan._id)}
                                                >
                                                    🚀 Activate
                                                </button>
                                                <button 
                                                    className="plan-btn delete"
                                                    onClick={() => handleDeletePlan('futurePlans', plan._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Plans Tab */}
                    {activeTab === 'active' && (
                        <div className="plans-section">
                            {loadingPlans ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading plans...</p>
                                </div>
                            ) : travelPlans.activePlans.length === 0 ? (
                                <div className="empty-state">
                                    <p>No active travel plans. Activate a future plan to get started!</p>
                                </div>
                            ) : (
                                <div className="plans-grid">
                                    {travelPlans.activePlans.map((plan) => (
                                        <div key={plan._id} className="plan-card active">
                                            <h3>{plan.title}</h3>
                                            <p><strong>Destination:</strong> {plan.destination}</p>
                                            <p><strong>Dates:</strong> {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</p>
                                            {plan.budget && <p><strong>Budget:</strong> ₹{plan.budget}</p>}
                                            {plan.description && <p>{plan.description}</p>}
                                            {plan.route?.waypoints && plan.route.waypoints.length > 0 && (
                                                <div className="route-info">
                                                    <strong>Route:</strong> {plan.route.waypoints.map(wp => wp.name).join(' → ')}
                                                </div>
                                            )}
                                            <div className="plan-actions">
                                                <button 
                                                    className="plan-btn view"
                                                    onClick={() => handleViewRoute(plan)}
                                                >
                                                    🗺️ View Route
                                                </button>
                                                <button 
                                                    className="plan-btn complete"
                                                    onClick={() => handleCompletePlan(plan._id, 'activePlans')}
                                                >
                                                    ✅ Complete
                                                </button>
                                                <button 
                                                    className="plan-btn delete"
                                                    onClick={() => handleDeletePlan('activePlans', plan._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="plans-section">
                            {loadingPlans ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading history...</p>
                                </div>
                            ) : travelPlans.travelHistory.length === 0 ? (
                                <div className="empty-state">
                                    <p>No travel history yet. Complete an active plan to add it to history!</p>
                                </div>
                            ) : (
                                <div className="plans-grid">
                                    {travelPlans.travelHistory.map((plan) => (
                                        <div key={plan._id} className="plan-card history">
                                            <h3>{plan.title}</h3>
                                            <p><strong>Destination:</strong> {plan.destination}</p>
                                            <p><strong>Dates:</strong> {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</p>
                                            {plan.budget && <p><strong>Budget:</strong> ₹{plan.budget}</p>}
                                            {plan.actualSpent && <p><strong>Actual Spent:</strong> ₹{plan.actualSpent}</p>}
                                            {plan.rating && <p><strong>Rating:</strong> {'⭐'.repeat(plan.rating)}</p>}
                                            {plan.description && <p>{plan.description}</p>}
                                            {plan.route?.waypoints && plan.route.waypoints.length > 0 && (
                                                <div className="route-info">
                                                    <strong>Route:</strong> {plan.route.waypoints.map(wp => wp.name).join(' → ')}
                                                </div>
                                            )}
                                            {plan.notes && <p className="notes"><em>{plan.notes}</em></p>}
                                            <div className="plan-actions">
                                                <button 
                                                    className="plan-btn view"
                                                    onClick={() => handleViewRoute(plan)}
                                                >
                                                    🗺️ View Route
                                                </button>
                                                <button 
                                                    className="plan-btn delete"
                                                    onClick={() => handleDeletePlan('travelHistory', plan._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* City Selector */}
                    <div className="city-selector">
                        <label>Select City for Weather:</label>
                        <select value={city} onChange={(e) => setCity(e.target.value)} className="city-select">
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Kolkata">Kolkata</option>
                            <option value="Hyderabad">Hyderabad</option>
                        </select>
                    </div>

                    {/* Weather Section - Show on all tabs */}
                    <div className="stats-grid">
                        <div className="stat-card travel-card">
                            <div className="stat-icon">🌡️</div>
                            <h3>Temperature</h3>
                            <p className="stat-number">{weather.temp}°C</p>
                            <p className="stat-update">Updated: {weather.lastUpdated ? new Date(weather.lastUpdated).toLocaleTimeString() : 'Just now'}</p>
                        </div>
                        <div className="stat-card travel-card">
                            <div className="stat-icon">☁️</div>
                            <h3>Condition</h3>
                            <p className="stat-number">{weather.condition}</p>
                            <p className="stat-update">Live Weather Data</p>
                        </div>
                        <div className="stat-card travel-card">
                            <div className="stat-icon">💨</div>
                            <h3>Wind Speed</h3>
                            <p className="stat-number">{weather.windSpeed} km/h</p>
                            <p className="stat-update">Humidity: {weather.humidity}%</p>
                        </div>
                    </div>

                    {travelInfo && (
                        <div className="travel-info-card">
                            <h3>🌍 Travel Information</h3>
                            <div className="travel-details">
                                <p><strong>Country:</strong> {travelInfo.country}</p>
                                <p><strong>Capital:</strong> {travelInfo.capital}</p>
                                <p><strong>Currency:</strong> {travelInfo.currency}</p>
                                <p><strong>Timezone:</strong> {travelInfo.timezone}</p>
                            </div>
                        </div>
                    )}

                    <div className="ai-insight-card">
                        <div className="ai-header">
                            <span className="ai-icon">🤖</span>
                            <h3>AI Travel Recommendation</h3>
                        </div>
                        <div className="ai-content">
                            <MarkdownRenderer content={aiInsight} />
                        </div>
                        <p className="ai-timestamp">Generated at {new Date().toLocaleTimeString()}</p>
                    </div>

                    <div className="expert-chat-card">
                        <div className="expert-header">
                            <span className="expert-icon">👨‍✈️</span>
                            <div>
                                <h3>Need Travel Planning Help?</h3>
                                <p>Connect with a travel expert for personalized itinerary and advice</p>
                            </div>
                        </div>
                        <button className="expert-button" onClick={handleExpertChat}>
                            <span>📹</span>
                            Start Video Consultation
                        </button>
                    </div>
                </>
            )}

            {/* Save Route Dialog */}
            {showSaveDialog && (
                <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Save Travel Plan</h2>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                value={savePlanData.title}
                                onChange={(e) => setSavePlanData({...savePlanData, title: e.target.value})}
                                placeholder="e.g., Summer Trip to Goa"
                            />
                        </div>
                        <div className="form-group">
                            <label>Destination *</label>
                            <input
                                type="text"
                                value={savePlanData.destination}
                                onChange={(e) => setSavePlanData({...savePlanData, destination: e.target.value})}
                                placeholder="e.g., Goa, India"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    value={savePlanData.startDate}
                                    onChange={(e) => setSavePlanData({...savePlanData, startDate: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date *</label>
                                <input
                                    type="date"
                                    value={savePlanData.endDate}
                                    onChange={(e) => setSavePlanData({...savePlanData, endDate: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Budget (₹)</label>
                            <input
                                type="number"
                                value={savePlanData.budget}
                                onChange={(e) => setSavePlanData({...savePlanData, budget: e.target.value})}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={savePlanData.description}
                                onChange={(e) => setSavePlanData({...savePlanData, description: e.target.value})}
                                placeholder="Optional notes about your trip"
                                rows="3"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="action-btn secondary" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </button>
                            <button className="action-btn primary" onClick={handleConfirmSave}>
                                Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="community-section">
                <h3>💬 Travel Community</h3>
                <div className="comments-display">
                    {comments.length ? comments.map((c) => (
                        <div key={c._id} className="comment-item">
                            <span className="comment-icon">👤</span>
                            <div className="comment-content">
                                <p>{c.text}</p>
                                <span className="comment-author">by {c.userId}</span>
                            </div>
                        </div>
                    )) : <p className="no-comments">No travel tips shared yet. Share your experience!</p>}
                </div>
                {localStorage.getItem("token") ? (
                    <div className="comment-input-group">
                        <input 
                            className="comment-input" 
                            placeholder="Share a travel tip or ask a question..." 
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
                                localStorage.setItem('postLoginRedirect', `/#travelling`)
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
