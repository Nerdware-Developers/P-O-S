# CRITICAL: Fix the X-API-Key Error

## The Problem
You're getting: `"Cannot read properties of undefined (reading 'X-API-Key')"`

This means your deployed Google Apps Script **STILL HAS THE OLD CODE** that tries to access headers.

## The Solution - Step by Step

### Step 1: Open Your Local Code File
1. Open `GoogleAppsScript/Code.gs` in your project
2. Select ALL (Ctrl+A)
3. Copy (Ctrl+C)

### Step 2: Open Google Apps Script
1. Go to https://script.google.com
2. Open your "POS System API" project
3. **DELETE ALL CODE** in the editor (select all, delete)

### Step 3: Paste the Correct Code
1. Paste the code you copied from Step 1
2. **VERIFY** line 95 says: `const apiKey = request.parameter.apiKey;`
3. **VERIFY** it does NOT say: `const apiKey = request.headers['X-API-Key']`
4. Save (Ctrl+S)

### Step 4: Create NEW Deployment
1. Click **Deploy** → **New deployment** (NOT "Manage deployments")
2. Click the gear icon → Select **Web app**
3. Set:
   - Description: "POS System API v2"
   - Execute as: **Me**
   - Who has access: **Anyone** (CRITICAL!)
4. Click **Deploy**
5. **COPY THE NEW URL** (it will be different from the old one)

### Step 5: Update .env File
1. Open your `.env` file
2. Replace `VITE_API_URL` with the NEW URL from Step 4
3. Save

### Step 6: Restart Dev Server
1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again

### Step 7: Test
Try creating a product again. It should work now.

## Verification Checklist

Before deploying, verify in Apps Script editor:
- [ ] Line 95: `const apiKey = request.parameter.apiKey;`
- [ ] NO mention of `headers['X-API-Key']` anywhere
- [ ] NO mention of `X-API-Key` anywhere in the file
- [ ] Code is saved (check for unsaved changes indicator)

## If It Still Doesn't Work

1. Check the browser console (F12) for the exact error
2. Verify you're using the NEW deployment URL (not the old one)
3. Make sure "Who has access" is set to "Anyone"
4. Try testing the URL directly in browser with the test file

