import httpStatus from "http-status";
import { Health } from "../models/health.model.js";
import { User } from "../models/user.model.js";

// Get or create health record for user
const getHealthRecord = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        
        if (!healthRecord) {
            // Create a new health record if it doesn't exist
            healthRecord = new Health({
                userId: user.username,
                previousDiseases: [],
                currentDiseases: [],
                medications: [],
                exercises: [],
                dailyMetrics: [],
                doctors: [],
                checkups: []
            });
            await healthRecord.save();
        }

        return res.status(httpStatus.OK).json(healthRecord);
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Update health record
const updateHealthRecord = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        // Update fields if provided
        const updateFields = [
            'previousDiseases', 'currentDiseases', 'medications', 
            'exercises', 'dailyMetrics', 'doctors', 'checkups'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                healthRecord[field] = req.body[field];
            }
        });

        await healthRecord.save();
        return res.status(httpStatus.OK).json({ message: "Health record updated", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add disease (previous or current)
const addDisease = async (req, res) => {
    const { token, type, disease } = req.body; // type: 'previous' or 'current'

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        if (type === 'previous') {
            healthRecord.previousDiseases.push(disease);
        } else if (type === 'current') {
            healthRecord.currentDiseases.push(disease);
        } else {
            return res.status(400).json({ message: "Type must be 'previous' or 'current'" });
        }

        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Disease added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add medication
const addMedication = async (req, res) => {
    const { token, medication } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        healthRecord.medications.push(medication);
        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Medication added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add exercise
const addExercise = async (req, res) => {
    const { token, exercise } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        healthRecord.exercises.push(exercise);
        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Exercise added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add daily metrics
const addDailyMetrics = async (req, res) => {
    const { token, metrics } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        healthRecord.dailyMetrics.push(metrics);
        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Daily metrics added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add doctor
const addDoctor = async (req, res) => {
    const { token, doctor } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        healthRecord.doctors.push(doctor);
        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Doctor added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Add checkup
const addCheckup = async (req, res) => {
    const { token, checkup } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        let healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            healthRecord = new Health({ userId: user.username });
        }

        healthRecord.checkups.push(checkup);
        await healthRecord.save();
        return res.status(httpStatus.CREATED).json({ message: "Checkup added", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

// Delete item from array
const deleteItem = async (req, res) => {
    const { token, category, itemId } = req.body; // category: 'previousDiseases', 'currentDiseases', etc.

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const healthRecord = await Health.findOne({ userId: user.username });
        if (!healthRecord) {
            return res.status(404).json({ message: "Health record not found" });
        }

        const validCategories = ['previousDiseases', 'currentDiseases', 'medications', 'exercises', 'dailyMetrics', 'doctors', 'checkups'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }

        healthRecord[category] = healthRecord[category].filter(
            item => item._id.toString() !== itemId
        );

        await healthRecord.save();
        return res.status(httpStatus.OK).json({ message: "Item deleted", data: healthRecord });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { 
    getHealthRecord, 
    updateHealthRecord, 
    addDisease, 
    addMedication, 
    addExercise, 
    addDailyMetrics, 
    addDoctor, 
    addCheckup,
    deleteItem
};

