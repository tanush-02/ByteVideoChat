import server from '../environment';

const API_BASE_URL = `${server}/api/v1/ai`;

// Get AI insights for a domain
export const getDomainInsights = async (domain, context = '') => {
    try {
        const response = await fetch(`${API_BASE_URL}/insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ domain, context }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch insights');
        }

        const data = await response.json();
        return data.insight;
    } catch (error) {
        console.error('Error fetching domain insights:', error);
        throw error;
    }
};

// Get step-by-step solution procedure
export const getSolutionProcedure = async (domain, query = '', context = '') => {
    try {
        const response = await fetch(`${API_BASE_URL}/solution`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ domain, query, context }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch solution procedure');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching solution procedure:', error);
        throw error;
    }
};

// Get comprehensive domain information
export const getDomainInfo = async (domain) => {
    try {
        const response = await fetch(`${API_BASE_URL}/info/${domain}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch domain information');
        }

        const data = await response.json();
        return data.information;
    } catch (error) {
        console.error('Error fetching domain info:', error);
        throw error;
    }
};

// Get AI-powered sentiment recommendations
export const getSentimentRecommendations = async (userProfile, overallScore, domainData = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}/sentiment-recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userProfile, overallScore, domainData }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch sentiment recommendations');
        }

        const data = await response.json();
        return data.recommendations;
    } catch (error) {
        console.error('Error fetching sentiment recommendations:', error);
        throw error;
    }
};

