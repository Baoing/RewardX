# ⚡ 宝塔面板快速部署（30-50分钟）

## 📋 时间表

| 步骤 | 时间 | 说明 |
|------|------|------|
| 安装 Node.js + PM2 | 5分钟 | 宝塔软件商店一键安装 |
| 安装 PostgreSQL | 5分钟 | 宝塔软件商店或 Docker |
| 部署代码 | 5分钟 | Git clone 或文件上传 |
| 配置 .env | 5分钟 | 宝塔文件管理器编辑 |
| 运行部署脚本 | 10-15分钟 | `bash scripts/deploy-bt.sh` |
| 配置 Nginx | 5分钟 | 宝塔图形界面 |
| 申请 SSL | 5分钟 | 宝塔一键申请 |
| Cloudflare 配置 | 5分钟 | DNS + SSL 设置 |
| **总计** | **45-50分钟** |  |

---

## 🚀 超快速部署（5步）

### 1️⃣ 安装环境（10分钟）

**宝塔面板 → 软件商店：**
- 安装 **PM2管理器 5.0**（自动安装 Node.js 20）
- 安装 **PostgreSQL 15**（或使用 Docker）

### 2️⃣ 部署代码（5分钟）

**宝塔终端：**
```bash
cd /www/wwwroot
git clone your-repo rewardx
cd rewardx
```

### 3️⃣ 配置环境变量（5分钟）

**宝塔文件管理器：**
- 进入 `/www/wwwroot/rewardx/`
- 创建 `.env` 文件
- 填入 Shopify 配置和数据库连接

### 4️⃣ 一键部署（15分钟）

**宝塔终端：**
```bash
cd /www/wwwroot/rewardx
bash scripts/deploy-bt.sh
```

### 5️⃣ 配置网站（10分钟）

**宝塔面板：**
1. **网站** → **添加站点** → 填写域名
2. **设置** → **反向代理** → 添加代理到 `http://127.0.0.1:3000`
3. **SSL** → **Let's Encrypt** → 申请证书
4. **Cloudflare** → 配置 DNS 和 SSL 模式

---

## 📝 详细步骤

### 步骤 1: 安装 PM2 管理器

1. 宝塔面板 → **软件商店**
2. 搜索 **PM2管理器**
3. 点击 **安装**
4. 等待安装完成（自动安装 Node.js 20）

### 步骤 2: 安装 PostgreSQL

**方式 A: 宝塔软件商店（简单）**
1. **软件商店** → 搜索 **PostgreSQL**
2. 安装 **PostgreSQL 15**
3. 设置数据库密码

**方式 B: Docker（推荐，更灵活）**
```bash
# 在宝塔终端执行
cd /www/wwwroot
# 使用项目中的 docker-compose.yml
docker-compose up -d postgres
```

### 步骤 3: 部署代码

**方式 A: Git（推荐）**
```bash
cd /www/wwwroot
git clone https://github.com/your-username/rewardx.git
cd rewardx
```

**方式 B: 文件上传**
1. 宝塔 **文件管理器**
2. 进入 `/www/wwwroot/`
3. 上传项目压缩包并解压

### 步骤 4: 配置 .env

**宝塔文件管理器：**
1. 进入 `/www/wwwroot/rewardx/`
2. 创建 `.env` 文件
3. 复制以下模板并修改：

```bash
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://postgres:password@localhost:5432/rewardx
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
```

### 步骤 5: 运行部署脚本

**宝塔终端：**
```bash
cd /www/wwwroot/rewardx
bash scripts/deploy-bt.sh
```

脚本会自动：
- ✅ 安装依赖
- ✅ 生成 Prisma Client
- ✅ 运行数据库迁移
- ✅ 构建项目
- ✅ 启动 PM2 进程

### 步骤 6: 配置 Nginx

1. **网站** → **添加站点**
   - 域名：`your-domain.com`
   - 类型：**纯静态**（稍后改）

2. **设置** → **反向代理** → **添加反向代理**
   - 代理名称：`rewardx`
   - 目标URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`

3. **配置文件** → 修改 `location /` 为：
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 步骤 7: 申请 SSL

1. **网站** → 你的域名 → **设置** → **SSL**
2. 选择 **Let's Encrypt**
3. 勾选域名
4. 点击 **申请**
5. 开启 **强制HTTPS**

### 步骤 8: 配置 Cloudflare

1. **DNS 记录**：
   - 添加 A 记录：`@` → 服务器 IP（🟠 已代理）
   - 添加 CNAME：`www` → `your-domain.com`（🟠 已代理）

2. **SSL/TLS**：
   - **概述** → **完全（严格）**
   - **边缘证书** → 开启 **始终使用 HTTPS**

---

## ✅ 验证部署

```bash
# 1. 检查 PM2 状态
pm2 status

# 2. 查看日志
pm2 logs rewardx

# 3. 测试本地访问
curl http://localhost:3000

# 4. 测试域名
curl https://your-domain.com
```

---

## 🔧 常用操作

### 重启应用
```bash
pm2 restart rewardx
```

### 查看日志
```bash
pm2 logs rewardx
```

### 更新代码
```bash
cd /www/wwwroot/rewardx
git pull
bash scripts/deploy-bt.sh
```

---

## 🎉 完成！

访问 `https://your-domain.com` 测试部署！

**总耗时：30-50 分钟** ⚡

