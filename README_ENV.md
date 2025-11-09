# Environment Variables Setup

This project uses environment variables to store sensitive configuration like API keys.

## Backend Setup

1. Navigate to the `backend` directory
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and fill in your actual values:
   ```
   PORT=8000
   MONGO_URL=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Frontend Setup

1. Navigate to the `frontend` directory
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and fill in your actual values:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

## Important Notes

- **Never commit `.env` files to version control** - they are already in `.gitignore`
- The `.env.example` files are safe to commit as they don't contain real keys
- If you see errors about missing environment variables, make sure your `.env` files are in the correct directories
- Restart your servers after changing `.env` files

## Getting Your API Keys

- **Gemini API Key**: Get it from https://makersuite.google.com/app/apikey
- **MongoDB URL**: Your MongoDB connection string (local or cloud)
