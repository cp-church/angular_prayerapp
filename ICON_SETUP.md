Icon generation for PWA and favicon
----------------------------------

Steps to generate icons (using the image you attached):

1. Save the attached image as `public/icon-source.png` (square, >= 1024px recommended).
2. Install `sharp` locally if you don't have it:

   npm install --save-dev sharp

3. Run the generator script:

   npm run generate-icons

This will create:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-icon-512.png`
- `public/apple-touch-icon.png`
- `public/favicon-32.png`
- `public/favicon-16.png`

After running, build and test your app. The PWA manifest and `src/index.html` were updated to reference these files.
