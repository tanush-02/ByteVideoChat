import mongoose, { Schema } from "mongoose";

const travelSchema = new Schema(
    {
        userId: { type: String, required: true },
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
        }]
    },
    { timestamps: true }
);

const Travel = mongoose.model("Travel", travelSchema);

export { Travel };

