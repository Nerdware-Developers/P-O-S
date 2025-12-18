# Debug API Key Issue

## The Error
You're getting: `"API key is required. Add ?apiKey=YOUR_KEY to the URL or include _apiKey in JSON body"`

This means the request is reaching Google Apps Script, but the API key isn't being found.

## Step 1: Check What's Being Sent

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Go to the **Network** tab
4. Try to add a product (or load products)
5. Find the request to `script.google.com`
6. Click on it to see details

**Check:**
- **Request URL:** Should include `?endpoint=products&apiKey=...`
- **Request Method:** Should be GET or POST
- **Request Headers:** Check if Content-Type is set
- **Request Payload (for POST):** Should include `_apiKey` in the JSON body

## Step 2: Check Google Apps Script Logs

1. Go to https://script.google.com
2. Open your POS System project
3. Go to **View** → **Execution transcript**
4. Try to add/load a product in your app
5. Check the logs - you should see:
   ```
   API Key validation: {
     found: true/false,
     source: 'query parameter' or 'JSON body',
     ...
   }
   ```

This will tell you if the API key is being received and from where.

## Step 3: Verify API Key Matches

1. Check `GoogleAppsScript/Code.gs` line 17:
   ```javascript
   const API_KEY = '1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6';
   ```

2. Check your `.env` file:
   ```
   VITE_API_KEY=1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
   ```

3. They must match **exactly** (no extra spaces, same value)

## Step 4: Test with test-api-direct.html

1. Open `test-api-direct.html` in your browser
2. Make sure the API URL and API Key are correct
3. Click **"Test GET Products"**
4. Check the response

If this works but your app doesn't, the issue is with how the app is sending the request.

## Step 5: Check Browser Console

Look for the debug messages:
- `🔍 API Configuration Check:` - Shows if env vars are loaded
- `🚀 API Call:` - Shows the full URL being called

The URL should include `apiKey=...` in the query string.

## Common Issues

### Issue: API key in URL but still getting error
**Possible causes:**
- URL encoding issue (spaces, special characters)
- API key has extra whitespace
- Query parameters not being parsed correctly

**Solution:** Check the Network tab to see the exact URL being sent.

### Issue: API key in body but not found
**Possible causes:**
- Content-Type header not set to `application/json`
- Body not being parsed as JSON
- API key field name mismatch (`_apiKey` vs `apiKey`)

**Solution:** Check Request Payload in Network tab to see the exact body.

### Issue: Works in test file but not in app
**Possible causes:**
- Environment variables not loaded
- Different URL being used
- Caching issue

**Solution:** 
1. Restart dev server
2. Hard refresh browser (Ctrl+Shift+R)
3. Check browser console for API Configuration Check

## Next Steps

After checking the above, the Google Apps Script logs will show exactly what's being received. Share the log output if you need more help!

