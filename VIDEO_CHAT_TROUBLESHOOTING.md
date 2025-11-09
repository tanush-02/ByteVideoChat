# Video Chat Troubleshooting Guide

## Current Configuration

### Frontend (`frontend/src/environment.js`)
- **Current Backend URL**: `https://bytebackend-0aya.onrender.com`
- This is hardcoded as fallback if `REACT_APP_API_URL` is not set

### Backend Socket.IO Configuration
- **CORS**: Set to `"*"` (allows all origins) ✓
- **Transports**: WebSocket and polling ✓
- **Port**: Uses `process.env.PORT` or defaults to 8000

## Common Issues & Solutions

### Issue 1: Wrong Backend URL
**Symptom**: Socket connection fails, "Failed to connect to server" error

**Check**:
1. Verify your Render backend URL is correct
2. The URL in `frontend/src/environment.js` should match your actual Render backend URL
3. Check Render dashboard → Your backend service → URL

**Fix**:
- Set `REACT_APP_API_URL` in your frontend deployment environment variables
- Or update the hardcoded URL in `frontend/src/environment.js` to match your Render backend

### Issue 2: Socket.IO Connection Issues on Render
**Symptom**: Connection works locally but not on Render

**Possible Causes**:
1. **WebSocket not enabled**: Render supports WebSockets, but ensure your service type is "Web Service"
2. **Port binding**: Render sets `PORT` automatically - your code handles this correctly
3. **HTTPS/WSS**: Frontend on HTTPS needs backend on HTTPS (WSS for WebSocket)

**Check**:
- Is your backend service type "Web Service" (not "Background Worker")?
- Are both frontend and backend using HTTPS?
- Check Render logs for socket.io connection errors

### Issue 3: CORS Issues
**Current Status**: CORS is set to `"*"` which should allow all origins

**If still having issues**:
- Check browser console for CORS errors
- Verify the frontend URL is in the allowed origins (currently all are allowed)

### Issue 4: Environment Variable Not Set
**Symptom**: Frontend connecting to wrong URL

**Fix**:
1. In your frontend deployment (Render/other):
   - Set environment variable: `REACT_APP_API_URL`
   - Value: Your actual backend URL (e.g., `https://bytebackend-0aya.onrender.com`)
2. Rebuild and redeploy frontend

## Diagnostic Steps

### 1. Check Backend URL
```bash
# In browser console on your deployed frontend:
console.log(process.env.REACT_APP_API_URL)
# Should show your Render backend URL
```

### 2. Test Socket Connection
```javascript
// In browser console:
import io from 'socket.io-client';
const socket = io('https://bytebackend-0aya.onrender.com');
socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### 3. Check Render Logs
- Go to Render dashboard → Your backend service → Logs
- Look for "SOMETHING CONNECTED" message when frontend tries to connect
- Check for any socket.io errors

### 4. Verify Service Type
- Backend must be "Web Service" (not "Background Worker")
- Web Service type enables WebSocket support

## Quick Fixes (Non-Breaking)

### Option 1: Set Environment Variable (Recommended)
In your frontend deployment platform:
- Add: `REACT_APP_API_URL=https://your-actual-backend-url.onrender.com`
- Rebuild frontend

### Option 2: Update Hardcoded URL
If you can't set environment variables:
- Edit `frontend/src/environment.js`
- Change the fallback URL to your actual Render backend URL
- Rebuild and redeploy

## What to Check Right Now

1. **What is your actual Render backend URL?**
   - Render dashboard → Backend service → Settings → URL
   - Does it match `https://bytebackend-0aya.onrender.com`?

2. **Is your frontend deployed?**
   - If yes, what URL is it deployed to?
   - Is it using the correct backend URL?

3. **Check browser console**
   - Open developer tools → Console
   - Look for socket.io connection errors
   - Check Network tab for failed WebSocket connections

4. **Check Render backend logs**
   - Do you see "SOMETHING CONNECTED" when trying to join a video call?
   - Any error messages?

## Current Code Status

✅ **Working correctly**:
- Socket.IO CORS configuration (allows all origins)
- Environment variable support in frontend
- WebSocket transport configuration
- Port handling for Render

⚠️ **Needs verification**:
- Backend URL matches actual Render deployment
- Frontend environment variable is set correctly
- Both services are using HTTPS


