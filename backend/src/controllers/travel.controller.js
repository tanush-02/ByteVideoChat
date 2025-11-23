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
<<<<<<< HEAD
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
=======
            travelRecord = new Travel({
                userId: user.username,
                futurePlans: [],
                activePlans: [],
                travelHistory: []
>>>>>>> 8c06090 (Your updates)
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
<<<<<<< HEAD
        const updateFields = ['upcomingTrips', 'pastTrips', 'preferences', 'wishlist'];

=======
        const updateFields = ['futurePlans', 'activePlans', 'travelHistory'];
>>>>>>> 8c06090 (Your updates)
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

<<<<<<< HEAD
export { getTravelRecord, updateTravelRecord };
=======
// Add future travel plan
const addFuturePlan = async (req, res) => {
    const { token, plan } = req.body;

    try {
        console.log('Received request to add future plan:', { token: token ? 'present' : 'missing', planKeys: Object.keys(plan || {}) });
        
        const user = await User.findOne({ token: token });
        if (!user) {
            console.error('User not found for token');
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            travelRecord = new Travel({ userId: user.username });
            console.log('Created new travel record for user:', user.username);
        }

        // Ensure route structure is valid
        if (!plan.route) {
            plan.route = { waypoints: [], routeData: null, distance: null, duration: null };
        }
        if (!plan.route.waypoints) {
            plan.route.waypoints = [];
        }

        // Convert ISO date strings to Date objects if needed
        if (typeof plan.startDate === 'string') {
            plan.startDate = new Date(plan.startDate);
        }
        if (typeof plan.endDate === 'string') {
            plan.endDate = new Date(plan.endDate);
        }

        console.log('Adding plan to futurePlans:', {
            title: plan.title,
            destination: plan.destination,
            startDate: plan.startDate,
            endDate: plan.endDate,
            waypointsCount: plan.route.waypoints.length
        });

        travelRecord.futurePlans.unshift(plan); // Add to beginning
        const savedRecord = await travelRecord.save();
        console.log('Successfully saved future plan. Total future plans:', savedRecord.futurePlans.length);
        return res.status(httpStatus.CREATED).json({ message: "Future plan added", data: savedRecord });
    } catch (e) {
        console.error('Error adding future plan:', e);
        console.error('Error stack:', e.stack);
        return res.status(500).json({ message: `Something went wrong: ${e.message}`, error: e.message });
    }
};

// Add active travel plan
const addActivePlan = async (req, res) => {
    const { token, plan } = req.body;

    try {
        console.log('Received request to add active plan:', { token: token ? 'present' : 'missing', planKeys: Object.keys(plan || {}) });
        
        const user = await User.findOne({ token: token });
        if (!user) {
            console.error('User not found for token');
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            travelRecord = new Travel({ userId: user.username });
            console.log('Created new travel record for user:', user.username);
        }

        // Ensure route structure is valid
        if (!plan.route) {
            plan.route = { waypoints: [], routeData: null, distance: null, duration: null };
        }
        if (!plan.route.waypoints) {
            plan.route.waypoints = [];
        }

        // Convert ISO date strings to Date objects if needed
        if (typeof plan.startDate === 'string') {
            plan.startDate = new Date(plan.startDate);
        }
        if (typeof plan.endDate === 'string') {
            plan.endDate = new Date(plan.endDate);
        }

        plan.startedAt = new Date();
        
        console.log('Adding plan to activePlans:', {
            title: plan.title,
            destination: plan.destination,
            startDate: plan.startDate,
            endDate: plan.endDate,
            waypointsCount: plan.route.waypoints.length
        });

        travelRecord.activePlans.unshift(plan);
        const savedRecord = await travelRecord.save();
        console.log('Successfully saved active plan. Total active plans:', savedRecord.activePlans.length);
        return res.status(httpStatus.CREATED).json({ message: "Active plan added", data: savedRecord });
    } catch (e) {
        console.error('Error adding active plan:', e);
        console.error('Error stack:', e.stack);
        return res.status(500).json({ message: `Something went wrong: ${e.message}`, error: e.message });
    }
};

// Add travel history entry directly
const addHistoryPlan = async (req, res) => {
    const { token, plan } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            travelRecord = new Travel({ userId: user.username });
        }

        // Ensure route structure is valid
        if (!plan.route) {
            plan.route = { waypoints: [], routeData: null, distance: null, duration: null };
        }
        if (!plan.route.waypoints) {
            plan.route.waypoints = [];
        }

        // Convert ISO date strings to Date objects if needed
        if (typeof plan.startDate === 'string') {
            plan.startDate = new Date(plan.startDate);
        }
        if (typeof plan.endDate === 'string') {
            plan.endDate = new Date(plan.endDate);
        }
        if (typeof plan.completedAt === 'string') {
            plan.completedAt = new Date(plan.completedAt);
        } else if (!plan.completedAt) {
            plan.completedAt = new Date();
        }

        console.log('Adding plan to travelHistory:', {
            title: plan.title,
            destination: plan.destination,
            startDate: plan.startDate,
            endDate: plan.endDate,
            waypointsCount: plan.route.waypoints.length
        });

        travelRecord.travelHistory.unshift(plan);
        const savedRecord = await travelRecord.save();
        console.log('Successfully saved history plan. Total history plans:', savedRecord.travelHistory.length);
        return res.status(httpStatus.CREATED).json({ message: "History plan added", data: savedRecord });
    } catch (e) {
        console.error('Error adding history plan:', e);
        console.error('Error stack:', e.stack);
        return res.status(500).json({ message: `Something went wrong: ${e.message}`, error: e.message });
    }
};

