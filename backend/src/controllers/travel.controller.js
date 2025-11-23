import httpStatus from "http-status";
import { Travel } from "../models/travel.model.js";
import { User } from "../models/user.model.js";

// Get or create travel record for user
const getTravelRecord = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let travelRecord = await Travel.findOne({ userId: user.username });
        
        if (!travelRecord) {
            // Create a new travel record if it doesn't exist
            travelRecord = new Travel({
                userId: user.username,
                upcomingTrips: [],
                pastTrips: [],
                preferences: {
                    budgetRange: { min: 0, max: 0 },
                    preferredDestinations: [],
                    travelStyle: 'Mid-range',
                    accommodationPreference: 'Hotel',
                    transportationPreference: 'Flight',
                    interests: []
                },
                wishlist: []
            });
            await travelRecord.save();
        }

        return res.status(httpStatus.OK).json(travelRecord);
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Update travel record
const updateTravelRecord = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let travelRecord = await Travel.findOne({ userId: user.username });
        
        if (!travelRecord) {
            travelRecord = new Travel({ userId: user.username });
        }

        // Update fields if provided
        const updateFields = ['upcomingTrips', 'pastTrips', 'preferences', 'wishlist'];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                travelRecord[field] = req.body[field];
            }
        });

        await travelRecord.save();
        return res.status(httpStatus.OK).json({ message: "Travel record updated", data: travelRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { getTravelRecord, updateTravelRecord };

