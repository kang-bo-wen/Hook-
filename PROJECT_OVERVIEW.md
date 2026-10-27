
# Hook MVP：项目说明与开发路线

## 项目定位

Hook 是面向大学生内测的一对一内容驱动交友平台。用户可以发布一段内容（Hook），也可以设置下一次愿意接收的内容偏好。目标是让双方先通过内容和回应逐渐建立信任，而非公开滑卡或多人围观。

这是一个真实用户内测 MVP 的毛坯版本。项目不生成虚拟用户、虚拟 Hook 或伪造匹配数据。部分页面目前只有前端交互，已接入 API 的功能会将数据写入 PostgreSQL。

## 产品原则

- 一个 Hook 最多分配给一个接收者，不复用、不二次分配。
- 发布区与接收区分开，不提供公开 Hook 广场。
- 用户可以同时发布和接收。
- 下一次接收意图与近期偏好应独立保存，优先于静态资料。
- 双方互相表达继续了解之前，不开放私聊。
- 真实用户数据和安全边界优先，不制造虚假活跃。

## 技术栈

- Web：Next.js 15、React 19、TypeScript
- API：NestJS 10、TypeScript
- 数据库：PostgreSQL 16、Prisma 6
- 本地环境：Docker Compose、npm workspaces

## 当前已实现

### Web 页面

- `/`：产品介绍首页与入口。
- `/auth`：注册、登录表单，注册包含邮箱验证码字段。
- `/publish`：Hook 发布表单，接入 `POST /hooks`。
- `/receive`：下一次接收偏好表单，接入偏好读取和保存 API。
- `/admin`：独立管理员登录、账户和 Hook 列表查看。

目前界面仍是毛坯：无完整个人中心、分页、正式账户状态导航和全面的无障碍测试。前端表单字段与后端结构化分类尚未全部打通。

### API

认证/资料：
- `POST /auth/send-email-code` 申请注册验证码。
- `POST /auth/register` 校验验证码并创建用户、资料和 Session。
- `POST /auth/login` 登录；`GET /auth/me` 获取当前用户。
- `PATCH /users/me/profile` 更新基础资料。
- 密码使用 Node `scrypt` 加盐哈希；Session Token 在数据库以 SHA-256 哈希保存，有效期 30 天。
- 验证码设计为 6 位、10 分钟有效、60 秒发送间隔，数据库保存哈希。

Hook/偏好：
- `POST /hooks` 创建 Hook，初始状态为 `WAITING_MATCH`。
- `GET /hooks/mine`、`GET /hooks/:id` 查看自己的 Hook。
- `PATCH /hooks/:id` 编辑未分配 Hook；`POST /hooks/:id/close` 关闭未分配 Hook。
- `GET /receiver-preferences/me`、`PATCH /receiver-preferences/me` 管理下一次偏好；更新会保留历史记录。
- Prisma 中 HookAssignment.hookId 唯一，约束 Hook 最多分配一次。

管理员：
- `POST /admin/login` 使用环境变量中的管理员凭据登录。
- `GET /admin/users`、`GET /admin/hooks` 要求管理员签名 Token，期限 8 小时。
- 列表各返回最近最多 200 条；用户列表不包含密码哈希或 Session Token。
- 当前只有查看功能，没有封禁、审核、删除、分页等管理操作。

### 数据与验证边界

Prisma Schema 包含 User、UserProfile、Session、EmailVerificationCode、ReceiverPreference、Hook、HookAssignment、HookReply、MatchAction、Report、Message。部分模型仅为后续业务预留。

最近一次开发中 Prisma Client 生成及 API、Web 构建通过。但构建通过不代表端到端测试已完成；此前数据库迁移因 PostgreSQL 未运行而失败，开始体验前需确认迁移全部应用。

## 后续待办

### P0：内测可靠性和安全

1. 启动 PostgreSQL 并确认所有迁移成功应用。
2. 端到端测试验证码发送/过期/错误、注册、重复注册、登录、资料、Hook 和偏好流程。
3. 验证码使用需要原子消费；增加错误尝试限制、每日发送限额和抗滥用保护。
4. 处理邮箱唯一约束并发错误；为登录和验证码接口限速。
5. 管理员登录增加限速、密钥轮换和更安全的部署策略；当前后台不可直接暴露公网。
6. 审查 CORS、输入大小、内容审核、错误信息和日志脱敏。

### P1：用户体验

1. 个人中心、资料编辑、退出登录和 Session 撤销。
2. 登录状态展示及受保护页面体验。
3. Hook 列表、详情、状态、编辑和关闭界面。
4. 接收偏好完整映射主题、回应方式、深度和排除项，去除硬编码。
5. 所有表单完善加载、空结果、错误恢复、校验和无障碍体验。

### P2：匹配与互动

1. 明确可解释匹配规则，优先本次意图、近期偏好、安全边界和公平性。
2. 使用事务保证 Hook 只能分配一次，并保证每日接收额度。
3. 超时或放弃后关闭 Hook，不转派给第二人。
4. 实现接收者查看、拒绝、回复；作者只查看唯一接收者回复。
5. 双方互相选择继续了解后再创建 Match 和开放私聊。
6. 为并发、重复请求和状态转换补充测试。

### P3：运营与治理

1. 举报、拉黑、内容审核、Hook 下架、账户封禁。
2. 管理操作审计日志、分页筛选、最小权限角色。
3. 数据导出、账户删除/注销和隐私流程。
4. 统计真实用户活动，不使用合成数据填充。

## 安全说明

`.env`、QQ 邮箱授权码、管理员密码、Token Secret 和真实用户数据不得提交 Git。邮箱、Hook 正文属于敏感数据。上线前应完成安全审查、数据备份/恢复演练和隐私政策准备。
