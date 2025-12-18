# How to Generate an API Key

The API key is **not** something you get from Google - it's a **custom secret key** that you create yourself. You'll use the same key in both your Google Apps Script and your frontend `.env` file.

## Quick Method: Online Generator

1. Go to: https://www.random.org/strings/
2. Set these options:
   - **String type**: Alphanumeric
   - **String length**: 32 (or longer for more security)
   - **How many**: 1
3. Click "Generate Strings"
4. Copy the generated string
5. Use this as your API key

## Method 2: Using Node.js (if you have it installed)

Open a terminal/command prompt and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a random 64-character hexadecimal string.

## Method 3: Using PowerShell (Windows)

Open PowerShell and run:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Method 4: Manual (Simple but less secure)

You can also just make up a long random string yourself, like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**Note**: For better security, use at least 32 characters with a mix of letters and numbers.

## Where to Use the API Key

### 1. In Google Apps Script

Open your Apps Script editor and update line 17:

```javascript
const API_KEY = 'paste-your-generated-key-here';
```

**Example:**
```javascript
const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
```

### 2. In Your Frontend (.env file)

Create or edit the `.env` file in your project root:

```env
VITE_API_KEY=paste-the-same-key-here
```

**Example:**
```env
VITE_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

⚠️ **IMPORTANT**: 
- Use the **SAME** key in both places
- Keep it secret - don't share it publicly
- Don't commit it to version control (it's in `.gitignore`)

## Quick Example

Let's say you generate: `mySecretKey12345678901234567890`

**In Google Apps Script (Code.gs):**
```javascript
const API_KEY = 'mySecretKey12345678901234567890';
```

**In Frontend (.env):**
```env
VITE_API_KEY=mySecretKey12345678901234567890
```

That's it! The same key in both places allows your frontend to authenticate with your backend.

## Security Tips

1. **Use a long key**: At least 32 characters
2. **Mix characters**: Use letters (both cases) and numbers
3. **Keep it secret**: Never share it or commit it to public repositories
4. **Regenerate if compromised**: If you think someone has your key, generate a new one and update both places

## Troubleshooting

**"Invalid API key" error?**
- Make sure the key is **exactly the same** in both Apps Script and `.env`
- Check for extra spaces or quotes
- Make sure you saved both files after updating

