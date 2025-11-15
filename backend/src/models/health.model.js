import mongoose, { Schema } from "mongoose";

const healthSchema = new Schema(
    {
        userId: { type: String, required: true },
        // Disease tracking
        previousDiseases: [{
            name: { type: String, required: true },
            diagnosedDate: { type: Date },
            curedDate: { type: Date },
            notes: { type: String }
        }],
        currentDiseases: [{
            name: { type: String, required: true },
            diagnosedDate: { type: Date },
            severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Mild' },
            notes: { type: String }
        }],
        // Medication tracking
        medications: [{
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            frequency: { type: String, required: true }, // e.g., "Once daily", "Twice daily"
            startDate: { type: Date },
            endDate: { type: Date },
            isActive: { type: Boolean, default: true },
            notes: { type: String }
        }],
        // Exercise tracking
        exercises: [{
            type: { type: String, required: true }, // e.g., "Running", "Walking", "Cycling"
            duration: { type: Number, required: true }, // in minutes
            date: { type: Date, default: Date.now },
            caloriesBurned: { type: Number },
            notes: { type: String }
        }],
        // Daily metrics
        dailyMetrics: [{
            date: { type: Date, default: Date.now },
            steps: { type: Number, default: 0 },
            heartRate: { type: Number }, // bpm
            weight: { type: Number },
            bloodPressure: {
                systolic: { type: Number },
                diastolic: { type: Number }
            },
            notes: { type: String }
        }],
        // Doctor details
        doctors: [{
            name: { type: String, required: true },
            specialization: { type: String },
            contact: { type: String },
            email: { type: String },
            address: { type: String },
            notes: { type: String }
        }],
        // Future checkups
        checkups: [{
            type: { type: String, required: true }, // e.g., "General Checkup", "Blood Test"
            scheduledDate: { type: Date, required: true },
            doctorName: { type: String },
            location: { type: String },
            notes: { type: String },
            reminder: { type: Boolean, default: true }
        }]
    },
    { timestamps: true }
);

const Health = mongoose.model("Health", healthSchema);

export { Health };

