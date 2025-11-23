import mongoose, { Schema } from "mongoose";

const travelSchema = new Schema(
    {
        userId: { type: String, required: true },
<<<<<<< HEAD
        // Upcoming trips
        upcomingTrips: [{
            destination: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            budget: { type: Number, default: 0 },
            accommodation: {
                type: { type: String, enum: ['Hotel', 'Airbnb', 'Hostel', 'Resort', 'Other'], default: 'Hotel' },
                name: { type: String },
                cost: { type: Number, default: 0 },
                location: { type: String }
            },
            transportation: {
                type: { type: String, enum: ['Flight', 'Train', 'Bus', 'Car', 'Other'], default: 'Flight' },
                cost: { type: Number, default: 0 },
                details: { type: String }
            },
            activities: [{
                name: { type: String, required: true },
                date: { type: Date },
                cost: { type: Number, default: 0 },
                notes: { type: String }
            }],
            status: { type: String, enum: ['Planning', 'Booked', 'In Progress', 'Completed', 'Cancelled'], default: 'Planning' },
            notes: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        // Past trips
        pastTrips: [{
            destination: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            totalCost: { type: Number, default: 0 },
            rating: { type: Number, min: 1, max: 5 },
            highlights: [{ type: String }],
            photos: [{ type: String }],
            notes: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        // Travel preferences
        preferences: {
            budgetRange: {
                min: { type: Number, default: 0 },
                max: { type: Number, default: 0 }
            },
            preferredDestinations: [{ type: String }],
            travelStyle: { type: String, enum: ['Budget', 'Mid-range', 'Luxury', 'Adventure', 'Relaxation'], default: 'Mid-range' },
            accommodationPreference: { type: String, enum: ['Hotel', 'Airbnb', 'Hostel', 'Resort'], default: 'Hotel' },
            transportationPreference: { type: String, enum: ['Flight', 'Train', 'Bus', 'Car'], default: 'Flight' },
            interests: [{ type: String }] // e.g., "Beaches", "Mountains", "Culture", "Food"
        },
        // Travel wishlist
        wishlist: [{
            destination: { type: String, required: true },
            priority: { type: Number, min: 1, max: 5, default: 3 },
            estimatedBudget: { type: Number, default: 0 },
            preferredSeason: { type: String },
            notes: { type: String },
            addedDate: { type: Date, default: Date.now }
=======
        // Future travel plans
        futurePlans: [{
            title: { type: String, required: true },
            destination: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            description: { type: String },
            budget: { type: Number },
            route: {
                waypoints: [{
                    name: { type: String, default: '' },
                    latitude: { type: Number, default: 0 },
                    longitude: { type: Number, default: 0 },
                    order: { type: Number, default: 0 }
                }],
                routeData: { type: Schema.Types.Mixed }, // Store full route data from map API
                distance: { type: Number }, // in km
                duration: { type: Number } // in minutes
            },
            notes: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        // Active travel plans (currently ongoing)
        activePlans: [{
            title: { type: String, required: true },
            destination: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            description: { type: String },
            budget: { type: Number },
            route: {
                waypoints: [{
                    name: { type: String, default: '' },
                    latitude: { type: Number, default: 0 },
                    longitude: { type: Number, default: 0 },
                    order: { type: Number, default: 0 }
                }],
                routeData: { type: Schema.Types.Mixed },
                distance: { type: Number },
                duration: { type: Number }
            },
            notes: { type: String },
            createdAt: { type: Date, default: Date.now },
            startedAt: { type: Date, default: Date.now }
        }],
        // Travel history (completed trips)
        travelHistory: [{
            title: { type: String, required: true },
            destination: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            description: { type: String },
            budget: { type: Number },
            actualSpent: { type: Number },
            route: {
                waypoints: [{
                    name: { type: String, default: '' },
                    latitude: { type: Number, default: 0 },
                    longitude: { type: Number, default: 0 },
                    order: { type: Number, default: 0 }
                }],
                routeData: { type: Schema.Types.Mixed },
                distance: { type: Number },
                duration: { type: Number }
            },
            notes: { type: String },
            photos: [{ type: String }], // URLs to photos
            rating: { type: Number, min: 1, max: 5 },
            createdAt: { type: Date, default: Date.now },
            completedAt: { type: Date, default: Date.now }
>>>>>>> 8c06090 (Your updates)
        }]
    },
    { timestamps: true }
);

const Travel = mongoose.model("Travel", travelSchema);

export { Travel };

