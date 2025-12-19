# 🚨 URGENT: Copy & Paste Instructions

Your deployed Google Apps Script is **OUTDATED**. The error proves it.

## The Problem

Your error says: `Invalid endpoint. Use ?endpoint=products|sales|users`  
But the code says: `Invalid endpoint. Use ?endpoint=products|sales|users|expenses`

**This means the code in Google Apps Script doesn't match your local code.**

---

## Solution: Copy & Paste (2 minutes)

### Step 1: Copy FROM Your Project

1. In VS Code (or your editor), open: `GoogleAppsScript/Code.gs`
2. Press **Ctrl+A** (or Cmd+A on Mac) to select ALL
3. Press **Ctrl+C** (or Cmd+C) to copy
4. ✅ You should have ~758 lines copied

### Step 2: Paste INTO Google Apps Script

1. Open: **https://script.google.com**
2. Click your **POS project** to open it
3. You'll see code in the editor (left side)
4. Click **inside the code editor** (to focus it)
5. Press **Ctrl+A** (or Cmd+A) to select ALL existing code
6. Press **Delete** key to remove it
7. Press **Ctrl+V** (or Cmd+V) to paste your copied code
8. ✅ You should now see ~758 lines

### Step 3: Save

1. Press **Ctrl+S** (or Cmd+S) to save
2. Wait for "All changes saved" message

### Step 4: Deploy

1. Click **Deploy** button (top right)
2. Click **Manage deployments**
3. Find your deployment (the one with the URL)
4. Click the **✏️ Edit icon** (pencil)
5. Make sure "Who has access" = **"Anyone"**
6. Click **Deploy** button
7. Wait for "Deployment updated"

### Step 5: Test

1. Open `test-expenses-endpoint.html` in your browser
2. Enter your API URL and API Key
3. Click "Test GET Expenses"
4. ✅ If it says "SUCCESS! Your deployment has the expenses endpoint" - you're done!
5. ❌ If it says "OUTDATED" - you need to try again

---

## Quick Verification

After pasting, check line **743** in Google Apps Script:

**✅ CORRECT:**
```javascript
result = { success: false, error: 'Invalid endpoint. Use ?endpoint=products|sales|users|expenses' };
```

**❌ WRONG:**
```javascript
result = { success: false, error: 'Invalid endpoint. Use ?endpoint=products|sales|users' };
```

If it's wrong, you didn't copy all the code. Try again!

---

## Still Not Working?

1. **Check you copied ALL the code** - Should be ~758 lines
2. **Check you pasted it correctly** - Should replace ALL old code
3. **Check you saved** - Look for "All changes saved"
4. **Check you deployed** - Look for "Deployment updated"
5. **Hard refresh your app** - Ctrl+Shift+R (or Cmd+Shift+R)

---

## Need Help?

Share:
- Screenshot of line 743 in Google Apps Script
- The test result from `test-expenses-endpoint.html`

The code is ready - just copy and paste! 🚀

