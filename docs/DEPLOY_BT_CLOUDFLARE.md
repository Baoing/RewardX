# 宝塔面板 + Cloudflare 部署指南

## ⏱️ 时间估算

**使用宝塔面板：30-50 分钟**（比手动部署快很多！）

---

## 📋 前置准备

- ✅ 服务器已安装宝塔面板
- ✅ 域名已添加到 Cloudflare
- ✅ Cloudflare DNS 已配置
- ✅ 服务器已开放端口：80, 443, 3000, 22

---

## 🚀 部署步骤

### 步骤 1: 宝塔面板环境准备（5分钟）

#### 1.1 安装 Node.js 20

在宝塔面板：
1. 打开 **软件商店**
2. 搜索 **PM2管理器** 或 **Node版本管理器**
3. 安装 **PM2管理器 5.0**（会自动安装 Node.js）

或手动安装：

```bash
# SSH 登录服务器
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

#### 1.2 安装 PostgreSQL（可选，推荐使用宝塔的 PostgreSQL）

在宝塔面板：
1. **软件商店** → 搜索 **PostgreSQL**
2. 安装 **PostgreSQL 15**
3. 设置数据库密码（记住这个密码）

或使用 Docker（推荐，更灵活）：

```bash
# 在宝塔终端执行
cd /www/wwwroot
docker-compose up -d postgres
```

---

### 步骤 2: 部署代码（5分钟）

#### 方式 A: 使用宝塔文件管理器

1. 打开 **文件** → 进入 `/www/wwwroot/`
2. 创建文件夹 `rewardx`
3. 上传项目文件（或使用 Git）

#### 方式 B: 使用 Git（推荐）

在宝塔终端执行：

```bash
cd /www/wwwroot
git clone https://github.com/your-username/rewardx.git
cd rewardx
```

#### 方式 C: 使用宝塔 Git 部署

1. **软件商店** → 安装 **Git**
2. **网站** → 添加站点 → 选择 **Node项目**
3. 填写域名和项目路径
4. 在 **Git** 标签页配置仓库地址

---

### 步骤 3: 配置环境变量（5分钟）

在宝塔文件管理器中：
1. 进入 `/www/wwwroot/rewardx/`
2. 创建 `.env` 文件
3. 编辑并填入以下内容：

```bash
# Shopify 配置
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-domain.com

# 数据库配置
# 如果使用宝塔 PostgreSQL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/rewardx

# 如果使用 Docker PostgreSQL
DATABASE_URL=postgresql://rewardx:rewardx_password@localhost:5432/rewardx

# 会话密钥（生成随机字符串）
SESSION_SECRET=your_random_secret_key_here

# Node 环境
NODE_ENV=production
PORT=3000

# 其他
APP_NAME=RewardX
```

**生成 SESSION_SECRET：**

在宝塔终端执行：
```bash
openssl rand -base64 32
```

---

### 步骤 4: 安装依赖和构建（10-15分钟）

在宝塔终端执行：

```bash
cd /www/wwwroot/rewardx

# 安装依赖
npm ci --omit=dev

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 构建项目
npm run build
```

---

### 步骤 5: 配置 PM2 进程管理（5分钟）

#### 方式 A: 使用宝塔 PM2 管理器（推荐）

1. 打开 **软件商店** → **PM2管理器**
2. 点击 **添加 Node 项目**
3. 配置如下：
   - **项目名称**: `rewardx`
   - **项目路径**: `/www/wwwroot/rewardx`
   - **启动文件**: `npm`
   - **启动参数**: `run start`
   - **项目端口**: `3000`
   - **运行模式**: `fork`
4. 点击 **提交**

#### 方式 B: 使用命令行 PM2

```bash
cd /www/wwwroot/rewardx
pm2 start npm --name "rewardx" -- run start
pm2 save
pm2 startup
```

---

### 步骤 6: 配置 Nginx 反向代理（5分钟）

#### 6.1 在宝塔面板添加网站

1. **网站** → **添加站点**
2. 填写域名：`your-domain.com`
3. 选择 **纯静态**（稍后修改）
4. 点击 **提交**

#### 6.2 配置反向代理

1. **网站** → 找到你的域名 → **设置**
2. 进入 **反向代理** 标签页
3. 点击 **添加反向代理**
4. 配置如下：
   - **代理名称**: `rewardx`
   - **目标URL**: `http://127.0.0.1:3000`
   - **发送域名**: `$host`
   - **缓存**: 关闭
5. 点击 **提交**

#### 6.3 修改配置文件（重要）

点击 **配置文件**，找到 `location /` 部分，修改为：

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
    proxy_cache_bypass $http_upgrade;
    
    # Shopify App 必需头部
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}

# 静态资源缓存（可选）
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    proxy_pass http://127.0.0.1:3000;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

点击 **保存**，然后 **重载配置**。

---

### 步骤 7: 配置 SSL 证书（5分钟）

#### 7.1 在宝塔面板申请证书

1. **网站** → 你的域名 → **设置** → **SSL**
2. 选择 **Let's Encrypt**
3. 勾选域名（如果有 www，也勾选）
4. 点击 **申请**
5. 申请成功后，开启 **强制HTTPS**

#### 7.2 Cloudflare SSL 配置

**重要：** 如果使用 Cloudflare 代理，需要配置 SSL 模式：

