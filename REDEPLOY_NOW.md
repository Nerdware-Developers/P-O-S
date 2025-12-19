# ⚠️ URGENT: Redeploy Google Apps Script

The error you're seeing (`Invalid endpoint. Use ?endpoint=products|sales|users`) means your **deployed version is outdated** and doesn't include the `expenses` endpoint.

## Quick Fix (2 minutes)

1. **Open Google Apps Script**:
   - Go to: https://script.google.com
   - Open your POS project

2. **Copy the updated code**:
   - The `GoogleAppsScript/Code.gs` file in your project has been updated
   - You need to copy this code into Google Apps Script
   - OR use the Apps Script editor to sync with your local files

3. **Deploy the updated code**:
   - Click **Deploy** → **Manage deployments**
   - Click the **Edit** icon (pencil) next to your active deployment
   - Click **Deploy** (you don't need to change anything)
   - **Important**: Make sure "Who has access" is set to **"Anyone"**

4. **Update your .env file** (if the URL changed):
   - If Google Apps Script gave you a new deployment URL, update `VITE_API_URL` in your `.env` file
   - The URL should look like: `https://script.google.com/macros/s/.../exec`

5. **Test again**:
   - Refresh your app
   - Try adding an expense again
   - Check the browser console (F12) for the new debug logs

## How to Copy Code to Google Apps Script

### Option 1: Manual Copy (Easiest)
1. Open `GoogleAppsScript/Code.gs` in your local project
2. Select all (Ctrl+A) and copy (Ctrl+C)
3. Go to https://script.google.com
4. Open your project
5. Select all code in the editor (Ctrl+A)
6. Paste (Ctrl+V) to replace it
7. Click **Save** (Ctrl+S)
8. Then deploy as described above

### Option 2: Use Apps Script CLI (Advanced)
If you have `clasp` installed:
```bash
clasp push
clasp deploy
```

## Verify Deployment

After redeploying, you should see:
- ✅ The error message changes to include `expenses`: `Use ?endpoint=products|sales|users|expenses`
- ✅ Console logs showing: `Expenses endpoint matched, method: POST`
- ✅ Expenses can be created successfully

## Still Getting Errors?

1. **Check Google Apps Script Logs**:
   - Go to https://script.google.com
   - Open your project
   - Click **Executions** (clock icon)
   - Click on the most recent execution
   - Look for error messages or the debug logs we added

2. **Check Browser Console**:
   - Open browser console (F12)
   - Look for the new debug logs:
     - `Initial endpoint extraction:`
     - `Form data parsed, endpoint is now:`
     - `Routing request:`
     - `Expenses endpoint matched, method: POST`

3. **Verify Endpoint in URL**:
   - In the browser console, check the API call log
   - It should show: `endpoint=expenses` in the URL

## What Changed

The updated code includes:
- ✅ Expenses endpoint routing
- ✅ Better endpoint extraction from form data
- ✅ Debug logging to help troubleshoot
- ✅ Proper amount parsing for expenses
- ✅ Updated error messages

**The code is ready - you just need to deploy it!**

