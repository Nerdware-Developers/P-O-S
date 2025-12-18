# PWA Icons Setup

The POS System requires two icon files for PWA functionality:

- `public/pwa-192x192.png` (192x192 pixels)
- `public/pwa-512x512.png` (512x512 pixels)

## Quick Setup Options

### Option 1: Generate Icons Online
1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload a square image (at least 512x512)
3. Download the generated icons
4. Place them in the `public/` folder

### Option 2: Create Simple Icons
You can create simple icons using any image editor:
- Use a square canvas (192x192 and 512x512)
- Add your logo or text "POS"
- Save as PNG files with the exact names above

### Option 3: Use Placeholder Icons
For development, you can use any square PNG images temporarily. The app will work without them, but the PWA install prompt may not show icons.

## Icon Requirements
- Format: PNG
- Sizes: 192x192 and 512x512 pixels
- Format: Square (1:1 aspect ratio)
- Background: Transparent or solid color
- File names must match exactly: `pwa-192x192.png` and `pwa-512x512.png`

Once you add these files to the `public/` folder, the PWA will automatically use them.

