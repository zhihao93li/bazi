import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true, // 允许局域网访问
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React 核心库
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // 动画库
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // 省市区数据（单独分离）
          if (id.includes('node_modules/province-city-china')) {
            return 'china-geo';
          }
          // 图标库
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'icons';
          }
          // 其他工具库
          if (id.includes('node_modules/lunar-typescript') ||
            id.includes('node_modules/@tanstack')) {
            return 'utils';
          }
        }
      }
    },
    // 增加警告阈值
    chunkSizeWarningLimit: 1000,
  }
})


