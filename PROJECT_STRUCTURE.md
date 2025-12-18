# Project Structure

Complete overview of the POS System project files and their purposes.

```
point-of-sale/
│
├── 📁 src/                          # React application source code
│   ├── 📁 components/               # React components
│   │   ├── SalesScreen.jsx         # Main sales interface with cart
│   │   ├── InventoryManagement.jsx # Product CRUD operations
│   │   ├── SalesReports.jsx        # Sales analytics and reports
│   │   ├── Login.jsx               # User authentication
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   └── Sidebar.jsx             # Side navigation menu
│   │
│   ├── 📁 utils/                    # Utility functions
│   │   ├── api.js                  # Google Sheets API integration
│   │   └── auth.js                 # Authentication helpers
│   │
│   ├── App.jsx                      # Main app component with routing
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles (Tailwind)
│
├── 📁 public/                        # Static assets
│   └── manifest.json                # PWA manifest configuration
│   │
│   └── 📝 Note: Add these files for PWA icons:
│       ├── pwa-192x192.png         # Small icon (192x192)
│       └── pwa-512x512.png         # Large icon (512x512)
│
├── 📁 GoogleAppsScript/             # Backend API code
│   └── Code.gs                     # Google Apps Script REST API
│
├── 📄 Configuration Files
│   ├── package.json                # Node.js dependencies
│   ├── vite.config.js              # Vite build configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS configuration
│   ├── index.html                  # HTML entry point
│   └── .gitignore                  # Git ignore rules
│
├── 📚 Documentation
│   ├── README.md                   # Main documentation
│   ├── SETUP.md                    # Detailed setup guide
│   ├── QUICKSTART.md               # Quick start guide
│   ├── PWA_ICONS.md                # PWA icon setup guide
│   └── PROJECT_STRUCTURE.md         # This file
│
└── 📝 Environment (create this)
    └── .env                        # API configuration (not in repo)
```

## File Descriptions

### Frontend Components

- **SalesScreen.jsx**: 
  - Product browsing with search
  - Shopping cart management
  - Checkout functionality
  - Automatic stock deduction

- **InventoryManagement.jsx**:
  - Add/edit/delete products
  - Stock management
  - Low-stock warnings
  - Product table view

- **SalesReports.jsx**:
  - Daily/monthly sales totals
  - Top-selling items
  - Sales history table
  - CSV export functionality

- **Login.jsx**:
  - User authentication
  - Simple email/password login
  - Session management

- **Navbar.jsx**:
  - Top navigation
  - Dark mode toggle
  - Logout button
  - Mobile menu button

- **Sidebar.jsx**:
  - Navigation menu
  - Responsive mobile sidebar
  - Active route highlighting

### Backend

- **GoogleAppsScript/Code.gs**:
  - REST API endpoints
  - Google Sheets integration
  - Authentication (API key)
  - CRUD operations for products, sales, users

### Configuration

- **vite.config.js**: 
  - Vite build tool config
  - PWA plugin configuration
  - Development server settings

- **tailwind.config.js**:
  - Tailwind CSS customization
  - Dark mode support

- **manifest.json**:
  - PWA configuration
  - App metadata
  - Icon references

## Data Flow

```
User Action → React Component → API Call (api.js) 
  → Google Apps Script (Code.gs) → Google Sheets
  → Response → Component Update → UI Refresh
```

## Key Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Google Apps Script (JavaScript)
- **Database**: Google Sheets
- **PWA**: Vite PWA Plugin, Service Worker
- **Routing**: React Router DOM

## Environment Variables

Required in `.env` file:
- `VITE_API_URL`: Google Apps Script web app URL
- `VITE_API_KEY`: API authentication key

## Build Output

When you run `npm run build`, Vite creates:
- `dist/` folder with optimized production files
- Service worker for PWA functionality
- Optimized assets (JS, CSS, images)

This `dist/` folder is what you deploy to hosting services.

