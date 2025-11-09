# Render Deployment Guide

## Setting Up Environment Variables on Render

Render doesn't automatically read `.env` files. You need to set environment variables in the Render dashboard.

### Steps:

1. **Go to your Render Dashboard**
   - Navigate to your service (backend)
   - Click on "Environment" in the left sidebar

2. **Add Environment Variables**
   Click "Add Environment Variable" and add these:

   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   MONGO_URL=your_mongodb_connection_string_here
   PORT=8000
   ```

3. **For MongoDB (if using MongoDB Atlas)**
   - Your connection string should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

4. **Redeploy**
   - After adding environment variables, Render will automatically redeploy
   - Or click "Manual Deploy" → "Deploy latest commit"

### Environment Variables Required:

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | `AIzaSyC...` |
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port (optional, defaults to 8000) | `8000` |

### Troubleshooting:

**Error: "GEMINI_API_KEY environment variable is required"**
- Make sure you added `GEMINI_API_KEY` in Render dashboard
- Check that the variable name is exactly `GEMINI_API_KEY` (case-sensitive)
- Redeploy after adding variables

**Error: "MONGO_URL is not set"**
- Make sure you added `MONGO_URL` in Render dashboard
- Verify your MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist includes Render's IPs (or use 0.0.0.0/0 for all)

**Variables not updating?**
- Render requires a redeploy after adding/changing environment variables
- Check the "Environment" tab to confirm variables are saved
- View logs to see if variables are being read correctly

### Checking Logs:

1. Go to your service in Render dashboard
2. Click "Logs" tab
3. Look for startup messages - they will show if environment variables are missing

### Frontend Environment Variables (if deploying frontend):

If you're also deploying the frontend on Render, add:

```
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

Replace `your-backend-service` with your actual Render backend service URL.

