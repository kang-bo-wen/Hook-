# Hook MVP

Hook 是一个面向大学生真实用户内测的一对一、内容驱动交友平台。用户可以发布 Hook，也可以设置下一次希望接收的内容偏好。项目坚持不创建虚拟用户、虚拟 Hook 或伪造匹配数据。

## 核心原则

- 一个 Hook 最多分配给一个接收者，不能复用或二次分配。
- 发布区与接收区分离，不提供公开 Hook 广场。
- 用户可以同时发布和接收 Hook。
- 下一次接收偏好独立保存，优先考虑用户当前意图。
- 双方互相表达继续了解之前，不开放私聊。

## 当前实现

- Web：Next.js 15、React 19、TypeScript。
- API：NestJS 10、TypeScript。
- 数据库：PostgreSQL 16、Prisma 6。
- 注册、登录、邮箱验证码和基础用户资料 API。
- Hook 创建、本人 Hook 查询、编辑和关闭 API。
- 下一次接收偏好读取和保存 API。
- `/admin` 管理员登录后台，可查看账户和 Hook 列表。
- Hook 发布、接收偏好和管理员触发匹配页面已连接 API；回复、双向兴趣和聊天尚未实现。

数据库迁移已成功，管理员后台已验证可正常使用。更完整的功能现状和后续计划见 [项目说明与开发路线](PROJECT_OVERVIEW.md)。

## 环境配置与启动

详细的逐步环境配置、数据库迁移和开发启动说明见 [环境配置与开发启动指南](DEVELOPMENT_SETUP.md)。

本地启动数据库：

```powershell
docker compose up -d postgres
```

Web、API 及环境变量配置请按开发启动指南操作。不要提交 `.env`、QQ 邮箱授权码、管理员密码或 Token Secret。
