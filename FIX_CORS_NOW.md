# URGENT: Fix CORS Error - Step by Step

## The Problem
You're getting: "Response to preflight request doesn't pass access control check"

This means your Google Apps Script deployment is NOT configured for CORS.

## Solution: Create a NEW Deployment

**IMPORTANT:** Sometimes old deployments have CORS issues. Creating a fresh deployment usually fixes it.

### Step 1: Open Google Apps Script

1. Go to https://script.google.com
2. Open your "POS System API" project (or whatever you named it)

### Step 2: Verify Your Code is Saved

1. Make sure `Code.gs` has all the latest code (you accepted the changes, so it should be saved)
2. Click **File** → **Save** (Ctrl+S) to be sure

### Step 3: Create NEW Deployment

1. Click **Deploy** → **New deployment** (NOT "Manage deployments")
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in:
   - **Description:** `POS System API v3` (or increment the version number)
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone** ← **THIS IS CRITICAL!**
5. Click **Deploy**
6. **COPY THE NEW WEB APP URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step 4: Update .env File

1. Open your `.env` file
2. Replace the `VITE_API_URL` with the NEW URL from Step 3
3. Make sure there are NO query parameters in the URL (just the base URL ending in `/exec`)
4. Save the file

Example:
```env
VITE_API_URL=https://script.google.com/macros/s/AKfycbw6edHFXKY9WCCugbsYXrKRFyko6c6coEcH5-krwEE4QUZaC93GvRi4CRl9aMbj801V/exec
VITE_API_KEY=1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
```

### Step 5: Restart Dev Server

1. Stop your dev server (Ctrl+C in the terminal)
2. Run `npm run dev` again
3. Wait for it to start

### Step 6: Test

1. Open your app in the browser
2. Try to load products or add a product
3. Check the browser console (F12) - the CORS error should be gone

## Alternative: Use Test Deployment URL

If creating a new deployment doesn't work, try using the test deployment URL:

1. In Apps Script, click **Deploy** → **Test deployments**
2. Copy the **Test web app URL** (ends with `/dev` instead of `/exec`)
3. Update your `.env`:
   ```
   VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/dev
   ```
4. Restart dev server

**Note:** `/dev` URLs are for testing and may behave differently, but sometimes they handle CORS better.

## Verification Checklist

After following the steps above:

- [ ] New deployment created with "Who has access: Anyone"
- [ ] `.env` file updated with new URL (no query params)
- [ ] Dev server restarted
- [ ] Browser console shows no CORS errors
- [ ] Products can be loaded
- [ ] Products can be created

## Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Double-check deployment settings:**
   - Go to Deploy → Manage deployments
   - Click edit (pencil icon)
   - Verify "Who has access" is EXACTLY "Anyone" (not "Only myself" or anything else)

2. **Try a different browser:**
   - Sometimes browser cache causes issues
   - Try Chrome, Firefox, or Edge

3. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Hard refresh (Ctrl+Shift+R)

4. **Check the exact error:**
   - Open browser console (F12)
   - Look at the Network tab
   - Click on the failed request
   - Check the Response headers - do you see `Access-Control-Allow-Origin`?

5. **Test with test-api-direct.html:**
   - Open `test-api-direct.html` in your browser
   - Update the URL to match your new deployment
   - Click "Test GET Products"
   - If this works, the API is fine and the issue is with the app

## Why This Happens

Google Apps Script web apps automatically add CORS headers ONLY when:
- "Who has access" is set to "Anyone"
- The deployment is active and properly configured

Old deployments sometimes lose this configuration or have bugs. Creating a fresh deployment usually fixes it.

