// Get server URL from environment variable or use default
// For local development, use http://localhost:8000
// For production, use the deployed backend URL
const server = process.env.REACT_APP_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? "http://localhost:8000" 
        : "https://bytebackend-0aya.onrender.com");

console.log('Using backend server:', server);

export default server;