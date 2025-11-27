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
        return generateLocalFallbackProcedure(domain, query, context, error);
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

export const getPersonalizedRecommendations = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`${API_BASE_URL}/personalized?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch personalized recommendations');
        }
        const data = await response.json();
        return data.recommendations;
    } catch (error) {
        console.error('Error fetching personalized recommendations:', error);
        throw error;
    }
};

const generateLocalFallbackProcedure = (domain, query, context, originalError) => {
    const topic = query || `core ${domain} planning`;
    const template = {
        finance: [
            "Assess current financial position: income, expenses, liabilities",
            "Define SMART goals for savings, investments, and emergency funds",
            "Allocate budget across essentials, growth, protection, lifestyle",
            "Choose investment mix (equity/debt) aligned to risk appetite",
            "Automate savings, SIPs, and bill payments to enforce discipline",
            "Track performance monthly and rebalance quarterly",
            "Review insurance, tax planning, and contingency plans annually"
        ],
        healthcare: [
            "Document health history, current conditions, and medications",
            "Set measurable wellness goals (sleep, nutrition, activity)",
            "Design daily routines covering meals, hydration, exercise, recovery",
            "Schedule preventive checkups and medication reminders",
            "Track vitals/symptoms weekly via journal or app",
            "Build support network: doctors, caregivers, emergency contacts",
            "Review progress bi-weekly and adjust plan with medical guidance"
        ],
        study: [
            "List subjects/topics and evaluate current proficiency",
            "Set clear timelines with weekly and monthly learning targets",
            "Create time-blocked schedule mixing study, practice, revision",
            "Use active recall, spaced repetition, and mock tests",
            "Consolidate notes using summaries, flashcards, mind maps",
            "Track scores and feedback to spot weak areas",
            "Iterate plan every 2 weeks based on performance and workload"
        ],
        travel: [
            "Define purpose, budget, travel dates, and group size",
            "Shortlist destinations and check visa, weather, entry rules",
            "Book transport and stay with cancellation buffers",
            "Draft itinerary balancing must-visit spots with rest periods",
            "Arrange insurance, emergency contacts, and offline backups",
            "Pack essentials based on climate, activities, health needs",
            "Confirm bookings 48h prior and monitor travel advisories"
        ]
    };

    const steps = (template[domain] || template.travel).map((step, idx) => ({
        number: idx + 1,
        description: step
    }));

    return {
        domain,
        query: topic,
        procedure: steps.map(step => `${step.number}. ${step.description}`).join('\n'),
        steps,
        timestamp: new Date().toISOString(),
        fallback: true,
        notice: 'Gemini quota reached, showing smart offline procedure.',
        error: originalError?.message
    };
};
