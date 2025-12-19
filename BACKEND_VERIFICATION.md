# Backend Verification for Expenses, Reports, and Analytics

## ✅ Current Backend Status

The Google Apps Script backend **already has full support** for:
- ✅ **Expenses** - Full CRUD (Create, Read, Update, Delete)
- ✅ **Reports** - Sales data with filtering (date, month, year)
- ✅ **Analytics** - Sales, expenses, and products data

## 📋 Backend Endpoints

### Expenses API
- `GET /?endpoint=expenses` - Get all expenses (supports filters: date, month, year, category)
- `GET /?endpoint=expenses&id=EXPENSE_ID` - Get single expense
- `POST /?endpoint=expenses` - Create expense
- `PUT /?endpoint=expenses&id=EXPENSE_ID` - Update expense
- `DELETE /?endpoint=expenses&id=EXPENSE_ID` - Delete expense

### Sales/Reports API
- `GET /?endpoint=sales` - Get all sales (supports filters: date, month, year)
- `POST /?endpoint=sales` - Create sale (with profit calculation)

### Products API (for Analytics)
- `GET /?endpoint=products` - Get all products

## 🔧 What You Need to Do

### Step 1: Verify Google Sheets Structure

Make sure your Google Sheets have the correct columns:

**Products Sheet:**
```
id | name | price | buyingPrice | stock | unitType | category | description | image | size | color | createdAt | updatedAt
```

**Sales Sheet:**
```
id | items | subtotal | tax | total | profit | timestamp | createdAt
```

**Expenses Sheet:**
```
id | description | category | amount | date | paymentMethod | notes | createdAt
```

### Step 2: Redeploy Google Apps Script

**IMPORTANT:** After any changes to the backend code, you MUST redeploy:

1. Go to https://script.google.com
2. Open your POS project
3. Click **Deploy** → **Manage deployments**
4. Click the **pencil icon** (Edit) next to your deployment
5. Click **Deploy**
6. Wait a few seconds for deployment to complete

### Step 3: Test the Endpoints

You can test the endpoints using these URLs (replace with your deployment URL):

```
# Get all expenses
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?endpoint=expenses&apiKey=YOUR_API_KEY

# Get all sales
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?endpoint=sales&apiKey=YOUR_API_KEY

# Get all products
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?endpoint=products&apiKey=YOUR_API_KEY
```

## 🐛 Troubleshooting

### If expenses/reports/analytics are blank:

1. **Check Google Apps Script deployment**
   - Make sure it's deployed with "Who has access: Anyone"
   - Redeploy if you made any code changes

2. **Check browser console (F12)**
   - Look for API errors
   - Check if requests are being made
   - Verify the response format

3. **Verify API URL and Key**
   - Check your `.env` file has correct `VITE_API_URL` and `VITE_API_KEY`
   - Restart dev server after changing `.env`

4. **Check Google Sheets**
   - Make sure sheets exist (Products, Sales, Expenses)
   - Verify column headers match the expected format
   - Check that data exists in the sheets

### Common Issues:

**Issue:** "Failed to fetch" or CORS error
- **Fix:** Redeploy Google Apps Script with "Who has access: Anyone"

**Issue:** Empty data returned
- **Fix:** Check if sheets have data, verify column headers

**Issue:** "items.map is not a function"
- **Fix:** This means items are stored as JSON string. The backend should parse them automatically, but verify the Sales sheet has proper data.

## 📊 Data Format

### Sales Response Format:
```json
{
  "success": true,
  "sales": [
    {
      "id": "uuid",
      "items": [
        {
          "productId": "uuid",
          "productName": "Product Name",
          "quantity": 2,
          "price": 100,
          "buyingPrice": 50,
          "subtotal": 200,
          "profit": 100
        }
      ],
      "subtotal": 200,
      "tax": 16,
      "total": 216,
      "profit": 100,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Expenses Response Format:
```json
{
  "success": true,
  "expenses": [
    {
      "id": "uuid",
      "description": "Rent",
      "category": "Rent",
      "amount": 5000,
      "date": "2024-01-01",
      "paymentMethod": "M-Pesa",
      "notes": "Monthly rent",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Products Response Format:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 100,
      "buyingPrice": 50,
      "stock": 100,
      "unitType": "pcs",
      "category": "Category",
      "description": "Description",
      "image": "data:image/...",
      "size": "Large",
      "color": "Red",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## ✅ Verification Checklist

- [ ] Google Apps Script is deployed
- [ ] Deployment has "Who has access: Anyone"
- [ ] Products sheet has all required columns
- [ ] Sales sheet has profit column
- [ ] Expenses sheet exists with correct columns
- [ ] `.env` file has correct API URL and key
- [ ] Dev server restarted after `.env` changes
- [ ] Browser console shows no errors
- [ ] API requests are successful (check Network tab)

