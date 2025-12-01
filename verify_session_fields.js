// 验证 Session 模型字段
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function verify() {
  try {
    // 检查 Session 模型是否有 email 和 emailVerified 字段
    const sessionFields = Object.keys(prisma.session.fields || {})
    
    console.log("✅ Session 模型字段:")
    console.log(sessionFields)
    
    const hasEmail = sessionFields.includes("email")
    const hasEmailVerified = sessionFields.includes("emailVerified")
    
    console.log("\n验证结果:")
    console.log(`- email 字段: ${hasEmail ? "✅ 存在" : "❌ 缺失"}`)
    console.log(`- emailVerified 字段: ${hasEmailVerified ? "✅ 存在" : "❌ 缺失"}`)
    
    if (hasEmail && hasEmailVerified) {
      console.log("\n✅ 所有必需字段都存在！")
      console.log("⚠️  如果仍然报错，请重启开发服务器（Ctrl+C 然后 npm run dev）")
    } else {
      console.log("\n❌ 缺少必需字段，请运行: npx prisma generate")
    }
  } catch (error) {
    console.error("❌ 错误:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verify()

