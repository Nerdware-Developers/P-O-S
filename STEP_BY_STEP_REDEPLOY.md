# Step-by-Step: Redeploy Google Apps Script (FIX EXPENSES)

Your error shows the **old deployed version** doesn't have expenses. Follow these exact steps:

## Step 1: Open Your Code File

1. In your project, open: `GoogleAppsScript/Code.gs`
2. **Select ALL** the code (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)
4. You should have ~758 lines of code copied

## Step 2: Open Google Apps Script

1. Go to: **https://script.google.com**
2. Sign in if needed
3. Find and **click** your POS project

## Step 3: Replace the Code

1. In the Google Apps Script editor, you'll see code on the left
2. **Click inside the editor** to focus it
3. **Select ALL** existing code (Ctrl+A or Cmd+A)
4. **Delete** it (Delete key or Backspace)
5. **Paste** your copied code (Ctrl+V or Cmd+V)
6. You should now see ~758 lines of code

## Step 4: Save the Code

1. Click **File** → **Save** (or press Ctrl+S / Cmd+S)
2. Wait for "All changes saved" message

## Step 5: Deploy the Updated Code

1. Click **Deploy** (top right)
2. Click **Manage deployments**
3. You'll see your current deployment with a URL
4. Click the **Edit icon** (pencil ✏️) next to it
5. **IMPORTANT**: Make sure "Who has access" says **"Anyone"**
6. Click **Deploy** button (bottom right)
7. You might see a warning - click **Authorize access** if needed
8. Wait for "Deployment updated" message

## Step 6: Verify the Deployment URL

1. After deploying, you'll see the deployment URL
2. It should look like: `https://script.google.com/macros/s/.../exec`
3. **Copy this URL** (you might need it)

## Step 7: Update .env File (If URL Changed)

1. Open your `.env` file in the project
2. Check if `VITE_API_URL` matches the deployment URL from Step 6
3. If different, update it:
   ```
   VITE_API_URL=https://script.google.com/macros/s/YOUR_NEW_URL/exec
   ```
4. Save the file

## Step 8: Restart Your Dev Server

1. Stop your dev server (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Wait for it to start

## Step 9: Test Expenses

1. Open your app in the browser
2. Go to **Expenses** page
3. Click **+ Add Expense**
4. Fill in the form and click **Create**
5. **Check browser console** (F12) - you should see:
   - ✅ `Expenses endpoint matched, method: POST`
   - ✅ `Creating expense with data: {...}`
   - ✅ `API Success: POST expenses {success: true, ...}`

## ✅ Success Indicators

After redeploying, you should see:
- ✅ No more `Invalid endpoint. Use ?endpoint=products|sales|users` error
- ✅ The error message (if any) will include `expenses`
- ✅ Expenses can be created successfully
- ✅ Console logs show "Expenses endpoint matched"

## ❌ If Still Not Working

### Check 1: Verify Code Was Copied
- In Google Apps Script, scroll to line ~743
- It should say: `Use ?endpoint=products|sales|users|expenses`
- If it says only `products|sales|users`, the code wasn't copied correctly

### Check 2: Check Deployment URL
- In browser console, check the API call URL
- Compare it to the deployment URL in Google Apps Script
- They must match!

### Check 3: Check Google Apps Script Logs
1. Go to https://script.google.com
2. Open your project
3. Click **Executions** (clock icon ⏰ on the left)
4. Click the most recent execution
5. Look for errors or the debug logs we added

### Check 4: Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear cache and reload

## Still Stuck?

Share:
1. The error message from browser console
2. A screenshot of Google Apps Script showing line 743
3. The deployment URL from Google Apps Script

The code is ready - you just need to get it deployed! 🚀

