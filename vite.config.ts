import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// base: './' 让构建产物的资源引用全部相对化——GitHub Pages 项目站（子路径）、
// Vercel、Netlify 等任意静态托管都能直接跑，无需硬编码仓库名
export default defineConfig({
  base: './',
  plugins: [react()],
});
