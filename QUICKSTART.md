# Quick Start Guide

Get your POS system up and running in 5 steps!

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Google Sheets Backend
1. Create a Google Sheet (see `SETUP.md` for structure)
2. Copy the Spreadsheet ID from the URL
3. Go to [Google Apps Script](https://script.google.com)
4. Create new project and paste code from `GoogleAppsScript/Code.gs`
5. Update `SPREADSHEET_ID` and `API_KEY` in the script
6. Deploy as Web App (Deploy → New deployment → Web app)
7. Copy the Web App URL

### 3. Configure Frontend
Create `.env` file in project root:
```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_API_KEY=your_api_key_here
```

### 4. Add PWA Icons (Optional but Recommended)
- Create `public/pwa-192x192.png` (192x192)
- Create `public/pwa-512x512.png` (512x512)
- See `PWA_ICONS.md` for details

### 5. Run the App
```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## 🎯 First Steps After Setup

1. **Create a User**: Add a user in the Google Sheet "Users" tab
2. **Add Products**: Go to Inventory Management and add products
3. **Make a Sale**: Go to Sales screen and test checkout
4. **View Reports**: Check Sales Reports to see your data

## 📚 Need More Help?

- **Detailed Setup**: See `SETUP.md`
- **PWA Icons**: See `PWA_ICONS.md`
- **Full Documentation**: See `README.md`

## 🐛 Troubleshooting

**API not connecting?**
- Check that `.env` file exists and has correct values
- Verify Google Apps Script is deployed as Web App
- Ensure API_KEY matches in both places

**Can't login?**
- Add a user in the Users sheet first
- Check email/password match exactly

**Icons not showing?**
- PWA will work without icons, but install prompt may not show icons
- See `PWA_ICONS.md` for icon setup

---

**That's it! You're ready to use your POS system.** 🎉

