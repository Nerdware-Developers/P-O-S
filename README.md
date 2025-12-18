# POS System - Point of Sale Application

A complete Point-of-Sale (POS) system built with React, featuring Google Sheets as the backend database. The application is fully responsive, works as a Progressive Web App (PWA), and includes all essential POS features.

## 🚀 Features

- **Sales Screen**: Product browsing, cart management, checkout with automatic stock deduction
- **Inventory Management**: Add, edit, delete products with low-stock warnings
- **Sales Reports**: Daily/monthly sales, top-selling items, CSV export
- **User Authentication**: Simple login system
- **PWA Support**: Installable on mobile and desktop devices
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google account (for Google Sheets API)
- Google Apps Script access

## 🛠️ Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Google Sheets Backend**:
   - Follow the detailed instructions in `SETUP.md`
   - Create a Google Sheet with the required structure
   - Deploy the Google Apps Script as a web app
   - Copy the web app URL

4. **Configure API connection**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and update:
     - `VITE_API_URL`: Your Google Apps Script web app URL
     - `VITE_API_KEY`: The same API key you set in Apps Script
   - See `SETUP.md` for detailed instructions

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

## 📱 PWA Installation

### Setup PWA Icons (Required)
Before deploying, you need to add PWA icons:
1. See `PWA_ICONS.md` for detailed instructions
2. Create or download two PNG files:
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)
3. Place them in the `public/` folder

### Desktop (Chrome/Edge):
1. Open the application in your browser
2. Click the install icon in the address bar
3. Or go to Menu → Install POS System

### Mobile (iOS):
1. Open the application in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Mobile (Android):
1. Open the application in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen" or "Install App"

## 📁 Project Structure

```
pos-system/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SalesScreen.jsx
│   │   ├── InventoryManagement.jsx
│   │   ├── SalesReports.jsx
│   │   └── Login.jsx
│   ├── utils/
│   │   ├── api.js
│   │   └── auth.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── manifest.json
├── GoogleAppsScript/
│   └── Code.gs
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### API Configuration
Update the API URL and key in `src/utils/api.js` or use environment variables:
- `VITE_API_URL`: Your Google Apps Script web app URL
- `VITE_API_KEY`: Your secure API key

### Tax Rate
Default tax rate is set to 8% in `src/components/SalesScreen.jsx`. You can modify it:
```javascript
const taxRate = 0.08 // Change to your desired rate
```

## 📊 Google Sheets Structure

The system uses three sheets:

1. **Products**: id, name, sku, price, stock, category, description, createdAt, updatedAt
2. **Sales**: id, items (JSON), subtotal, tax, total, timestamp, createdAt
3. **Users**: id, email, password, name, role, createdAt

See `SETUP.md` for detailed setup instructions.

## 🚀 Deployment

### GitHub Pages
1. Build the project: `npm run build`
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Select the `dist` folder as the source

### Netlify
1. Build the project: `npm run build`
2. Drag and drop the `dist` folder to Netlify
3. Or connect your GitHub repository for automatic deployments

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

## 🔒 Security Notes

- The API key in Google Apps Script should be a strong, random string
- In production, consider implementing more robust authentication
- Never commit `.env` files with real API keys to version control
- The current user authentication is basic; enhance for production use

## 🐛 Troubleshooting

### API Connection Issues
- Verify your Google Apps Script is deployed as a web app
- Check that the API key matches in both frontend and backend
- Ensure CORS is enabled (Google Apps Script handles this automatically)

### PWA Not Installing
- Ensure the app is served over HTTPS (required for PWA)
- Check browser console for service worker errors
- Verify `manifest.json` is accessible

### Data Not Loading
- Check browser console for API errors
- Verify Google Sheet structure matches expected format
- Ensure Google Apps Script has proper permissions

## 📝 License

This project is open source and available for modification and use.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📧 Support

For issues or questions, please check the setup documentation in `SETUP.md` or review the code comments.

---

**Built with React, Vite, Tailwind CSS, and Google Apps Script**

