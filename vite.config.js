// vite 构建配置
// 说明：base 使用相对路径 './'，方便直接上传 Cloudflare Pages / 任意子目录托管
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 相对 base，便于静态托管（Cloudflare Pages / Nginx 子目录均可用）
  base: './',
  server: {
    port: 5173,
    open: false,
    // 安全：仅监听本机回环地址，避免开发服务器暴露到局域网
    // （旧版 vite/esbuild 的 dev server 存在跨站读取与路径穿越类漏洞）
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 关闭 sourcemap 减小产物体积（按需可开启）
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
})
