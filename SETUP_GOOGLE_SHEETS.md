# How to Set Up Google Sheets for POS System

This guide will help you set up all the required sheets and columns in your Google Sheets.

## Step 1: Open Your Google Sheet

1. Go to https://sheets.google.com
2. Open your POS spreadsheet (ID: `1MydG38l_UK7Qwvi6lwcHyiSY4tUvrU2oGvIwrqdZETM`)

## Step 2: Set Up Products Sheet

### If the Products sheet doesn't exist:
1. Click the **+** button at the bottom to create a new sheet
2. Rename it to **"Products"** (right-click tab → Rename)

### Add/Verify Headers in Row 1:

**Required columns (in this exact order):**
```
A1: id
B1: name
C1: price
D1: buyingPrice
E1: stock
F1: unitType
G1: category
H1: description
I1: image
J1: size
K1: color
L1: createdAt
M1: updatedAt
```

**Quick Setup:**
1. Click on Row 1
2. Type each header in the cells (A1, B1, C1, etc.)
3. Or copy this and paste into Row 1:
   ```
   id	name	price	buyingPrice	stock	unitType	category	description	image	size	color	createdAt	updatedAt
   ```

## Step 3: Set Up Sales Sheet

### If the Sales sheet doesn't exist:
1. Create a new sheet
2. Rename it to **"Sales"**

### Add/Verify Headers in Row 1:

**Required columns:**
```
A1: id
B1: items
C1: subtotal
D1: tax
E1: total
F1: profit
G1: timestamp
H1: createdAt
```

**Quick Setup:**
1. Click on Row 1
2. Type each header in the cells
3. Or copy this and paste into Row 1:
   ```
   id	items	subtotal	tax	total	profit	timestamp	createdAt
   ```

**Important:** The `items` column will store JSON data (array of items). The `profit` column stores the calculated profit for each sale.

## Step 4: Set Up Expenses Sheet

### If the Expenses sheet doesn't exist:
1. Create a new sheet
2. Rename it to **"Expenses"**

### Add/Verify Headers in Row 1:

**Required columns:**
```
A1: id
B1: description
C1: category
D1: amount
E1: date
F1: paymentMethod
G1: notes
H1: createdAt
```

**Quick Setup:**
1. Click on Row 1
2. Type each header in the cells
3. Or copy this and paste into Row 1:
   ```
   id	description	category	amount	date	paymentMethod	notes	createdAt
   ```

## Step 5: Set Up Users Sheet (if not exists)

### If the Users sheet doesn't exist:
1. Create a new sheet
2. Rename it to **"Users"**

### Add/Verify Headers in Row 1:

**Required columns:**
```
A1: id
B1: email
C1: password
D1: name
E1: role
F1: createdAt
```

**Quick Setup:**
1. Click on Row 1
2. Type each header in the cells
3. Or copy this and paste into Row 1:
   ```
   id	email	password	name	role	createdAt
   ```

## Step 6: Verify All Sheets

You should now have these 4 sheets:
- ✅ **Products** - with 13 columns
- ✅ **Sales** - with 8 columns (including `profit`)
- ✅ **Expenses** - with 8 columns
- ✅ **Users** - with 6 columns

## Step 7: Format Headers (Optional but Recommended)

1. Select Row 1 in each sheet
2. Click **Format** → **Text** → **Bold** (or press Ctrl+B)
3. Click **Format** → **Freeze** → **1 row** (to keep headers visible)

## Step 8: Test the Setup

1. Go back to your POS app
2. Try adding a product - it should save successfully
3. Try adding an expense - it should save successfully
4. Make a sale - it should calculate profit automatically

## Troubleshooting

### If you get "Column not found" errors:

1. **Check column names are exact** (case-sensitive):
   - `buyingPrice` (not `buying_price` or `Buying Price`)
   - `unitType` (not `unit_type` or `Unit Type`)
   - `paymentMethod` (not `payment_method`)

2. **Check column order** - The order matters! Make sure columns are in the exact order listed above.

3. **Check for extra spaces** - Make sure there are no trailing spaces in header names.

### If existing data gets messed up:

1. **Backup first** - Make a copy of your sheet before making changes
2. **Add columns carefully** - Insert new columns rather than replacing existing ones
3. **Fill existing rows** - After adding new columns, existing rows will have empty values (this is OK)

### Quick Fix: Add Missing Columns

If you already have a Products sheet but missing some columns:

1. **Find the last column** (e.g., if you have columns A through H)
2. **Insert new columns** after the last one:
   - Right-click on column header → Insert 1 column right
   - Repeat for each missing column
3. **Add the header names** in Row 1 of the new columns
4. **For existing products**, you can leave the new columns empty or fill them in manually

## Example: Adding buyingPrice to Existing Products Sheet

If your Products sheet currently has:
```
id | name | price | stock | category | description
```

You need to add:
```
id | name | price | buyingPrice | stock | unitType | category | description | image | size | color | createdAt | updatedAt
```

**Steps:**
1. Insert a column after "price" → Name it "buyingPrice"
2. Insert a column after "buyingPrice" → Name it "stock" (move existing stock data)
3. Insert columns for: unitType, image, size, color, createdAt, updatedAt
4. Fill in default values if needed (e.g., unitType = "pcs" for existing products)

## Need Help?

If you're having trouble:
1. Check the browser console (F12) for specific error messages
2. Verify the Google Apps Script is deployed correctly
3. Make sure all sheet names match exactly: "Products", "Sales", "Expenses", "Users" (case-sensitive)

