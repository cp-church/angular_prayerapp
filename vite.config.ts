import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
          if (id.includes('node_modules/@vercel')) return 'vercel-vendor';
          // Component chunks for code splitting - keep admin features together
          if (id.includes('PrayerPresentation') || id.includes('MobilePresentation')) return 'presentation';
          if (id.includes('Admin')) return 'admin';
        }
      }
    },
    chunkSizeWarningLimit: 500,
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3, // More aggressive compression
      },
    } as any,
    // Target modern browsers for smaller output
    target: 'esnext',
    // Enable source maps only for production debugging
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
  }
})
