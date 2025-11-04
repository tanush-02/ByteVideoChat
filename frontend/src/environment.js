// Resolve backend base URL from env, falling back to localhost in dev
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Use REACT_APP_SERVER_URL when provided (e.g., on Vercel)
// Fallback to localhost in development
const server = process.env.REACT_APP_SERVER_URL || (isLocalhost ? 'http://localhost:8000' : '');

export default server;