1. 登录 **Cloudflare 控制台**
2. 选择你的域名
3. **SSL/TLS** → **概述**
4. 选择 **完全（严格）** 模式
5. **SSL/TLS** → **边缘证书** → 开启 **始终使用 HTTPS**

---

### 步骤 8: 配置 Cloudflare DNS（5分钟）

#### 8.1 添加 DNS 记录

在 Cloudflare 控制台：

1. **DNS** → **记录**
2. 添加 **A 记录**：
   - **名称**: `@` 或 `your-domain.com`
   - **IPv4 地址**: 你的服务器 IP
   - **代理状态**: 🟠 **已代理**（推荐，使用 Cloudflare CDN）
   - **TTL**: 自动
3. 添加 **CNAME 记录**（如果有 www）：
   - **名称**: `www`
   - **目标**: `your-domain.com`
   - **代理状态**: 🟠 **已代理**

#### 8.2 配置 Cloudflare 代理设置

**如果使用 Cloudflare 代理（推荐）：**

1. **SSL/TLS** → **概述** → **完全（严格）**
2. **速度** → **优化** → 开启 **Auto Minify**（可选）
3. **缓存** → **配置** → 设置缓存规则（可选）

**注意：** 如果使用 Cloudflare 代理，需要确保：
- SSL 模式为 **完全（严格）**
- 宝塔面板的 SSL 证书正常
- 服务器防火墙开放 80 和 443 端口

---

### 步骤 9: 配置防火墙（2分钟）

在宝塔面板：

1. **安全** → **防火墙**
2. 确保以下端口已开放：
   - `80` (HTTP)
   - `443` (HTTPS)
   - `3000` (应用端口，仅内网访问)
   - `22` (SSH)

**注意：** 如果使用 Cloudflare 代理，3000 端口不需要对外开放。

---

### 步骤 10: 测试部署（3分钟）

```bash
# 1. 检查应用是否运行
pm2 status

# 2. 检查应用日志
pm2 logs rewardx

# 3. 测试本地访问
curl http://localhost:3000

# 4. 测试域名访问
curl https://your-domain.com
```

---

## 🔧 宝塔面板常用操作

### 查看应用日志

1. **软件商店** → **PM2管理器**
2. 找到 `rewardx` 项目
3. 点击 **日志** 查看实时日志

或使用命令行：
```bash
pm2 logs rewardx
```

### 重启应用

1. **PM2管理器** → 找到 `rewardx` → **重启**

或使用命令行：
```bash
pm2 restart rewardx
```

### 更新代码

```bash
cd /www/wwwroot/rewardx
git pull
npm ci --omit=dev
npm run build
pm2 restart rewardx
```

---

## 🐛 常见问题

### 1. 502 Bad Gateway

**原因：** 应用未启动或端口不对

**解决：**
```bash
# 检查 PM2 状态
pm2 status

# 检查应用日志
pm2 logs rewardx

# 检查端口占用
netstat -tulpn | grep 3000
```

### 2. Cloudflare 显示 521 错误

**原因：** 服务器连接失败

**解决：**
1. 检查服务器是否运行
2. 检查防火墙是否开放 80/443
3. 检查 Nginx 是否正常运行
4. 在 Cloudflare 中暂时关闭代理，测试直连

### 3. SSL 证书问题

**原因：** Cloudflare SSL 模式配置错误

**解决：**
1. Cloudflare → **SSL/TLS** → 选择 **完全（严格）**
2. 宝塔面板 → **SSL** → 检查证书是否有效
3. 确保域名 DNS 解析正确

### 4. 数据库连接失败

**原因：** 数据库配置错误

**解决：**
```bash
# 检查 PostgreSQL 是否运行
systemctl status postgresql

# 测试连接
psql -U postgres -d rewardx

# 检查 .env 中的 DATABASE_URL
cat /www/wwwroot/rewardx/.env | grep DATABASE_URL
```

---

## 📊 部署检查清单

- [ ] Node.js 20 已安装
- [ ] PM2 已安装并配置
- [ ] PostgreSQL 已安装并运行
- [ ] 代码已部署到 `/www/wwwroot/rewardx/`
- [ ] `.env` 文件配置正确
- [ ] 依赖已安装（`npm ci`）
- [ ] 数据库迁移已执行（`prisma migrate deploy`）
- [ ] 项目已构建（`npm run build`）
- [ ] PM2 进程已启动
- [ ] Nginx 反向代理已配置
- [ ] SSL 证书已申请并启用
- [ ] Cloudflare DNS 已配置
- [ ] Cloudflare SSL 模式为"完全（严格）"
- [ ] 防火墙端口已开放
- [ ] 应用可以正常访问

---

## ⚡ 快速命令参考

```bash
# 进入项目目录
cd /www/wwwroot/rewardx

# 查看 PM2 状态
pm2 status

# 查看日志
pm2 logs rewardx

# 重启应用
pm2 restart rewardx

# 停止应用
pm2 stop rewardx

# 更新代码
git pull && npm ci --omit=dev && npm run build && pm2 restart rewardx

# 运行数据库迁移
npx prisma migrate deploy

# 查看 Nginx 配置
cat /www/server/panel/vhost/nginx/your-domain.com.conf
```

---

## 🎉 完成！

部署完成后：
1. 访问 `https://your-domain.com` 测试
2. 在 Shopify App 设置中更新 App URL
3. 测试 Shopify OAuth 流程
4. 测试 Webhook 接收

**预计总时间：30-50 分钟** ⚡

