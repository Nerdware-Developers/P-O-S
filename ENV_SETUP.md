# Environment Setup - Fix "Failed to fetch" Error

## The Problem
You're seeing "Failed to save product: Network error: Failed to fetch" because the API URL and API Key are not configured.

## Solution: Create .env File

1. **Create a file named `.env` in the project root** (same folder as `package.json`)

2. **Add the following content:**

```env
VITE_API_URL=https://script.google.com/macros/s/AKfycbw6edHFXKY9WCCugbsYXrKRFyko6c6coEcH5-krwEE4QUZaC93GvRi4CRl9aMbj801V/exec
VITE_API_KEY=1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
```

3. **Restart your dev server:**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## Verify Your Google Apps Script Deployment

1. Go to https://script.google.com
2. Open your POS System project
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon (✏️) to edit
5. **VERIFY these settings:**
   - **Execute as:** Me
   - **Who has access:** Anyone (CRITICAL for CORS!)
6. If "Who has access" is NOT "Anyone", change it and click **Deploy**
7. Copy the new URL if it changed

## Test the API

Open `test-deployment.html` in your browser and click "Test POST Create Product" to verify the API is working.

## Still Not Working?

1. **Check browser console (F12)** for detailed error messages
2. **Verify the Web App URL** matches your deployment URL
3. **Test the URL directly** in a browser:
   ```
   https://YOUR_WEB_APP_URL?endpoint=products&apiKey=YOUR_API_KEY
   ```
   Should return: `{"success":true,"products":[...]}`

4. **Check Google Apps Script execution logs:**
   - In Apps Script editor: View → Execution transcript
   - Look for any errors when making requests

