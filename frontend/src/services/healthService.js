import axios from "axios";
import server from "../environment";

const healthClient = axios.create({
    baseURL: `${server}/api/v1/health`
});

export const getHealthRecord = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.get("/", {
            params: { token }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching health record:", error);
        throw error;
    }
};

export const addDisease = async (type, disease) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/disease", {
            token,
            type, // 'previous' or 'current'
            disease
        });
        return response.data;
    } catch (error) {
        console.error("Error adding disease:", error);
        throw error;
    }
};

export const addMedication = async (medication) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/medication", {
            token,
            medication
        });
        return response.data;
    } catch (error) {
        console.error("Error adding medication:", error);
        throw error;
    }
};

export const addExercise = async (exercise) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/exercise", {
            token,
            exercise
        });
        return response.data;
    } catch (error) {
        console.error("Error adding exercise:", error);
        throw error;
    }
};

export const addDailyMetrics = async (metrics) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/metrics", {
            token,
            metrics
        });
        return response.data;
    } catch (error) {
        console.error("Error adding daily metrics:", error);
        throw error;
    }
};

export const addDoctor = async (doctor) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/doctor", {
            token,
            doctor
        });
        return response.data;
    } catch (error) {
        console.error("Error adding doctor:", error);
        throw error;
    }
};

export const addCheckup = async (checkup) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.post("/checkup", {
            token,
            checkup
        });
        return response.data;
    } catch (error) {
        console.error("Error adding checkup:", error);
        throw error;
    }
};

export const deleteHealthItem = async (category, itemId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const response = await healthClient.delete("/delete", {
            data: {
                token,
                category,
                itemId
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting item:", error);
        throw error;
    }
};

