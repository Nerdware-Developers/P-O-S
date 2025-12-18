# Fix: "openById" Error in Google Apps Script

## The Problem

You're seeing this error:
```
Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.
```

## The Solution

This error means the `SPREADSHEET_ID` in your Google Apps Script is still set to the placeholder value.

### Quick Fix (3 Steps)

1. **Get Your Spreadsheet ID**
   - Open your Google Sheet
   - Look at the URL in your browser
   - The URL looks like: `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`
   - Copy the part between `/d/` and `/edit` → `1a2b3c4d5e6f7g8h9i0j`
   - That's your Spreadsheet ID!

2. **Update the Code**
   - Open your Google Apps Script editor
   - Find this line (around line 16):
     ```javascript
     const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
     ```
   - Replace it with:
     ```javascript
     const SPREADSHEET_ID = '1a2b3c4d5e6f7g8h9i0j';  // Use YOUR actual ID!
     ```
   - Make sure to:
     - Keep the quotes around your ID
     - Remove the placeholder text completely
     - Use your actual Spreadsheet ID

3. **Save and Test**
   - Click the Save button (💾) in Apps Script
   - Run a test: Click "Run" → Select `doGet` → Click Run
   - The error should be gone!

## Example

**Before (WRONG - causes error):**
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

**After (CORRECT):**
```javascript
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
```

## Also Update API_KEY

While you're at it, also update the API_KEY on line 17:

```javascript
// Before (WRONG):
const API_KEY = 'YOUR_SECURE_API_KEY_HERE';

// After (CORRECT - use a random string):
const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
```

Generate a random key using:
- Online: https://www.random.org/strings/
- Terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Still Having Issues?

1. **Check the ID is correct:**
   - Open your Google Sheet
   - Copy the ID from the URL again
   - Make sure there are no extra spaces

2. **Check permissions:**
   - Run the script manually: Run → doGet
   - Authorize if prompted
   - Make sure you have edit access to the spreadsheet

3. **Verify the spreadsheet exists:**
   - Open the spreadsheet in your browser
   - Make sure it's not deleted or moved to trash

## Need More Help?

See `SETUP.md` for complete setup instructions.

