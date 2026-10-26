# 开发环境配置与启动步骤

适用于 Windows PowerShell。仓库由 Web、API、PostgreSQL 组成。

## 0. 安装准备

安装 Node.js 20 LTS、Git、Docker Desktop。启动 Docker Desktop 并等待 Engine 就绪。检查：

```powershell
node --version
npm --version
git --version
docker version
docker compose version
```

## 1. 克隆并安装依赖

```powershell
git clone <GitHub仓库地址>
cd <仓库目录>
npm ci
```

依赖由根目录 npm workspaces 管理，使用根目录 `package-lock.json`。

## 2. 配置 API 环境变量

复制示例并创建 `apps/api/.env`：

```powershell
Copy-Item apps/api/env.example apps/api/.env
```

编辑 `apps/api/.env`，配置：

```env
DATABASE_URL="postgresql://hook:hook_dev_password@localhost:5432/hook?schema=public"
PORT=3001
RESEND_API_KEY="re_你的Resend_API_Key"
EMAIL_FROM="Hook <onboarding@resend.dev>"
ADMIN_USERNAME="你设置的管理员名"
ADMIN_PASSWORD="你设置的强密码"
ADMIN_TOKEN_SECRET="至少32字符的随机秘密"
```

数据库连接串需与根目录 `docker-compose.yml` 中的数据库名、用户名、密码和端口一致。Resend 测试发件地址可能受测试收件人限制；要发送给任意用户，需要验证发件域名并更新 `EMAIL_FROM`。没有 Resend 配置时，邮箱验证码功能不能发送邮件。

生成管理员 Token Secret 的命令：

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

所有真实密钥、密码仅放在 `.env`，绝不能提交 Git 或发到聊天中。

## 3. 启动数据库

启动 Docker Desktop，在项目根目录运行：

```powershell
docker compose up -d postgres
docker compose ps
```

确认 postgres 容器处于运行状态。停止但保留数据：

```powershell
docker compose stop postgres
```

勿随意删除 Docker volume，否则数据库数据会丢失。

## 4. 生成 Prisma Client 并同步数据库

仓库当前迁移可能未包含最近新增的邮箱验证表。启动 PostgreSQL 后，在项目根目录执行：

```powershell
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run prisma:migrate -- --name email_verification
```

该命令会根据当前 schema 创建缺失迁移并应用到本地开发数据库。若提示数据库已有迁移或没有 schema 变更，按 Prisma 提示检查状态，不要反复创建迁移。

新环境若仓库已包含完整迁移，使用部署式迁移命令：

```powershell
npm --prefix apps/api exec prisma migrate deploy
npm --prefix apps/api run prisma:generate
```

若本地 schema 与迁移状态不一致，先检查错误和 `apps/api/prisma/migrations/`，不要直接执行 `migrate reset`；reset 会删除数据库数据。

## 5. 启动 API

在项目根目录打开一个 PowerShell 窗口：

```powershell
npm --prefix apps/api run start:dev
```

默认 API 地址为 `http://localhost:3001`。健康检查：

```powershell
Invoke-RestMethod http://localhost:3001/health
```

正常时返回状态和 database 为 `ok`。

## 6. 启动 Web

再开一个新的 PowerShell 窗口，同样进入项目根目录：

```powershell
npm --prefix apps/web run dev
```

打开：

- 首页：`http://localhost:3000`
- 注册/登录：`http://localhost:3000/auth`
- 发布 Hook：`http://localhost:3000/publish`
- 接收偏好：`http://localhost:3000/receive`
- 管理后台：`http://localhost:3000/admin`

本地 Web 默认连接 `http://localhost:3001`。如果 API 地址不同，可为 Web 设置 `NEXT_PUBLIC_API_URL`，然后重启 Web。

## 7. 首次使用与管理员登录

1. 确认 PostgreSQL、API、Web 三者都在运行。
2. 在 `/auth` 注册。需要正确配置 Resend 并验证邮件收件条件，收到验证码后完成注册。
3. 登录后可在发布和接收页面提交数据；数据会写入本地 PostgreSQL。
4. 管理员访问 `/admin`，使用 `apps/api/.env` 的 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 登录。
5. 修改 API `.env` 后必须重启 API。

## 8. 构建和数据库查看

构建 API：

```powershell
npm --prefix apps/api run build
```

构建 Web：

```powershell
npm --prefix apps/web run build
```

查看数据库可在项目根目录运行：

```powershell
npm --prefix apps/api exec prisma studio
```

Studio 通常位于 `http://localhost:5555`。不要公开 Studio，也不要分享含个人数据的截图。

## 9. 常见问题

- `P1001 Can't reach database`：启动 Docker Desktop，运行 `docker compose up -d postgres`，检查端口 5432 是否可用。
- 管理员提示未配置：确认变量在 `apps/api/.env`，名称无拼写错误，保存后重启 API。
- 验证码接口提示未配置或发送失败：检查 Resend API Key、发件地址和账户测试限制；查看 API 终端错误，不要输出或分享密钥。
- 浏览器 API 请求失败：确认 API 在 3001 端口运行，Web 在 3000 端口运行。
- Prisma Client 类型/模型错误：执行 `npm --prefix apps/api run prisma:generate` 后重启 API。
- 迁移报错：先检查数据库和迁移状态，不要用 `migrate reset` 作为常规修复。

## 10. 上传 GitHub 前

确认 `.gitignore` 生效并检查待提交文件：

```powershell
git status --short
git check-ignore apps/api/.env
```

`.env`、Resend Key、管理员密码、Token Secret、`node_modules`、`.next` 和 `dist` 不应进入提交。只提交代码、迁移、示例环境配置和说明文档。
