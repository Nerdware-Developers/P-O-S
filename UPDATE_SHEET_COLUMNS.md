# How to Add New Columns to Google Sheets

You need to add the new fields (buyingPrice, unitType, image, size, color) to your existing Products sheet.

## Method 1: Manual Update (Recommended)

1. **Open your Google Sheet**
   - Go to https://sheets.google.com
   - Open your POS spreadsheet

2. **Go to the Products sheet**
   - Click on the "Products" tab at the bottom

3. **Add the new columns**
   - The current headers should be in Row 1
   - Find the last column (probably after "description" or "category")
   - Insert new columns by right-clicking on a column header → Insert 1 column left/right

4. **Add these headers in Row 1** (in this order, after existing columns):
   ```
   buyingPrice
   unitType
   image
   size
   color
   ```

5. **Your complete header row should look like this:**
   ```
   id | name | price | buyingPrice | stock | unitType | category | description | image | size | color | createdAt | updatedAt
   ```

6. **Fill existing rows** (optional):
   - For existing products, you can leave the new columns empty or fill them in
   - The app will work fine with empty values

## Method 2: Delete and Recreate (If you have no important data)

If you don't have important product data yet:

1. **Delete the Products sheet**
   - Right-click on the "Products" tab → Delete

2. **The script will auto-create it** with the correct headers when you:
   - Add a new product through the app
   - Or run the script

## Method 3: Use a Script to Add Columns

1. **Open Google Apps Script**
   - In your Google Sheet, go to Extensions → Apps Script

2. **Run this function** (create a new function temporarily):
   ```javascript
   function addNewColumns() {
     const ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID');
     const sheet = ss.getSheetByName('Products');
     
     if (!sheet) {
       Logger.log('Products sheet not found');
       return;
     }
     
     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     
     // Check which columns are missing
     const requiredHeaders = ['buyingPrice', 'unitType', 'image', 'size', 'color'];
     const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
     
     if (missingHeaders.length === 0) {
       Logger.log('All columns already exist');
       return;
     }
     
     // Add missing columns at the end
     const lastCol = sheet.getLastColumn();
     missingHeaders.forEach((header, index) => {
       sheet.getRange(1, lastCol + 1 + index).setValue(header);
     });
     
     Logger.log('Added columns: ' + missingHeaders.join(', '));
   }
   ```

3. **Replace YOUR_SPREADSHEET_ID** with your actual spreadsheet ID

4. **Run the function** by clicking the play button

5. **Check your sheet** - the new columns should be added

## Verify It Worked

1. Go back to your Google Sheet
2. Check Row 1 of the Products sheet
3. You should see: `buyingPrice`, `unitType`, `image`, `size`, `color` columns
4. Try adding a product in your app - it should save all the new fields

## Important Notes

- **Existing products**: If you have existing products, the new columns will be empty for them. You can manually fill them in or leave them empty.
- **Data types**:
  - `buyingPrice`: Number (e.g., 50.00)
  - `unitType`: Text (e.g., "liters", "kgs", "pieces")
  - `image`: Text (Base64 data URL or URL)
  - `size`: Text (e.g., "Small", "Large", "500ml")
  - `color`: Text (e.g., "Red", "Blue", "Green")
- **After updating**: Make sure to redeploy your Google Apps Script if needed

