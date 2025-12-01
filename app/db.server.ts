import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

// 在 Serverless 环境（如 Vercel）中，每次请求都可能创建新实例
// 使用全局变量缓存实例，避免连接池耗尽
const prisma =
  global.prismaGlobal ??
  (global.prismaGlobal = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Serverless 环境优化
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  }))

// 在 Serverless 环境中，确保连接在函数结束时断开
if (process.env.VERCEL) {
  // Vercel 环境：使用连接池，但不需要手动断开
  // Prisma 会自动管理连接
}

export default prisma
export { prisma }
