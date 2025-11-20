# ⚡ 快速部署指南（云服务器）

## ⏱️ 时间估算

**有经验开发者：55-80 分钟**  
**新手：2-4 小时**

---

## 🎯 一键部署（最快方式）

### 前提条件
- Ubuntu 20.04+ 服务器
- SSH 访问权限
- 域名（可选，但推荐）

### 步骤 1: 服务器初始化（10分钟）

```bash
# SSH 登录服务器后执行
curl -fsSL https://raw.githubusercontent.com/your-repo/rewardx/main/scripts/setup-server.sh | bash
```

或手动执行：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# 重新登录
exit
```

### 步骤 2: 部署代码（5分钟）

```bash
# 克隆或上传代码
git clone https://github.com/your-username/rewardx.git ~/rewardx
cd ~/rewardx

# 或使用 scp 上传
# scp -r . user@server-ip:~/rewardx/
```

### 步骤 3: 配置环境变量（5分钟）

```bash
cd ~/rewardx
nano .env
```

**必需的环境变量：**

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-domain.com
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
DATABASE_URL=postgresql://rewardx:rewardx_password@postgres:5432/rewardx
```

### 步骤 4: 一键部署（15-20分钟）

```bash
cd ~/rewardx
bash scripts/deploy.sh
```

脚本会自动：
1. ✅ 检查环境
2. ✅ 构建 Docker 镜像
3. ✅ 启动数据库
4. ✅ 运行数据库迁移
5. ✅ 启动应用

### 步骤 5: 配置 Nginx（10分钟）

```bash
sudo nano /etc/nginx/sites-available/rewardx
```

**配置内容：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/rewardx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤 6: 配置 SSL（10分钟）

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 📋 完整时间表

| 步骤 | 时间 | 说明 |
|------|------|------|
| 服务器准备 | 10-15分钟 | 安装 Docker, Nginx |
| 代码部署 | 5分钟 | Git clone 或 scp |
| 环境变量 | 5分钟 | 配置 .env |
| 一键部署 | 15-20分钟 | 运行 deploy.sh |
| Nginx 配置 | 10分钟 | 反向代理 |
| SSL 证书 | 10分钟 | Let's Encrypt |
| **总计** | **55-65分钟** | 有经验开发者 |

---

## 🔧 常用命令

```bash
# 查看应用日志
docker-compose logs -f app

# 重启应用
docker-compose restart app

# 更新代码
git pull && docker-compose build app && docker-compose up -d app

# 运行数据库迁移
docker-compose run --rm app npm run setup

# 查看服务状态
docker-compose ps
```

---

## 🐛 故障排查

### 应用无法访问

```bash
# 检查应用是否运行
curl http://localhost:3000

# 查看日志
docker-compose logs app

# 检查端口
sudo netstat -tulpn | grep 3000
```

### 数据库连接失败

```bash
# 检查数据库
docker-compose ps postgres
docker-compose logs postgres

# 测试连接
docker-compose exec postgres psql -U rewardx -d rewardx
```

### Nginx 502 错误

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ 部署检查清单

- [ ] 服务器环境准备完成
- [ ] 代码已部署
- [ ] .env 文件配置正确
- [ ] 应用已启动（`docker-compose ps`）
- [ ] 数据库迁移已执行
- [ ] Nginx 配置正确
- [ ] SSL 证书已配置
- [ ] 防火墙端口已开放
- [ ] Shopify App URL 已更新

---

## 🎉 完成！

部署完成后，访问：
- 应用地址: `https://your-domain.com`
- 健康检查: `https://your-domain.com/health`

更新 Shopify App 设置中的 App URL 为你的服务器地址。

