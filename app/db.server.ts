import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

// 优化数据库连接配置，解决连接频繁关闭的问题
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  // 解析 DATABASE_URL 并添加连接池参数（如果还没有）
  let optimizedUrl = databaseUrl
  try {
    const url = new URL(databaseUrl)
    
    // 设置连接池参数（如果 URL 中没有）
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10")
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10")
    }
    // PostgreSQL 连接超时
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10")
    }
    
    optimizedUrl = url.toString()
  } catch (error) {
    // 如果 URL 解析失败，使用原始 URL
    console.warn("⚠️ DATABASE_URL 解析失败，使用原始 URL:", error)
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: optimizedUrl
      }
    }
  })
}

// 在 Serverless 环境（如 Vercel）中，每次请求都可能创建新实例
// 使用全局变量缓存实例，避免连接池耗尽
const prisma =
  global.prismaGlobal ??
  (global.prismaGlobal = createPrismaClient())

// 在开发环境中，预连接以避免首次查询延迟
if (process.env.NODE_ENV === "development") {
  // 延迟连接，避免阻塞启动
  setTimeout(() => {
    prisma.$connect().catch((error) => {
      console.error("❌ Prisma 预连接失败:", error)
    })
  }, 0)
}

export default prisma
export { prisma }

