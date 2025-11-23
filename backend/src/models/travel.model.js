import mongoose, { Schema } from "mongoose";

const travelSchema = new Schema(
    {
        userId: { type: String, required: true },
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
        }]
    },
    { timestamps: true }
);

const Travel = mongoose.model("Travel", travelSchema);

export { Travel };
