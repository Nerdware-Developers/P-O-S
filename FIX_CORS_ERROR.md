# Fix CORS "Failed to fetch" Error

## The Problem
You're seeing: "Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present"

This means the OPTIONS preflight request is failing.

## Solution 1: Verify Deployment Settings (MOST IMPORTANT)

1. Go to https://script.google.com
2. Open your POS System project
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon (✏️) to edit your deployment
5. **CRITICAL:** Verify these exact settings:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← MUST be "Anyone" (not "Only myself")
6. If it's NOT "Anyone":
   - Change it to "Anyone"
   - Click **Deploy**
   - **Copy the NEW URL** (it might change)
   - Update your `.env` file with the new URL
   - Restart your dev server

## Solution 2: Create a NEW Deployment

Sometimes old deployments have CORS issues. Create a fresh one:

1. In Apps Script, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) → Select **Web app**
3. Set:
   - **Description:** "POS System API v2" (or increment version)
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← CRITICAL!
4. Click **Deploy**
5. **Copy the NEW Web App URL**
6. Update your `.env` file:
   ```
   VITE_API_URL=https://script.google.com/macros/s/NEW_URL_HERE/exec
   ```
7. Restart your dev server (`npm run dev`)

## Solution 3: Test the Deployment

After updating, test if CORS is working:

1. Open `test-api-direct.html` in your browser
2. Make sure the URL and API key are correct
3. Click **"Test GET Products"**
4. If it works, CORS is fixed!

## Solution 4: Use the /dev Endpoint (Alternative)

Google Apps Script has a `/dev` endpoint that sometimes handles CORS better:

1. In Apps Script, click **Deploy** → **Test deployments**
2. Copy the **Test web app URL** (ends with `/dev`)
3. Update your `.env`:
   ```
   VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/dev
   ```
4. Restart dev server

**Note:** `/dev` URLs are for testing and may have different behavior.

## Why This Happens

Google Apps Script web apps automatically add CORS headers when "Who has access: Anyone" is set. However:
- Old deployments might not have this enabled
- The setting might have been changed
- Sometimes you need a fresh deployment

## Verification Checklist

- [ ] Deployment has "Who has access: Anyone"
- [ ] `.env` file has the correct URL (matches deployment URL)
- [ ] Dev server was restarted after updating `.env`
- [ ] Test file (`test-api-direct.html`) works
- [ ] Browser console shows the correct API URL

## Still Not Working?

1. **Check Google Apps Script execution logs:**
   - View → Execution transcript
   - See if OPTIONS requests are being received

2. **Try a different browser** (sometimes browser cache causes issues)

3. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

4. **Check if the URL is accessible:**
   - Open the URL directly in browser: `https://YOUR_URL?endpoint=products&apiKey=YOUR_KEY`
   - Should return JSON (even if CORS fails, you should see the response)

5. **Verify the API key matches:**
   - Code.gs line 17: `const API_KEY = '...'`
   - .env file: `VITE_API_KEY=...`
   - They must match exactly

