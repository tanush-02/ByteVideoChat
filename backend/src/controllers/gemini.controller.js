import httpStatus from "http-status";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/user.model.js";
import { Health } from "../models/health.model.js";
import { Finance } from "../models/finance.model.js";
import { Travel } from "../models/travel.model.js";

// Get API key from environment variables (will be set after dotenv.config() in app.js)
// Use a function to get it lazily to ensure dotenv has loaded
const getGeminiApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("ERROR: GEMINI_API_KEY is not set in environment variables!");
        console.error("For local development: Create a .env file in the backend directory");
        console.error("For Render deployment: Set GEMINI_API_KEY in Render dashboard Environment section");
        throw new Error("GEMINI_API_KEY environment variable is required");
    }
    return apiKey;
};

// Initialize genAI lazily when first used
let genAI = null;
const getGenAI = () => {
    if (!genAI) {
        const apiKey = getGeminiApiKey();
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

// Cache for available model (to avoid repeated API calls)
let cachedModel = null;
let modelName = null;

const isQuotaError = (error) => {
    if (!error) return false;
    const msg = error.message?.toLowerCase() || "";
    return error.status === 429 || msg.includes("quota") || msg.includes("too many requests");
};

// Helper function to get an available model
const getAvailableModel = async () => {
    if (cachedModel && modelName) {
        console.log(`Using cached model: ${modelName}`);
        return cachedModel;
    }

    // List of models to try (in order of preference)
    // Note: Model availability depends on API key and region
    const modelsToTry = [
        "gemini-2.5-flash",  // Latest flash model (works with current API)
        "gemini-2.0-flash-exp",  // Experimental version
        "gemini-1.5-flash",  // Fallback
        "gemini-pro",  // Legacy fallback
    ];
    
    // Try models directly - skip test, just try to use the model
    const genAIInstance = getGenAI();
    let lastError = null;
    
    for (const modelNameToTry of modelsToTry) {
        try {
            const model = genAIInstance.getGenerativeModel({ model: modelNameToTry });
            // Don't test with "Hi" - just cache and use it
            // The actual request will fail if the model doesn't work
            console.log(`✓ Attempting to use model: ${modelNameToTry}`);
            cachedModel = model;
            modelName = modelNameToTry;
            return model;
        } catch (error) {
            lastError = error;
            // Check if it's a 404 (model not found) vs other errors
            if (error.status === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
                console.log(`✗ Model ${modelNameToTry} not found (404), trying next...`);
                continue;
            } else {
                // For other errors (like API key issues), log and continue
                console.log(`✗ Model ${modelNameToTry} error: ${error.message}`);
                console.log(`  Error status: ${error.status || 'N/A'}`);
                if (error.message?.includes('API key') || error.message?.includes('authentication')) {
                    console.error(`  ⚠️  API key issue detected! Check your GEMINI_API_KEY`);
                }
                continue;
            }
        }
    }
    
    // If we get here, all models failed to initialize
    console.error("All models failed to initialize. Last error:", lastError?.message);
    
    throw new Error(`No available Gemini models found. 
    
Possible issues:
1. API key may be invalid or expired - Get a new key at: https://makersuite.google.com/app/apikey
2. Models may not be available in your region
3. API key may not have access to Gemini models

Please verify your API key at: https://makersuite.google.com/app/apikey
Make sure you're using a valid Google AI Studio API key (not Vertex AI).`);
};

// Helper function to generate content with model fallback
const generateContentWithFallback = async (prompt) => {
    try {
        const model = await getAvailableModel();
        console.log(`Generating content with model: ${modelName || 'cached'}`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`Successfully generated content (${text.length} characters)`);
        return text;
    } catch (error) {
        // Reset cache on error so we can try again
        console.error("Error in generateContentWithFallback:", error.message);
        console.error("Error details:", error);
        cachedModel = null;
        modelName = null;
        throw error;
    }
};

// Get AI insights for a specific domain
const getDomainInsights = async (req, res) => {
    try {
        const { domain, context } = req.body;
        
        if (!domain) {
            return res.status(400).json({ message: "Domain is required" });
        }

        // Create domain-specific prompts
        const prompts = {
            finance: `Provide comprehensive financial insights and recommendations. Include:
1. Current market trends and analysis
2. Investment strategies
3. Risk management tips
4. Personal finance advice
Context: ${context || 'General finance advice'}`,
            
            healthcare: `Provide comprehensive healthcare and wellness insights. Include:
1. Health tips and recommendations
2. Wellness strategies
3. Preventive care advice
4. Lifestyle improvements
Context: ${context || 'General healthcare advice'}`,
            
            study: `Provide comprehensive study and learning strategies. Include:
1. Effective learning techniques
2. Study tips and best practices
3. Time management strategies
4. Educational resources and recommendations
Context: ${context || 'General study advice'}`,
            
            travel: `Provide comprehensive travel and planning insights. Include:
1. Travel recommendations
2. Weather-based travel tips
3. Destination highlights
4. Travel planning strategies
Context: ${context || 'General travel advice'}`,
            travelling: `Provide comprehensive travel and planning insights. Include:
1. Travel recommendations
2. Weather-based travel tips
3. Destination highlights
4. Travel planning strategies
Context: ${context || 'General travel advice'}`,
        };

        const prompt = prompts[domain] || `Provide comprehensive insights about ${domain}. Context: ${context || 'General information'}`;

        // Generate content with model fallback
        const text = await generateContentWithFallback(prompt);

        res.status(httpStatus.OK).json({
            domain,
            insight: text,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (isQuotaError(error)) {
            const fallbackInsight = generateFallbackInsight(domain, context);
            return res.status(httpStatus.OK).json({
                domain,
                insight: fallbackInsight,
                timestamp: new Date().toISOString(),
                fallback: true,
                notice: "Gemini quota reached, showing smart fallback insight."
            });
        }
        console.error("Gemini API Error in getDomainInsights:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Failed to generate insights",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get step-by-step solution procedure for a domain
const getSolutionProcedure = async (req, res) => {
    try {
        console.log("=== AI QUERY DEBUG START ===");
        console.log("Request body:", req.body);
        console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
        console.log("API Key preview:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "NOT SET");
        
        const { domain, query, context } = req.body;
        
        if (!domain) {
            console.log("ERROR: Domain is missing");
            return res.status(400).json({ message: "Domain is required" });
        }
        
        console.log("Domain:", domain);
        console.log("Query:", query);
        console.log("Context:", context);

        const solutionPrompts = {
            finance: `Create a concise 5-7 step procedure for: ${query || 'financial planning'}
IMPORTANT: Provide ONLY 5-7 essential steps. Be specific and actionable.
Format: 1. Step one 2. Step two etc.
Context: ${context || 'General financial planning'}`,
            
            healthcare: `Create a concise 5-7 step procedure for: ${query || 'healthcare management'}
IMPORTANT: Provide ONLY 5-7 essential steps. Be specific and actionable.
Format: 1. Step one 2. Step two etc.
Context: ${context || 'General healthcare management'}`,
            
            study: `Create a concise 5-7 step procedure for: ${query || 'effective studying'}
IMPORTANT: Provide ONLY 5-7 essential steps. Be specific and actionable.
Format: 1. Step one 2. Step two etc.
Context: ${context || 'General study planning'}`,
            
            travel: `Create a concise 5-7 step procedure for: ${query || 'travel planning'}
IMPORTANT: Provide ONLY 5-7 essential steps. Be specific and actionable.
Format: 1. Step one 2. Step two etc.
Context: ${context || 'General travel planning'}`,
            travelling: `Create a concise 5-7 step procedure for: ${query || 'travel planning'}
IMPORTANT: Provide ONLY 5-7 essential steps. Be specific and actionable.
Format: 1. Step one 2. Step two etc.
Context: ${context || 'General travel planning'}`,
        };

        const prompt = solutionPrompts[domain] || `Create a concise 5-7 step procedure for ${domain}. Query: ${query || 'general guidance'}. IMPORTANT: Provide ONLY 5-7 essential steps. Context: ${context || 'General information'}`;

        console.log("Generated prompt:", prompt.substring(0, 100) + "...");
        console.log("Calling generateContentWithFallback...");
        
        // Generate content with model fallback
        const text = await generateContentWithFallback(prompt);
        
        console.log("AI Response received, length:", text.length);
        console.log("Response preview:", text.substring(0, 100) + "...");
        console.log("=== AI QUERY DEBUG END ===");

        res.status(httpStatus.OK).json({
            domain,
            query: query || 'General solution',
            procedure: text,
            steps: extractSteps(text),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota reached. Using fallback procedure.");
            const fallbackProcedure = generateFallbackProcedure(domain, query, context);
            const fallbackSteps = ensureSteps(extractSteps(fallbackProcedure), fallbackProcedure);
            return res.status(httpStatus.OK).json({
                domain,
                query: query || 'General solution',
                procedure: fallbackProcedure,
                steps: fallbackSteps,
                timestamp: new Date().toISOString(),
                fallback: true,
                notice: "Gemini quota reached, showing smart fallback procedure."
            });
        }
        console.log("=== AI QUERY ERROR DEBUG ===");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        console.error("Error status:", error.status);
        console.error("Error code:", error.code);
        console.error("Full error object:", error);
        console.log("=== AI QUERY ERROR DEBUG END ===");
        console.error("Gemini API Error in getSolutionProcedure:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Failed to generate solution procedure",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function to extract steps from text
const extractSteps = (text) => {
    const steps = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Match numbered steps (1., 2., etc.) or bullet points
        const stepMatch = line.match(/^(\d+)[.)]\s*(.+)$/);
        if (stepMatch) {
            steps.push({
                number: parseInt(stepMatch[1]),
                description: stepMatch[2].trim()
            });
        }
    }
    
    return steps.length > 0 ? steps : null;
};

// Get comprehensive domain information
const getDomainInfo = async (req, res) => {
    try {
        const { domain } = req.params;
        
        if (!domain) {
            return res.status(400).json({ message: "Domain is required" });
        }

        const infoPrompt = `Provide comprehensive information about ${domain} domain. Include:
1. Overview and importance
2. Key concepts and principles
3. Current trends and developments
4. Best practices
5. Common challenges and solutions
6. Resources and tools
Format the response in a structured, easy-to-read format.`;

        // Generate content with model fallback
        const text = await generateContentWithFallback(infoPrompt);

        res.status(httpStatus.OK).json({
            domain,
            information: text,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (isQuotaError(error)) {
            const fallbackInfo = generateFallbackInfo(domain);
            return res.status(httpStatus.OK).json({
                domain,
                information: fallbackInfo,
                timestamp: new Date().toISOString(),
                fallback: true,
                notice: "Gemini quota reached, showing smart fallback information."
            });
        }
        console.error("Gemini API Error in getDomainInfo:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Failed to fetch domain information",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Test endpoint to diagnose model availability
const testModels = async (req, res) => {
    try {
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-pro",
        ];
        
        const results = [];
        const genAIInstance = getGenAI();
        
        for (const modelName of modelsToTry) {
            try {
                const model = genAIInstance.getGenerativeModel({ model: modelName });
                const testResult = await model.generateContent("test");
                await testResult.response;
                results.push({ model: modelName, status: "✓ Working" });
            } catch (error) {
                results.push({ 
                    model: modelName, 
                    status: "✗ Failed", 
                    error: error.message,
                    statusCode: error.status 
                });
            }
        }
        
        res.status(200).json({
            message: "Model availability test",
            results,
            apiKeyConfigured: !!process.env.GEMINI_API_KEY,
            apiKeyPreview: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "Not configured",
            note: "If all models fail, check: https://makersuite.google.com/app/apikey"
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Test failed",
            error: error.message 
        });
    }
};

// Get AI-powered sentiment recommendations based on user profile
const getSentimentRecommendations = async (req, res) => {
    try {
        const { userProfile, overallScore, domainData } = req.body;
        
        if (!userProfile) {
            return res.status(400).json({ message: "User profile data is required" });
        }

        // Extract real user data
        const healthData = userProfile.health?.rawData || domainData?.health;
        const financeData = userProfile.finance?.rawData || domainData?.finance;
        const travelData = userProfile.travel?.rawData || domainData?.travel;
        
        // Build comprehensive context from real user data
        let healthContext = 'No health data available';
        if (healthData) {
            const currentDiseases = healthData.currentDiseases?.length || 0;
            const activeMeds = healthData.medications?.filter(m => m.isActive)?.length || 0;
            const recentExercises = healthData.exercises?.filter(e => {
                const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 7;
            })?.length || 0;
            const upcomingCheckups = healthData.checkups?.filter(c => new Date(c.scheduledDate) > new Date())?.length || 0;
            
            healthContext = `Current Health Status:
- Active Conditions: ${currentDiseases} (${healthData.currentDiseases?.map(d => `${d.name} (${d.severity})`).join(', ') || 'None'})
- Active Medications: ${activeMeds} (${healthData.medications?.filter(m => m.isActive).map(m => m.name).join(', ') || 'None'})
- Exercises This Week: ${recentExercises}
- Upcoming Checkups: ${upcomingCheckups}
- Status: ${userProfile.health?.state?.status || 'Unknown'}`;
        }
        
        let financeContext = 'No finance data available';
        if (financeData) {
            const totalSavings = financeData.savings?.total || 0;
            const stocks = financeData.investments?.stocks || [];
            const mutualFunds = financeData.investments?.mutualFunds || [];
            const totalInvestments = financeData.investments?.total || 0;
            const avgStockReturn = stocks.length > 0 
                ? (stocks.reduce((sum, s) => sum + (s.profitLossPercent || 0), 0) / stocks.length).toFixed(1)
                : 0;
            
            financeContext = `Portfolio Status:
- Total Savings: ₹${(totalSavings / 1000).toFixed(0)}K
- Total Investments: ₹${(totalInvestments / 1000).toFixed(0)}K
- Stocks: ${stocks.length} holdings (${avgStockReturn}% avg return)
- Mutual Funds: ${mutualFunds.length} funds
- Status: ${userProfile.finance?.state?.status || 'Unknown'}`;
        }
        
        let travelContext = 'No travel data available';
        if (travelData) {
            const upcomingTrips = travelData.upcomingTrips?.filter(t => {
                return new Date(t.startDate) > new Date() && t.status !== 'Cancelled';
            }) || [];
            const pastTrips = travelData.pastTrips?.length || 0;
            const wishlist = travelData.wishlist?.length || 0;
            
            travelContext = `Travel Status:
- Upcoming Trips: ${upcomingTrips.length} (${upcomingTrips.map(t => `${t.destination} on ${new Date(t.startDate).toLocaleDateString()}`).join(', ') || 'None'})
- Past Trips: ${pastTrips}
- Wishlist: ${wishlist} destinations
- Status: ${userProfile.travel?.state?.status || 'Unknown'}`;
        }
        
        const context = `
Comprehensive User Profile Analysis - Real Data Training:

HEALTH & WELLNESS:
${healthContext}
- Sentiment Analysis: ${userProfile.health?.sentiment || 'neutral'}
- Key Insights: ${userProfile.health?.state?.summary?.join('; ') || 'No insights'}

FINANCE & INVESTMENTS:
${financeContext}
- Sentiment Analysis: ${userProfile.finance?.sentiment || 'neutral'}
- Key Insights: ${userProfile.finance?.state?.summary?.join('; ') || 'No insights'}

TRAVEL & LIFESTYLE:
${travelContext}
- Sentiment Analysis: ${userProfile.travel?.sentiment || 'neutral'}
- Key Insights: ${userProfile.travel?.state?.summary?.join('; ') || 'No insights'}

STUDY & LEARNING:
- Sentiment: ${userProfile.study?.sentiment || 'neutral'}
- Activity: ${userProfile.study?.data?.length || 0} interactions

OVERALL ANALYSIS:
- Overall Mood Score: ${overallScore || 0}
- Health Status: ${userProfile.health?.state?.status || 'Unknown'}
- Portfolio Status: ${userProfile.finance?.state?.status || 'Unknown'}
- Travel Status: ${userProfile.travel?.state?.status || 'Unknown'}

Based on this comprehensive analysis of REAL user data (health records, portfolio, travel plans), provide personalized, actionable recommendations that:
1. Address specific health conditions, medications, and exercise patterns
2. Suggest financial strategies based on actual portfolio performance and savings
3. Recommend travel optimizations based on upcoming trips and preferences
4. Provide holistic lifestyle improvements

Format as clear, numbered recommendations with specific actionable steps. Reference the actual data (e.g., "Given your ${healthData?.currentDiseases?.length || 0} active conditions..." or "Your portfolio shows ${avgStockReturn}% returns..."). Make it feel like a personalized AI coach analyzing their complete real-world profile.
        `.trim();

        let text;
        let usedFallback = false;
        try {
            text = await generateContentWithFallback(context);
        } catch (error) {
            if (isQuotaError(error)) {
                text = generateFallbackRecommendations(userProfile, overallScore);
                usedFallback = true;
            } else {
                throw error;
            }
        }

        res.status(httpStatus.OK).json({
            recommendations: text,
            profileSummary: {
                overallScore: overallScore || 0,
                totalInteractions: Object.values(userProfile).reduce((sum, p) => sum + (p.data?.length || 0), 0),
                domainsAnalyzed: Object.keys(userProfile).length
            },
            timestamp: new Date().toISOString(),
            fallback: usedFallback || undefined,
            notice: usedFallback ? "Gemini quota reached, showing smart fallback recommendations." : undefined
        });
    } catch (error) {
        if (isQuotaError(error)) {
            const fallbackText = generateFallbackRecommendations(userProfile, overallScore);
            return res.status(httpStatus.OK).json({
                recommendations: fallbackText,
                profileSummary: {
                    overallScore: overallScore || 0,
                    totalInteractions: Object.values(userProfile).reduce((sum, p) => sum + (p.data?.length || 0), 0),
                    domainsAnalyzed: Object.keys(userProfile).length
                },
                timestamp: new Date().toISOString(),
                fallback: true,
                notice: "Gemini quota reached, showing smart fallback recommendations."
            });
        }
        console.error("Gemini API Error in getSentimentRecommendations:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Failed to generate sentiment recommendations",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getPersonalizedRecommendations = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const [healthRecord, financeRecord, travelRecord] = await Promise.all([
            Health.findOne({ userId: user.username }),
            Finance.findOne({ userId: user.username }),
            Travel.findOne({ userId: user.username })
        ]);

        let healthScore = 0;
        let healthStatus = "No health data available";
        let healthSummary = [];
        if (healthRecord) {
            const severeCount = (healthRecord.currentDiseases || []).filter(d => d.severity === 'Severe').length;
            const currentCount = (healthRecord.currentDiseases || []).length;
            if (currentCount > 0) {
                healthScore -= severeCount * 0.5;
                healthScore -= (currentCount - severeCount) * 0.2;
                healthStatus = `${currentCount} active condition${currentCount > 1 ? 's' : ''}`;
                healthSummary.push(`${currentCount} current condition(s)`);
            } else {
                healthScore += 0.3;
                healthStatus = 'No active conditions';
                healthSummary.push('No current health issues');
            }
            const activeMeds = (healthRecord.medications || []).filter(m => m.isActive);
            if (activeMeds.length > 0) {
                healthSummary.push(`${activeMeds.length} active medication(s)`);
            }
            const recentExercises = (healthRecord.exercises || []).filter(e => {
                const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 7;
            });
            if (recentExercises.length > 0) {
                healthScore += 0.3;
                healthSummary.push(`${recentExercises.length} exercise(s) this week`);
            }
            const recentMetrics = (healthRecord.dailyMetrics || []).slice(-7);
            if (recentMetrics.length > 0) {
                const avgSteps = recentMetrics.reduce((sum, m) => sum + (m.steps || 0), 0) / recentMetrics.length;
                if (avgSteps > 5000) healthScore += 0.2;
                healthSummary.push(`Avg ${Math.round(avgSteps)} steps/day`);
            }
            const upcomingCheckups = (healthRecord.checkups || []).filter(c => new Date(c.scheduledDate) > new Date());
            if (upcomingCheckups.length > 0) {
                healthSummary.push(`${upcomingCheckups.length} upcoming checkup(s)`);
            }
        }

        let financeScore = 0;
        let financeStatus = "No finance data available";
        let financeSummary = [];
        if (financeRecord) {
            const totalSavings = financeRecord.savings?.total || 0;
            if (totalSavings > 0) {
                financeScore += 0.2;
                financeStatus = `₹${(totalSavings / 100000).toFixed(1)}L in savings`;
                financeSummary.push(`₹${(totalSavings / 1000).toFixed(0)}K total savings`);
            }
            const stocks = financeRecord.investments?.stocks || [];
            const mutualFunds = financeRecord.investments?.mutualFunds || [];
            const totalInvestments = financeRecord.investments?.total || 0;
            if (stocks.length > 0) {
                const profitPercent = stocks.reduce((sum, s) => sum + (s.profitLossPercent || 0), 0) / stocks.length;
                if (profitPercent > 0) {
                    financeScore += 0.3;
                } else {
                    financeScore -= 0.1;
                }
                financeSummary.push(`${stocks.length} stock(s), ${profitPercent.toFixed(1)}% avg return`);
            }
            if (mutualFunds.length > 0) {
                const mfProfitPercent = mutualFunds.reduce((sum, mf) => sum + (mf.profitLossPercent || 0), 0) / mutualFunds.length;
                if (mfProfitPercent > 0) financeScore += 0.2;
                financeSummary.push(`${mutualFunds.length} mutual fund(s), ${mfProfitPercent.toFixed(1)}% avg return`);
            }
            if (totalInvestments > 0) {
                financeStatus = `₹${(totalInvestments / 100000).toFixed(1)}L portfolio`;
                financeSummary.push(`₹${(totalInvestments / 1000).toFixed(0)}K total investments`);
            }
            const recentTransactions = (financeRecord.transactions || []).slice(-10);
            if (recentTransactions.length > 0) {
                const expenses = recentTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                const income = recentTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
                if (income > expenses) {
                    financeScore += 0.2;
                    financeSummary.push(`Positive cash flow: ₹${((income - expenses) / 1000).toFixed(0)}K`);
                } else {
                    financeScore -= 0.1;
                    financeSummary.push(`Negative cash flow: ₹${((expenses - income) / 1000).toFixed(0)}K`);
                }
            }
        }

        let travelScore = 0;
        let travelStatus = "No travel data available";
        let travelSummary = [];
        if (travelRecord) {
            const upcomingTrips = (travelRecord.upcomingTrips || []).filter(t => new Date(t.startDate) > new Date() && t.status !== 'Cancelled');
            if (upcomingTrips.length > 0) {
                travelScore += 0.4;
                travelStatus = `${upcomingTrips.length} upcoming trip${upcomingTrips.length > 1 ? 's' : ''}`;
                travelSummary.push(`${upcomingTrips.length} upcoming trip(s)`);
            }
            const pastTrips = travelRecord.pastTrips || [];
            if (pastTrips.length > 0) {
                const avgRating = pastTrips.reduce((sum, t) => sum + (t.rating || 0), 0) / pastTrips.length;
                if (avgRating >= 4) travelScore += 0.2;
                travelSummary.push(`${pastTrips.length} past trip(s), ${avgRating.toFixed(1)} avg rating`);
            }
            const wishlist = travelRecord.wishlist || [];
            if (wishlist.length > 0) {
                travelScore += 0.1;
                travelSummary.push(`${wishlist.length} destination(s) in wishlist`);
            }
            if (upcomingTrips.length === 0 && pastTrips.length === 0) {
                travelStatus = 'No travel plans';
            }
        }

        const overallScore = [healthScore, financeScore, travelScore].reduce((sum, s) => sum + s, 0) / 3;

        const healthContext = healthRecord ? `Current Health Status:
- Status: ${healthStatus}
- Insights: ${healthSummary.join('; ') || 'None'}` : 'No health data available';
        const financeContext = financeRecord ? `Portfolio Status:
- Status: ${financeStatus}
- Insights: ${financeSummary.join('; ') || 'None'}` : 'No finance data available';
        const travelContext = travelRecord ? `Travel Status:
- Status: ${travelStatus}
- Insights: ${travelSummary.join('; ') || 'None'}` : 'No travel data available';

        const context = `Comprehensive User Profile Analysis - Real Data Training:

HEALTH & WELLNESS:
${healthContext}

FINANCE & INVESTMENTS:
${financeContext}

TRAVEL & LIFESTYLE:
${travelContext}

OVERALL ANALYSIS:
- Overall Mood Score: ${overallScore}

Based on this comprehensive analysis of real user data, provide personalized, actionable recommendations for health and finance, including immediate steps and medium-term plans. Format as clear, numbered recommendations with specific actions and thresholds.`;

        const text = await generateContentWithFallback(context);

        return res.status(httpStatus.OK).json({
            recommendations: text,
            profileSummary: {
                overallScore,
                domainsAnalyzed: ['health', 'finance', 'travel'].filter(d => {
                    if (d === 'health') return !!healthRecord;
                    if (d === 'finance') return !!financeRecord;
                    if (d === 'travel') return !!travelRecord;
                }).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to generate personalized recommendations", error: error.message });
    }
};

const generateFallbackProcedure = (domain, query, context) => {
    const templates = {
        finance: [
            "Evaluate current income, expenses, and outstanding liabilities",
            "Define short, medium, and long-term financial goals",
            "Cover essentials first: emergency fund, insurance, risk mitigation",
            "Allocate investments across equity, debt, and alternatives",
            "Automate savings, SIPs, and bill payments",
            "Review portfolio performance monthly and rebalance quarterly",
            "Track progress, adjust budgets, and note regulatory changes"
        ],
        healthcare: [
            "Capture current health metrics, medications, and lifestyle habits",
            "Set measurable wellness goals (sleep, activity, nutrition)",
            "Design daily routines for meals, hydration, exercise, and rest",
            "Schedule preventive checkups and medicine adherence reminders",
            "Log symptoms, vitals, and mood in a weekly tracker",
            "Build support network: doctors, specialists, emergency contacts",
            "Review goals fortnightly and adjust with medical guidance"
        ],
        study: [
            "List subjects, topics, and current proficiency for each",
            "Set SMART goals with timelines and success criteria",
            "Create weekly timetable with focused study blocks & breaks",
            "Use active recall, spaced repetition, and mock tests",
            "Consolidate notes using mind maps and flashcards",
            "Track progress through quizzes and mentor feedback",
            "Iterate plan every two weeks based on performance"
        ],
        travel: [
            "Define trip objective, budget, and preferred dates",
            "Research destinations, visa needs, and weather",
            "Book transport and stay with cancellation buffers",
            "Plan daily itinerary with must-visit and rest periods",
            "Arrange insurance, emergency contacts, and backups",
            "Pack essentials aligned with climate and activities",
            "Confirm bookings 48 hours prior and monitor alerts"
        ]
    };
    const steps = templates[domain] || templates.travel;
    return steps.map((step, idx) => `${idx + 1}. ${step}`).join("\n");
};

const ensureSteps = (steps, fallbackProcedure) => {
    if (steps && steps.length > 0) return steps;
    return fallbackProcedure.split('\n').map((line, idx) => {
        const cleaned = line.replace(/^\d+[.)]\s*/, '').trim();
        if (!cleaned) return null;
        return { number: idx + 1, description: cleaned };
    }).filter(Boolean);
};

const generateFallbackInsight = (domain, context) => {
    const insights = {
        finance: "Focus on resilient budgeting, diversified investments, and periodic reviews. Preserve emergency funds and automate goals.",
        healthcare: "Balance nutrition, exercise, and rest. Track vitals weekly, schedule preventive checkups, and manage stress intentionally.",
        study: "Use structured plans with active recall, spaced repetition, and consistent reviews. Reflect weekly and adjust workload.",
        travel: "Plan early with flexible options, confirm documentation, and keep contingency buffers for transport and stay."
    };
    return `${insights[domain] || "Maintain balance and track measurable progress."}\nContext Reference: ${context || "General guidance"}`;
};

const generateFallbackInfo = (domain) => {
    const info = {
        finance: `Finance Overview:
1. Importance: Enables wealth creation, protection, and legacy planning
2. Key Concepts: Budgeting, investing, insurance, credit management
3. Trends: Digital finance, robo-advisors, sustainable investing
4. Best Practices: Diversification, emergency funds, periodic review
5. Challenges: Market volatility, inflation, behavioral biases`,
        healthcare: `Healthcare Overview:
1. Importance: Prevents disease, extends lifespan, improves quality of life
2. Concepts: Preventive care, chronic management, lifestyle medicine
3. Trends: Telehealth, wearables, personalized treatments
4. Practices: Regular screening, balanced lifestyle, adherence
5. Challenges: Access, continuity, misinformation`,
        study: `Study Overview:
1. Importance: Builds knowledge, skills, and competitiveness
2. Concepts: Active learning, feedback loops, mastery learning
3. Trends: Microlearning, AI tutoring, collaborative platforms
4. Practices: SMART goals, consistent schedule, assessments
5. Challenges: Distractions, motivation, retention`,
        travel: `Travel Overview:
1. Importance: Expands perspective, supports mental wellness
2. Concepts: Planning, budgeting, cultural readiness
3. Trends: Sustainable tourism, experiential travel, remote work trips
4. Practices: Early research, flexibility, contingency planning
5. Challenges: Costs, safety, regulations`
    };
    return info[domain] || info.travel;
};

const generateFallbackRecommendations = (profile, overallScore) => {
    const sections = [];
    if (profile.health?.state) {
        sections.push(`Health: ${profile.health.state.status}. Focus on ${profile.health.state.summary?.join(', ') || 'consistent routines and preventive care'}.`);
    }
    if (profile.finance?.state) {
        sections.push(`Finance: ${profile.finance.state.status}. Prioritize ${profile.finance.state.summary?.join(', ') || 'budget discipline and portfolio review'}.`);
    }
    if (profile.travel?.state) {
        sections.push(`Travel: ${profile.travel.state.status}. Plan around ${profile.travel.state.summary?.join(', ') || 'structured itineraries with contingency buffers'}.`);
    }
    sections.push(`Overall Mood Score: ${(overallScore || 0).toFixed(2)}. Track metrics weekly and recalibrate every fortnight.`);
    return `AI Guidance (Offline Model):\n${sections.map((section, idx) => `${idx + 1}. ${section}`).join('\n')}`;
};

export { getDomainInsights, getSolutionProcedure, getDomainInfo, testModels, getSentimentRecommendations, getPersonalizedRecommendations };