// Move plan from future/active to history
const completePlan = async (req, res) => {
    const { token, planId, fromCategory, actualSpent, rating, notes } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            return res.status(404).json({ message: "Travel record not found" });
        }

        let plan = null;
        if (fromCategory === 'futurePlans') {
            plan = travelRecord.futurePlans.id(planId);
            if (plan) {
                travelRecord.futurePlans.pull(planId);
            }
        } else if (fromCategory === 'activePlans') {
            plan = travelRecord.activePlans.id(planId);
            if (plan) {
                travelRecord.activePlans.pull(planId);
            }
        }

        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // Convert to history entry
        const historyEntry = plan.toObject();
        historyEntry.actualSpent = actualSpent;
        historyEntry.rating = rating;
        if (notes) historyEntry.notes = notes;
        historyEntry.completedAt = new Date();
        delete historyEntry._id;
        delete historyEntry.createdAt;

        travelRecord.travelHistory.unshift(historyEntry);
        await travelRecord.save();
        return res.status(httpStatus.OK).json({ message: "Plan completed and moved to history", data: travelRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Move plan from future to active
const activatePlan = async (req, res) => {
    const { token, planId } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            return res.status(404).json({ message: "Travel record not found" });
        }

        const plan = travelRecord.futurePlans.id(planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const activePlan = plan.toObject();
        activePlan.startedAt = new Date();
        delete activePlan._id;

        travelRecord.futurePlans.pull(planId);
        travelRecord.activePlans.unshift(activePlan);
        await travelRecord.save();
        return res.status(httpStatus.OK).json({ message: "Plan activated", data: travelRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Delete plan
const deletePlan = async (req, res) => {
    const { token, category, planId } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            return res.status(404).json({ message: "Travel record not found" });
        }

        const validCategories = ['futurePlans', 'activePlans', 'travelHistory'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }

        travelRecord[category] = travelRecord[category].filter(
            item => item._id.toString() !== planId
        );

        await travelRecord.save();
        return res.status(httpStatus.OK).json({ message: "Plan deleted", data: travelRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Update plan
const updatePlan = async (req, res) => {
    const { token, category, planId, updates } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const travelRecord = await Travel.findOne({ userId: user.username });
        if (!travelRecord) {
            return res.status(404).json({ message: "Travel record not found" });
        }

        const validCategories = ['futurePlans', 'activePlans', 'travelHistory'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }

        const plan = travelRecord[category].id(planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // Update plan fields
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                plan[key] = updates[key];
            }
        });

        await travelRecord.save();
        return res.status(httpStatus.OK).json({ message: "Plan updated", data: travelRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { 
    getTravelRecord, 
    updateTravelRecord, 
    addFuturePlan,
    addActivePlan,
    addHistoryPlan,
    completePlan,
    activatePlan,
    deletePlan,
    updatePlan
};
>>>>>>> 8c06090 (Your updates)

