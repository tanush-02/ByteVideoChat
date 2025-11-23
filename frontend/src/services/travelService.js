import axios from 'axios';
import server from '../environment';

const travelClient = axios.create({
    baseURL: `${server}/api/v1/travel`
});

export const getTravelRecord = async (token) => {
    try {
        const response = await travelClient.get('/', {
            params: { token }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching travel record:', error);
        throw error;
    }
};

export const addFuturePlan = async (token, plan) => {
    try {
        console.log('Sending future plan request:', { token: token ? 'present' : 'missing', plan });
        const response = await travelClient.post('/future', {
            token,
            plan
        });
        console.log('Future plan response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding future plan:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

export const addActivePlan = async (token, plan) => {
    try {
        console.log('Sending active plan request:', { token: token ? 'present' : 'missing', plan });
        const response = await travelClient.post('/active', {
            token,
            plan
        });
        console.log('Active plan response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding active plan:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

export const addHistoryPlan = async (token, plan) => {
    try {
        console.log('Sending history plan request:', { token: token ? 'present' : 'missing', plan });
        const response = await travelClient.post('/history', {
            token,
            plan
        });
        console.log('History plan response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding history plan:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

export const completePlan = async (token, planId, fromCategory, actualSpent = null, rating = null, notes = null) => {
    try {
        const response = await travelClient.post('/complete', {
            token,
            planId,
            fromCategory,
            actualSpent,
            rating,
            notes
        });
        return response.data;
    } catch (error) {
        console.error('Error completing plan:', error);
        throw error;
    }
};

export const activatePlan = async (token, planId) => {
    try {
        const response = await travelClient.post('/activate', {
            token,
            planId
        });
        return response.data;
    } catch (error) {
        console.error('Error activating plan:', error);
        throw error;
    }
};

export const deletePlan = async (token, category, planId) => {
    try {
        const response = await travelClient.post('/delete', {
            token,
            category,
            planId
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting plan:', error);
        throw error;
    }
};

export const updatePlan = async (token, category, planId, updates) => {
    try {
        const response = await travelClient.put('/update', {
            token,
            category,
            planId,
            updates
        });
        return response.data;
    } catch (error) {
        console.error('Error updating plan:', error);
        throw error;
    }
};

