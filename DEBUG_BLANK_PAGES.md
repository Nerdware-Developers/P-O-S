# Debugging Blank Pages

If you're seeing completely blank pages for Reports, Expenses, or Analytics, follow these steps:

## Step 1: Check Browser Console
1. Open the browser (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Navigate to `/reports`, `/expenses`, or `/analytics`
4. Look for:
   - Red error messages
   - Messages like "SalesReports rendering" or "ExpenseManagement rendering"
   - Any JavaScript errors

## Step 2: Check Network Tab
1. In the browser DevTools, go to the **Network** tab
2. Navigate to one of the blank pages
3. Look for failed API requests (they'll be red)
4. Check if the requests are being made to the correct URL

## Step 3: Verify Google Apps Script Deployment
The most common cause is that the Google Apps Script backend hasn't been redeployed:

1. Go to https://script.google.com
2. Open your POS project
3. Click **Deploy** → **Manage deployments**
4. Click the **pencil icon** (Edit) next to your deployment
5. Click **Deploy**
6. Wait a few seconds
7. Refresh your app

## Step 4: Check Environment Variables
Make sure your `.env` file exists and has the correct values:

```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_API_KEY=your_api_key_here
```

**Important:** After changing `.env`, you MUST restart the dev server:
1. Stop the server (Ctrl+C)
2. Run `npm run dev` again

## Step 5: Test API Directly
Open `test-api-direct.html` in your browser to test if the API is working.

## What Should You See?

Even if there's an error, you should now see:
- **Page title/header** (e.g., "Sales Reports", "Expense Management")
- **Error message** (if API fails)
- **Loading spinner** (while loading)
- **Empty state** (if no data)

If you see **nothing at all** (completely blank), it means:
- The component isn't rendering at all
- There's a JavaScript error preventing React from rendering
- Check the browser console for errors

## Quick Test
Try navigating to these URLs directly:
- http://localhost:3000/reports
- http://localhost:3000/expenses  
- http://localhost:3000/analytics

You should see at least the page header, even if there's an error.

