import httpStatus from "http-status";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        const { domain, query, context } = req.body;
        
        if (!domain) {
            return res.status(400).json({ message: "Domain is required" });
        }

        const solutionPrompts = {
            finance: `Create a step-by-step procedure for financial planning and management. 
${query ? `Specific query: ${query}` : 'Provide a comprehensive financial solution procedure.'}
Include:
1. Assessment phase
2. Planning phase
3. Implementation steps
4. Monitoring and review
5. Risk management
Format as a clear, numbered step-by-step guide.
Context: ${context || 'General financial planning'}`,
            
            healthcare: `Create a step-by-step procedure for healthcare and wellness management.
${query ? `Specific query: ${query}` : 'Provide a comprehensive healthcare solution procedure.'}
Include:
1. Health assessment
2. Goal setting
3. Action plan
4. Implementation steps
5. Monitoring and adjustments
Format as a clear, numbered step-by-step guide.
Context: ${context || 'General healthcare management'}`,
            
            study: `Create a step-by-step procedure for effective learning and study management.
${query ? `Specific query: ${query}` : 'Provide a comprehensive study solution procedure.'}
Include:
1. Learning assessment
2. Goal setting
3. Study plan creation
4. Implementation strategies
5. Review and improvement
Format as a clear, numbered step-by-step guide.
Context: ${context || 'General study planning'}`,
            
            travel: `Create a step-by-step procedure for travel planning and management.
${query ? `Specific query: ${query}` : 'Provide a comprehensive travel solution procedure.'}
Include:
1. Destination research
2. Budget planning
3. Itinerary creation
4. Booking and preparation
5. Travel execution
Format as a clear, numbered step-by-step guide.
Context: ${context || 'General travel planning'}`,
            travelling: `Create a step-by-step procedure for travel planning and management.
${query ? `Specific query: ${query}` : 'Provide a comprehensive travel solution procedure.'}
Include:
1. Destination research
2. Budget planning
3. Itinerary creation
4. Booking and preparation
5. Travel execution
Format as a clear, numbered step-by-step guide.
Context: ${context || 'General travel planning'}`,
        };

        const prompt = solutionPrompts[domain] || `Create a step-by-step procedure for ${domain}. ${query ? `Query: ${query}` : ''} Context: ${context || 'General information'}`;

        // Generate content with model fallback
        const text = await generateContentWithFallback(prompt);

        res.status(httpStatus.OK).json({
            domain,
            query: query || 'General solution',
            procedure: text,
            steps: extractSteps(text),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
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

export { getDomainInsights, getSolutionProcedure, getDomainInfo, testModels };

