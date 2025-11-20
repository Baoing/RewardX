# 云服务器部署指南

## ⏱️ 时间估算

| 步骤 | 有经验 | 新手 |
|------|--------|------|
| 服务器环境准备 | 10-15分钟 | 30-60分钟 |
| 代码部署 | 5-10分钟 | 15-30分钟 |
| 环境变量配置 | 5分钟 | 10-15分钟 |
| 数据库设置 | 5-10分钟 | 15-30分钟 |
| 构建和启动 | 10-15分钟 | 20-30分钟 |
| Nginx 配置 | 10-15分钟 | 30-60分钟 |
| SSL 证书 | 10-15分钟 | 20-30分钟 |
| **总计** | **55-80分钟** | **2-4小时** |

---

## 📋 前置要求

- 云服务器（Ubuntu 20.04+ 推荐）
- 域名（可选，但推荐）
- SSH 访问权限
- 基础 Linux 命令知识

---

## 🚀 快速部署（推荐使用 Docker）

### 步骤 1: 服务器环境准备（10-15分钟）

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 安装 Nginx（用于反向代理）
sudo apt install nginx -y

# 5. 安装 Certbot（用于 SSL 证书）
sudo apt install certbot python3-certbot-nginx -y

# 6. 重新登录以应用 Docker 组权限
exit
# 重新 SSH 登录
```

### 步骤 2: 克隆代码（5分钟）

```bash
# 创建项目目录
mkdir -p ~/rewardx
cd ~/rewardx

# 克隆代码（或使用 scp 上传）
git clone https://github.com/your-username/rewardx.git .

# 或者使用 scp 从本地上传
# scp -r . user@your-server-ip:~/rewardx/
```

### 步骤 3: 配置环境变量（5分钟）

```bash
# 创建 .env 文件
cd ~/rewardx
cp .env.example .env  # 如果没有，直接创建
nano .env
```

**`.env` 文件内容：**

```bash
# Shopify 配置
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-domain.com

# 数据库配置（使用 Docker Compose 中的 PostgreSQL）
DATABASE_URL=postgresql://rewardx:rewardx_password@postgres:5432/rewardx

# 会话密钥（生成随机字符串）
SESSION_SECRET=$(openssl rand -base64 32)

# Node 环境
NODE_ENV=production
PORT=3000

# 其他配置
APP_NAME=RewardX
```

**生成 SESSION_SECRET：**

```bash
openssl rand -base64 32
```

### 步骤 4: 启动数据库（5-10分钟）

```bash
cd ~/rewardx

# 启动 PostgreSQL（仅数据库，不启动应用）
docker-compose up -d postgres

# 等待数据库启动（约 30 秒）
sleep 30

# 验证数据库连接
docker-compose exec postgres psql -U rewardx -d rewardx -c "SELECT version();"
```

### 步骤 5: 运行数据库迁移（5分钟）

```bash
cd ~/rewardx

# 方式 1: 使用 Docker 运行迁移
docker-compose run --rm app npm run setup

# 方式 2: 本地运行（如果服务器已安装 Node.js）
npm install
npx prisma generate
npx prisma migrate deploy
```

### 步骤 6: 构建和启动应用（10-15分钟）

**方式 A: 使用 Docker（推荐）**

```bash
cd ~/rewardx

# 修改 docker-compose.yml，添加应用服务
# 然后启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

**方式 B: 使用 PM2（更灵活）**

```bash
# 1. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 安装依赖
cd ~/rewardx
npm ci --omit=dev

# 4. 构建项目
npm run build

# 5. 启动应用
pm2 start npm --name "rewardx" -- run start

# 6. 设置开机自启
pm2 startup
pm2 save
```

### 步骤 7: 配置 Nginx 反向代理（10-15分钟）

```bash
# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/rewardx
```

**Nginx 配置内容：**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 如果使用 IP 访问，注释掉 server_name
    # server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Shopify App 需要这些头部
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # 静态文件缓存（可选）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/rewardx /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 8: 配置 SSL 证书（10-15分钟）

```bash
# 使用 Let's Encrypt 免费 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 如果使用 IP 访问，跳过 SSL 配置（不推荐生产环境）
```

**自动续期：**

```bash
# Certbot 会自动配置 cron 任务，无需手动操作
# 验证自动续期
sudo certbot renew --dry-run
```

---

## 🔧 完整 docker-compose.yml 配置

创建或更新 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: rewardx-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: rewardx
      POSTGRES_PASSWORD: rewardx_password
      POSTGRES_DB: rewardx
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rewardx"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RewardX 应用
  app:
    build: .
    container_name: rewardx-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://rewardx:rewardx_password@postgres:5432/rewardx
      - SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
      - SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET}
      - SHOPIFY_SCOPES=${SHOPIFY_SCOPES}
      - SHOPIFY_APP_URL=${SHOPIFY_APP_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./build:/app/build
      - ./prisma:/app/prisma

volumes:
  postgres_data:
    driver: local
```

---

## 📝 部署检查清单

- [ ] 服务器环境准备完成（Docker, Nginx, Certbot）
- [ ] 代码已部署到服务器
- [ ] `.env` 文件配置正确
- [ ] 数据库已启动并运行
- [ ] 数据库迁移已执行
- [ ] 应用已构建并启动
- [ ] Nginx 反向代理配置正确
- [ ] SSL 证书已配置（生产环境）
- [ ] 防火墙端口已开放（80, 443, 3000）
- [ ] Shopify App URL 已更新为服务器地址

---

## 🔥 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 如果使用云服务器控制台，也需要在控制台配置安全组
```

---

## 🐛 常见问题

### 1. 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps

# 检查数据库日志
docker-compose logs postgres

# 测试连接
docker-compose exec postgres psql -U rewardx -d rewardx
```

### 2. 应用无法启动

```bash
# 查看应用日志
docker-compose logs app
# 或
pm2 logs rewardx

# 检查端口占用
sudo netstat -tulpn | grep 3000
```

### 3. Nginx 502 错误

```bash
# 检查应用是否运行
curl http://localhost:3000

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew
```

---

## 🔄 更新部署

```bash
cd ~/rewardx

# 1. 拉取最新代码
git pull

# 2. 重新构建（Docker）
docker-compose build app
docker-compose up -d app

# 或（PM2）
npm ci --omit=dev
npm run build
pm2 restart rewardx

# 3. 运行数据库迁移（如果有）
npx prisma migrate deploy
```

---

## 📊 监控和维护

### 使用 PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rewardx

# 查看资源使用
pm2 monit

# 重启应用
pm2 restart rewardx
```

### 使用 Docker 监控

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 查看资源使用
docker stats
```

---

## ⚡ 性能优化建议

1. **启用 Nginx 缓存**（静态资源）
2. **使用 CDN**（可选，用于静态资源）
3. **配置 PM2 集群模式**（多进程）
4. **数据库连接池优化**
5. **启用 Gzip 压缩**

---

## 🎯 快速命令参考

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启应用
docker-compose restart app

# 进入容器
docker-compose exec app sh

# 运行数据库迁移
docker-compose exec app npm run setup
```

---

## 📞 需要帮助？

如果遇到问题，检查：
1. 应用日志：`docker-compose logs app` 或 `pm2 logs`
2. Nginx 日志：`sudo tail -f /var/log/nginx/error.log`
3. 数据库日志：`docker-compose logs postgres`

