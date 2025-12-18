# Point of Sale (POS) System

A modern, full-featured Point of Sale system built with React and Vite, using Google Sheets as the backend via Google Apps Script.

## 🌐 Live Demo

Visit the live application: [https://nerdware-developers.github.io/P-O-S/](https://nerdware-developers.github.io/P-O-S/)

## ✨ Features

- **Sales Management**: Process sales, manage cart, and track transactions
- **Inventory Management**: Add, edit, and manage products with images
- **Product Display**: E-commerce style product catalog with click-to-sell
- **Expense Tracking**: Track business expenses by category
- **Sales Reports**: View daily and monthly sales reports with profit calculations
- **Advanced Analytics**: Comprehensive analytics with charts and visualizations
- **Product Variants**: Support for size and color variants
- **Dark Mode**: Built-in dark mode support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Account (for Google Sheets backend)
- Google Apps Script deployment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Nerdware-Developers/P-O-S.git
cd P-O-S
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Google Apps Script Web App URL and API Key:
```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## 📋 Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet
2. Name it "POS System Database" (or any name you prefer)
3. The Google Apps Script will automatically create the necessary sheets:
   - Products
   - Sales
   - Users
   - Expenses
   - Product Variants

### 2. Google Apps Script Setup

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy the code from `GoogleAppsScript/Code.gs`
4. Paste it into the Apps Script editor
5. Set your `API_KEY` constant in the script
6. Click **Deploy** → **New deployment**
7. Select type: **Web app**
8. Set "Who has access" to **Anyone**
9. Click **Deploy**
10. Copy the Web App URL and use it as `VITE_API_URL` in your `.env` file

### 3. Environment Configuration

Create a `.env` file:
```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_API_KEY=your_secret_api_key
```

**Important**: Never commit your `.env` file to Git!

## 🏗️ Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📦 Deployment

### GitHub Pages (Automatic)

This repository is configured for automatic deployment to GitHub Pages:

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at: `https://nerdware-developers.github.io/P-O-S/`

### Manual Deployment

1. Build the project: `npm run build`
2. Copy the contents of the `dist/` folder to your hosting provider

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Backend**: Google Apps Script + Google Sheets
- **PWA**: Vite PWA Plugin

## 📁 Project Structure

```
P-O-S/
├── src/
│   ├── components/      # React components
│   ├── utils/          # Utility functions (API, auth)
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── GoogleAppsScript/
│   └── Code.gs         # Backend API code
├── public/             # Static assets
└── .github/
    └── workflows/      # GitHub Actions workflows
```

## 🔐 Security Notes

- API keys are stored in environment variables (`.env`)
- Google Apps Script deployment should use "Anyone" access for CORS
- Never expose your API key in client-side code
- Use HTTPS in production

## 📝 Documentation

- [Environment Setup](ENV_SETUP.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Quick Start Guide](QUICKSTART.md)
- [Project Structure](PROJECT_STRUCTURE.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the [Documentation](README.md)
3. Open an issue on GitHub

---

Built with ❤️ by Nerdware Developers
