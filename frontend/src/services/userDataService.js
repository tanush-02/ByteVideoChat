import server from '../environment';

const API_BASE_URL = server;

// Get user health data
export const getUserHealthData = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/v1/health?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch health data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching health data:', error);
        throw error;
    }
};

// Get user finance/portfolio data
export const getUserFinanceData = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/v1/finance?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch finance data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching finance data:', error);
        throw error;
    }
};

// Get user travel data
export const getUserTravelData = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/v1/travel?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch travel data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching travel data:', error);
        throw error;
    }
};

// Get all user data for sentiment analysis
export const getAllUserData = async () => {
    try {
        const [healthData, financeData, travelData] = await Promise.allSettled([
            getUserHealthData().catch(() => null),
            getUserFinanceData().catch(() => null),
            getUserTravelData().catch(() => null)
        ]);

        return {
            health: healthData.status === 'fulfilled' ? healthData.value : null,
            finance: financeData.status === 'fulfilled' ? financeData.value : null,
            travel: travelData.status === 'fulfilled' ? travelData.value : null
        };
    } catch (error) {
        console.error('Error fetching all user data:', error);
        return { health: null, finance: null, travel: null };
    }
};

