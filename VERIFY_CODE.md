# Verify Your Google Apps Script Code

## Critical Check - Line 92-102

Open your Google Apps Script editor and verify the `validateApiKey` function looks EXACTLY like this:

```javascript
function validateApiKey(request) {
  // Google Apps Script web apps don't reliably support custom headers
  // Use query parameter instead (which is what the frontend sends)
  const apiKey = request.parameter.apiKey;
  if (!apiKey) {
    throw new Error('API key is required. Add ?apiKey=YOUR_KEY to the URL');
  }
  if (apiKey !== API_KEY) {
    throw new Error('Invalid API key');
  }
}
```

## What to Check:

1. **Line 95 MUST say**: `const apiKey = request.parameter.apiKey;`
2. **It MUST NOT say**: `const apiKey = request.headers['X-API-Key'] || request.parameter.apiKey;`
3. **There should be NO reference to `headers` anywhere in this function**

## If It's Wrong:

1. Delete ALL code in the Apps Script editor
2. Copy the ENTIRE contents of `GoogleAppsScript/Code.gs` from your local project
3. Paste it into the Apps Script editor
4. Click Save (Ctrl+S)
5. Deploy → New deployment → Web app
6. Set "Who has access: Anyone"
7. Deploy and copy the NEW URL

## Test the Deployment:

After deploying, test this URL (replace with your actual URL and API key):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?endpoint=products&apiKey=1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
```

You should see: `{"success":true,"products":[]}`

If you still see the X-API-Key error, the code in Apps Script is still wrong.

