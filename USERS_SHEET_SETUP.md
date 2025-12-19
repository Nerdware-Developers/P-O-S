# Users Sheet Setup Guide

## ✅ Current Users Sheet Structure

The Users sheet should have these columns in **Row 1** (headers):

```
A1: id
B1: email
C1: password
D1: name
E1: role
F1: createdAt
```

## 📋 Quick Setup

1. Open your Google Sheet
2. Go to the **"Users"** sheet (or create it if it doesn't exist)
3. In **Row 1**, add these headers (one per column):
   ```
   id | email | password | name | role | createdAt
   ```

**Or copy and paste this into Row 1:**
```
id	email	password	name	role	createdAt
```

## 👤 Adding Users

After setting up the headers, add your users in Row 2 and below:

**Example user (Row 2):**
```
abc123 | admin@pos.com | admin123 | Admin User | admin | 2024-01-01T00:00:00Z
```

**Example user (Row 3):**
```
def456 | cashier@pos.com | cashier123 | Cashier Name | user | 2024-01-01T00:00:00Z
```

## 📝 Column Details

- **id**: Unique identifier (can be generated automatically or use UUID)
- **email**: User's email address (used for login)
- **password**: User's password (plain text - for simple authentication)
- **name**: User's display name (shown in sales reports)
- **role**: User role (e.g., "admin", "user", "cashier")
- **createdAt**: Timestamp when user was created (ISO format: `2024-01-01T00:00:00Z`)

## ⚠️ Important Notes

1. **No changes needed** - The Users sheet structure is already correct!
2. **Sales tracking** - When a user makes a sale, their `id` and `name` are automatically saved in the Sales sheet (in `userId` and `userName` columns)
3. **Password security** - Currently passwords are stored in plain text. For production, consider hashing passwords.

## 🔍 Verify Your Users Sheet

Make sure:
- ✅ Row 1 has the exact headers: `id`, `email`, `password`, `name`, `role`, `createdAt`
- ✅ You have at least one user row (Row 2 or below)
- ✅ Each user has all required fields filled in

## 🚀 After Setup

Once your Users sheet is set up:
1. Users can log in using their email and password
2. Their sales will be tracked automatically
3. You can filter sales by user in the Sales Reports section

## ❓ Do I Need to Add Anything?

**No!** The Users sheet structure is already correct. You just need to:
- Make sure the headers are in Row 1
- Add your users in the rows below
- That's it!

The system will automatically:
- Track which user made each sale
- Display user names in sales reports
- Allow filtering sales by user

