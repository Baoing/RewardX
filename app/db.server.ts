import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

// 在开发环境中，使用全局实例避免多个 Prisma Client 实例
// 在生产环境中，每次都创建新实例
const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : global.prismaGlobal ?? (global.prismaGlobal = new PrismaClient())

export default prisma
export { prisma }
