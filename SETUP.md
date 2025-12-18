# POS System - Complete Setup Guide

This guide will walk you through setting up the Google Sheets backend and connecting it to the POS frontend.

## 📋 Table of Contents

1. [Google Sheets Setup](#google-sheets-setup)
2. [Google Apps Script Setup](#google-apps-script-setup)
3. [Deploying the API](#deploying-the-api)
4. [Frontend Configuration](#frontend-configuration)
5. [Testing the Connection](#testing-the-connection)

---

## 📊 Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "POS System Database" (or any name you prefer)
4. **Copy the Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - The `SPREADSHEET_ID` is the long string between `/d/` and `/edit`

### Step 2: Create the Required Sheets

Create three separate sheets (tabs) in your spreadsheet:

#### Sheet 1: "Products"
Create this sheet with the following columns (Row 1 = Headers):

| id | name | sku | price | stock | category | description | createdAt | updatedAt |
|----|------|-----|-------|-------|----------|-------------|------------|-----------|

**Example data (Row 2):**
```
abc123 | Laptop | LAP-001 | 999.99 | 10 | Electronics | High-performance laptop | 2024-01-01T00:00:00Z | 2024-01-01T00:00:00Z
```

#### Sheet 2: "Sales"
Create this sheet with the following columns:

| id | items | subtotal | tax | total | timestamp | createdAt |
|----|-------|----------|-----|-------|-----------|-----------|

**Note:** The `items` column will store JSON data as text.

#### Sheet 3: "Users"
Create this sheet with the following columns:

| id | email | password | name | role | createdAt |
|----|-------|----------|------|------|-----------|

**Example data (Row 2) - Create at least one user:**
```
user123 | admin@pos.com | admin123 | Admin User | admin | 2024-01-01T00:00:00Z
```

**⚠️ Important:** 
- Keep the header row (Row 1) exactly as shown
- The Apps Script will automatically create these sheets if they don't exist, but it's better to create them manually

---

## 🔧 Google Apps Script Setup

### Step 1: Create a New Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Name it "POS System API"

### Step 2: Add the Backend Code

1. Delete the default `myFunction` code
2. Open the file `GoogleAppsScript/Code.gs` from this project
3. Copy the entire contents
4. Paste it into your Apps Script editor

### Step 3: Configure the Script

⚠️ **CRITICAL: You MUST update these values or the script will fail!**

In the Apps Script editor, find these lines near the top:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const API_KEY = 'YOUR_SECURE_API_KEY_HERE';
```

**Update them:**

1. **SPREADSHEET_ID**: 
   - ⚠️ **REQUIRED** - Replace `'YOUR_SPREADSHEET_ID_HERE'` with the Spreadsheet ID you copied earlier
   - The ID is the long string in your Google Sheet URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Example: `const SPREADSHEET_ID = '1a2b3c4d5e6f7g8h9i0j';`
   - **If you see "openById" errors, this is not set correctly!**

2. **API_KEY**:
   - ⚠️ **REQUIRED** - Replace `'YOUR_SECURE_API_KEY_HERE'` with a secure random string
   - Generate a secure random string (at least 32 characters)
   - You can use an online generator or run this in a terminal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Example: `const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';`
   - **Save this key securely** - you'll need it for the frontend

**After updating, click the Save button (💾) in the Apps Script editor!**

### Step 4: Authorize the Script

1. Click the "Run" button (▶) in the toolbar
2. You'll be prompted to authorize the script
3. Click "Review Permissions"
4. Choose your Google account
5. Click "Advanced" → "Go to POS System API (unsafe)"
6. Click "Allow"
7. The script will run (it may show an error, which is normal for the first run)

---

## 🚀 Deploying the API

### Step 1: Deploy as Web App

1. In the Apps Script editor, click "Deploy" → "New deployment"
2. Click the gear icon (⚙️) next to "Select type"
3. Choose "Web app"
4. Configure the deployment:
   - **Description**: "POS System API v1"
   - **Execute as**: "Me" (your account)
   - **Who has access**: "Anyone" (this allows your frontend to call it)
5. Click "Deploy"
6. **Copy the Web App URL** - you'll need this for the frontend
   - It will look like: `https://script.google.com/macros/s/AKfycby.../exec`

### Step 2: Test the API

You can test the API using a browser or curl:

**Test Products Endpoint:**
```
https://YOUR_WEB_APP_URL?path=products&apiKey=YOUR_API_KEY
```

**Expected Response:**
```json
{
  "success": true,
  "products": []
}
```

If you see this, your API is working! ✅

---

## 💻 Frontend Configuration

### Step 1: Create Environment File

1. In the project root, create a file named `.env`
2. Add the following:

```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_API_KEY=your_secure_api_key_here
```

**Replace:**
- `YOUR_SCRIPT_ID` with your actual Web App URL (the full URL from deployment)
- `your_secure_api_key_here` with the same API_KEY you set in Apps Script

**Example:**
```env
VITE_API_URL=https://script.google.com/macros/s/AKfycby123456789/exec
VITE_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Step 2: Update API Configuration (Alternative)

If you prefer not to use environment variables, edit `src/utils/api.js`:

```javascript
const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
const API_KEY = 'your_secure_api_key_here'
```

### Step 3: Install and Run

```bash
npm install
npm run dev
```

The app should now connect to your Google Sheets backend!

---

## ✅ Testing the Connection

### Test 1: Login
1. Open the app in your browser
2. Try logging in with the user you created in the Users sheet
3. If successful, you'll see the main dashboard

### Test 2: Add a Product
1. Go to Inventory Management
2. Click "Add Product"
3. Fill in the form and submit
4. Check your Google Sheet - the product should appear!

### Test 3: Make a Sale
1. Go to Sales screen
2. Click on a product to add to cart
3. Complete checkout
4. Check the Sales sheet - a new sale record should appear
5. Check the Products sheet - stock should be reduced

---

## 🔍 Troubleshooting

### Issue: "openById" error or "Unexpected error while getting the method or property openById"

**Solution:**
- ⚠️ **Most Common Issue**: The `SPREADSHEET_ID` is still set to `'YOUR_SPREADSHEET_ID_HERE'`
- Go to your Apps Script editor and update line 16:
  ```javascript
  const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID_HERE';
  ```
- Make sure you:
  1. Copied the correct ID from your Google Sheet URL
  2. Removed the quotes around the placeholder text and added your actual ID
  3. Saved the file after making changes
  4. The spreadsheet exists and you have access to it
- If the error persists, try:
  1. Re-authorize the script (Run → Run function → doGet)
  2. Check that the spreadsheet is not deleted or moved
  3. Verify the ID is correct by opening the spreadsheet and checking the URL

### Issue: "Invalid API key" error

**Solution:**
- Verify the API_KEY in Apps Script matches the one in `.env` or `api.js`
- Make sure there are no extra spaces or quotes
- Both must be updated from the placeholder values

### Issue: "Failed to fetch" or CORS error

**Solution:**
- Ensure the Apps Script is deployed with "Who has access: Anyone"
- Try redeploying the web app
- Check that the Web App URL is correct

### Issue: Data not appearing

**Solution:**
- Verify the Spreadsheet ID is correct
- Check that sheet names match exactly: "Products", "Sales", "Users"
- Ensure the header row (Row 1) has the correct column names
- Check Apps Script execution logs: View → Execution transcript

### Issue: "Script function not found"

**Solution:**
- Make sure you copied the entire `Code.gs` file
- Verify the function names match (doGet, doPost, etc.)
- Try saving and redeploying

### Issue: Permission denied

**Solution:**
- Re-authorize the script: Run → Run function → doGet
- Check that the script has access to the Google Sheet
- Verify the Spreadsheet ID is correct

---

## 🔒 Security Best Practices

1. **API Key Security:**
   - Use a strong, random API key (32+ characters)
   - Never commit `.env` files to version control
   - Regenerate the key if it's compromised

2. **Google Sheet Permissions:**
   - Consider restricting sheet access to specific users
   - Use Google Workspace for better access control

3. **Production Considerations:**
   - Implement rate limiting in Apps Script
   - Add input validation
   - Consider using OAuth2 for better authentication
   - Use environment-specific API keys

---

## 📝 API Endpoints Reference

### Products
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `POST /products` - Create product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Sales
- `GET /sales` - Get all sales (supports ?date=YYYY-MM-DD, ?month=N&year=YYYY)
- `GET /sales/{id}` - Get sale by ID
- `POST /sales` - Create sale

### Users
- `POST /users/login` - Login user
- `POST /users` - Create user
- `GET /users` - Get all users

**All requests require:**
- Header: `X-API-Key: YOUR_API_KEY`
- Or query parameter: `?apiKey=YOUR_API_KEY`

---

## 🎉 You're All Set!

Your POS system should now be fully functional with Google Sheets as the backend. If you encounter any issues, refer to the troubleshooting section or check the browser console for detailed error messages.

For additional help, review the code comments in `GoogleAppsScript/Code.gs` and `src/utils/api.js`.

