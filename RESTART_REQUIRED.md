# 需要重启开发服务器

## 问题
Prisma Client 已更新，但开发服务器可能仍在使用旧的缓存实例。

## 解决方案

### 步骤 1: 停止当前开发服务器
按 `Ctrl+C` 停止正在运行的开发服务器

### 步骤 2: 清除缓存并重启
```bash
# 清除 Prisma Client 缓存
rm -rf node_modules/.prisma node_modules/@prisma/client

# 重新生成 Prisma Client
npx prisma generate

# 重启开发服务器
npm run dev
```

## 验证

重启后，Session 模型应该包含以下字段：
- ✅ `email` (String?)
- ✅ `emailVerified` (Boolean?)

## 当前状态

- ✅ Schema 已更新（包含 email 和 emailVerified）
- ✅ 数据库字段已添加
- ✅ Prisma Client 已重新生成
- ⚠️ **需要重启开发服务器以加载新的 Prisma Client**

