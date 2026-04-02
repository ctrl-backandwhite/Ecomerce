import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5174,
    host: '0.0.0.0',   // Necesario para que Docker (host.docker.internal) pueda alcanzar el dev server
    allowedHosts: true, // Permite peticiones con Host: host.docker.internal desde el gateway en Docker
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules/')) return;

          // Extract exact package name (handles scoped packages like @radix-ui/react-dialog)
          const parts = id.split('node_modules/')[1].split('/');
          const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

          // React core (exact packages only — avoids circular refs)
          if (['react', 'react-dom', 'scheduler'].includes(pkg)) return 'vendor-react';
          if (pkg === 'react-router') return 'vendor-react';

          // Charts
          if (pkg === 'recharts') return 'vendor-charts';

          // Animation
          if (pkg === 'motion') return 'vendor-motion';

          // PDF / export (large, only loaded on demand)
          if (['jspdf', 'html2canvas'].includes(pkg)) return 'vendor-export';

          // Radix UI
          if (pkg.startsWith('@radix-ui/')) return 'vendor-ui';

          // Lucide icons
          if (pkg === 'lucide-react') return 'vendor-ui';

          // MUI + Emotion
          if (pkg.startsWith('@mui/') || pkg.startsWith('@emotion/')) return 'vendor-mui';

          // Drag & drop
          if (['react-dnd', 'react-dnd-html5-backend', 'dnd-core', '@react-dnd'].includes(pkg)) return 'vendor-dnd';

          // Carousel
          if (['embla-carousel-react', 'embla-carousel', 'react-slick', 'slick-carousel'].includes(pkg)) return 'vendor-carousel';

          // Date utilities
          if (pkg === 'date-fns') return 'vendor-date';

          // Forms
          if (pkg === 'react-hook-form') return 'vendor-forms';

          // Everything else
          return 'vendor-misc';
        },
      },
    },
  },
})
