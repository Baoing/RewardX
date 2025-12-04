import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

/**
 * Vite 配置 - 客户端组件构建
 * 
 * 用于构建 Storefront 客户端游戏组件
 * 构建产物会输出到 extensions/rewardx-lottery-extension/assets/
 * 
 * 运行: npm run build:plugin
 */
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "")
  
  return {
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "@plugin": path.resolve(__dirname, "./app/plugin")
    }
  },

  // 指定入口文件和根目录
  root: path.resolve(__dirname, "app/plugin"),
  
  build: {
    outDir: path.resolve(__dirname, "extensions/rewardx-lottery-extension/assets"),
    emptyOutDir: false,
    
    rollupOptions: {
      input: {
        "lottery-game": path.resolve(__dirname, "app/plugin/main.tsx")
      },
      output: {
        // 输出为 IIFE 格式，适合直接在浏览器中运行
        format: "iife",
        name: "RewardXLottery",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name].[ext]",
        // 确保 React 被打包进来
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        }
      }
    },
    
    // 压缩配置
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true // 生产环境移除 console
      }
    },
    
    // Source map 用于调试
    sourcemap: false
  },

  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    // 注入应用 API URL 环境变量
    // 优先使用 REWARDX_APP_URL，如果没有则使用 SHOPIFY_APP_URL
    "process.env.REWARDX_APP_URL": JSON.stringify(
      env.REWARDX_APP_URL || env.SHOPIFY_APP_URL || ""
    ),
  },

  // 开发服务器配置
  server: {
    port: 5174,
    open: true,
    // 支持 HMR
    hmr: true
  },
  
  // 开发模式配置
  optimizeDeps: {
    include: ["react", "react-dom", "@lucky-canvas/react"]
  }
  }
})

