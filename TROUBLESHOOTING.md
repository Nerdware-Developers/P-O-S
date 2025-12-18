# Troubleshooting "Failed to fetch" Error

## Step 1: Check Browser Console

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for messages starting with:
   - `🔍 API Configuration Check:` - Shows if environment variables are loaded
   - `🚀 API Call:` - Shows the actual request being made
   - `❌ Network/Fetch Error:` - Shows the exact error

## Step 2: Verify Environment Variables Are Loaded

In the browser console, you should see:
```
🔍 API Configuration Check: {
  hasUrl: true,
  hasKey: true,
  urlPreview: "https://script.google.com/macros/s/AKfycb...",
  ...
}
```

**If `hasUrl: false` or `hasKey: false`:**
- The `.env` file is not being loaded
- **Solution:** Restart your dev server (stop with Ctrl+C, then `npm run dev`)

## Step 3: Test API Directly

1. Open `test-api-direct.html` in your browser
2. Click **"Test POST (Exact Format from App)"**
3. Check the response

**If it works here but not in the app:**
- The API is working, but there's an issue with how the app is calling it
- Check the browser console for differences

**If it doesn't work here either:**
- The issue is with the Google Apps Script deployment
- Continue to Step 4

## Step 4: Verify Google Apps Script Deployment

1. Go to https://script.google.com
2. Open your POS System project
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon (✏️) to edit
5. **CRITICAL:** Verify these settings:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← This MUST be "Anyone" for CORS to work!
6. If it's not "Anyone", change it and click **Deploy**
7. Copy the new URL if it changed
8. Update your `.env` file with the new URL
9. Restart your dev server

## Step 5: Check Google Apps Script Execution Logs

1. In Apps Script editor, go to **View** → **Execution transcript**
2. Try creating a product in your app
3. Check if there are any errors in the execution transcript

**Common errors:**
- "API key is required" → Check that API_KEY in Code.gs matches VITE_API_KEY in .env
- "Cannot access spreadsheet" → Check SPREADSHEET_ID in Code.gs
- "Invalid endpoint" → Check the endpoint parameter is being sent correctly

## Step 6: Verify API Key Matches

1. Check `GoogleAppsScript/Code.gs` line 17: `const API_KEY = '...'`
2. Check `.env` file: `VITE_API_KEY=...`
3. They must match exactly (including no extra spaces)

## Step 7: Test with curl (Optional)

If you have curl installed, test the API directly:

```bash
curl "https://YOUR_WEB_APP_URL?endpoint=products&apiKey=YOUR_API_KEY"
```

Should return: `{"success":true,"products":[...]}`

## Common Issues

### Issue: "Failed to fetch" with no other details
**Cause:** CORS is not enabled
**Solution:** Set "Who has access: Anyone" in Google Apps Script deployment

### Issue: Environment variables not loading
**Cause:** Dev server wasn't restarted after creating/editing .env
**Solution:** Stop server (Ctrl+C) and run `npm run dev` again

### Issue: API works in test file but not in app
**Cause:** Environment variables not loaded in app
**Solution:** Check browser console for API Configuration Check message

### Issue: "Invalid API key" error
**Cause:** API_KEY in Code.gs doesn't match VITE_API_KEY in .env
**Solution:** Make sure they match exactly

## Still Not Working?

1. Check the browser console (F12) for the exact error message
2. Check Google Apps Script execution transcript for server-side errors
3. Verify the Web App URL is correct (test it directly in browser)
4. Make sure you're using the latest deployment URL (not an old one)

