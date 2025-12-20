# Fix GitHub Secrets Configuration

## The Problem

You're getting this error:
```
"error": "Invalid API key. Received: https://sc..."
```

This means `VITE_API_KEY` in GitHub Secrets is set to the **API URL** instead of the **actual API key**.

## The Solution

### Step 1: Get Your API Key

Open `GoogleAppsScript/Code.gs` and look at line 17:
```javascript
const API_KEY = '1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6';
```

**Copy this entire key** - this is what you need for `VITE_API_KEY`.

### Step 2: Get Your API URL

Your API URL is the Google Apps Script web app deployment URL. It should look like:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Copy this entire URL** - this is what you need for `VITE_API_URL`.

### Step 3: Update GitHub Secrets

1. Go to your GitHub repository: `https://github.com/Nerdware-Developers/P-O-S`
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. You should see two secrets:
   - `VITE_API_URL` - Should be the Google Apps Script URL
   - `VITE_API_KEY` - Should be the secret key from Code.gs line 17

#### Update VITE_API_URL:
1. Click on `VITE_API_URL` (or click **New repository secret** if it doesn't exist)
2. **Name:** `VITE_API_URL`
3. **Secret:** Paste your Google Apps Script URL (starts with `https://script.google.com/macros/s/...`)
4. Click **Update secret**

#### Update VITE_API_KEY:
1. Click on `VITE_API_KEY` (or click **New repository secret** if it doesn't exist)
2. **Name:** `VITE_API_KEY`
3. **Secret:** Paste the key from `GoogleAppsScript/Code.gs` line 17 (the long random string, NOT the URL)
4. Click **Update secret**

### Step 4: Verify the Secrets

**VITE_API_URL** should look like:
```
https://script.google.com/macros/s/ABC123XYZ789/exec
```

**VITE_API_KEY** should look like:
```
1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
```

⚠️ **IMPORTANT:** 
- `VITE_API_URL` = The Google Apps Script URL (starts with `https://`)
- `VITE_API_KEY` = The secret key from Code.gs (random string, does NOT start with `https://`)

### Step 5: Rebuild and Deploy

After updating the secrets:

1. Go to **Actions** tab in your GitHub repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button
4. Wait for the build to complete

The new build will use the correct secrets.

## Quick Checklist

- [ ] `VITE_API_URL` in GitHub Secrets = Google Apps Script URL (starts with `https://script.google.com`)
- [ ] `VITE_API_KEY` in GitHub Secrets = Secret key from Code.gs line 17 (does NOT start with `https://`)
- [ ] Both secrets are set (not empty)
- [ ] Triggered a new build after updating secrets

## Still Having Issues?

If you're still getting the error after updating secrets:

1. **Double-check the values** - Make sure they're not swapped
2. **Check for extra spaces** - Copy/paste carefully, no leading/trailing spaces
3. **Verify in Code.gs** - Make sure the API_KEY in Code.gs matches what you put in GitHub Secrets
4. **Check the build logs** - Go to Actions → Latest workflow run → Build step to see if env vars are being used

## For Local Development

If you're testing locally, create a `.env` file in the project root:

```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_API_KEY=1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6
```

**Note:** Use the same values as in GitHub Secrets, but replace with your actual URL and key.

