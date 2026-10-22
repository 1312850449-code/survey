# 国核设备廉江项目 - 质量问题反馈直通车

一个长期质量问题收集系统，包含**员工端**（公开问卷）和**管理端**（登录查看 + 已读标记）。

## ✨ 功能特性

### 员工端 `/`
- 打开网页即可填写，无需登录
- 三个字段：时间与地点（必填）、问题具体内容（必填）、联系电话（选填）
- 提交后显示成功提示，支持继续提交

### 管理端 `/admin`
- 邮箱密码登录（Supabase Auth）
- 以"时间与地点"为标题逐条呈现所有提交
- 点击任意一条展开详情（三字段完整内容 + 提交时间）
- 自动记录查看行为：
  - 每条数据显示 **已查看 / 未查看** 状态
  - 显示 **有多少位管理员查看过**
  - 显示 **查看过的管理员用户名** 和 **查看时间**
- 个人角度显示"我已查看 / 未查看"

---

## 🏗️ 技术架构

```
员工浏览器 ──POST──▶ /api/submit ──▶ Supabase.submissions
                                         │
管理浏览器 ──登录──▶ Supabase Auth        │
    │                                    │
    └─GET /admin ──▶ Supabase.submissions ◀──┘
    │                      + Supabase.view_records
    └─POST /api/view ─▶ Supabase.view_records (upsert)
```

- **前端框架**：Next.js 14 App Router + TypeScript + Tailwind CSS
- **后端服务**：Supabase（PostgreSQL + Auth）
- **部署平台**：Vercel（代码托管 GitHub）
- **国内加速**：阿里云 DNS + CDN

---

## 📦 项目结构

```
survey/
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── next.config.js               # Next.js 配置
├── tailwind.config.ts           # Tailwind 配置
├── postcss.config.js            # PostCSS 配置
├── .env.local.example           # 环境变量模板
├── .gitignore
│
├── supabase/
│   └── init.sql                 # ⭐ Supabase 数据库初始化脚本
│
├── src/
│   ├── middleware.ts            # 管理端路由保护 + Session 刷新
│   ├── globals.css              # 全局样式
│   │
│   ├── lib/
│   │   └── supabase.ts          # Supabase 客户端工具函数
│   │
│   ├── components/
│   │   ├── SurveyForm.tsx       # 员工端问卷表单
│   │   ├── AdminLogin.tsx       # 管理员登录组件
│   │   └── AdminDashboard.tsx   # 管理端数据查看组件
│   │
│   └── app/
│       ├── layout.tsx           # 根布局
│       ├── page.tsx             # /  员工端问卷页面
│       │
│       ├── admin/
│       │   ├── page.tsx         # /admin 管理后台
│       │   └── login/
│       │       └── page.tsx     # /admin/login 登录页
│       │
│       └── api/
│           ├── submit/route.ts  # POST /api/submit  问卷提交接口
│           ├── view/route.ts    # POST /api/view    查看记录接口
│           └── logout/route.ts  # POST /api/logout  登出接口
```

---

## 🚀 第一步：Supabase 项目配置

### 1. 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)，使用 GitHub 账号登录
2. 点击 **New Project**，填写：
   - Name：`quality-feedback`（或任意名称）
   - Database Password：**请务必保存这个密码**
   - Region：建议选 `East Asia (Tokyo)` 离中国较近
3. 等待约 2 分钟，项目就绪

### 2. 初始化数据库
1. 在 Supabase Dashboard 左侧菜单点击 **SQL Editor**
2. 点击 **New Query**
3. 打开项目中的 `supabase/init.sql` 文件，**全部复制粘贴**到 SQL Editor
4. 点击 **Run**（▶️ 按钮）
5. 看到 ✅ "Success. No rows returned" 表示执行成功

### 3. 创建管理员账户
1. 左侧菜单点击 **Authentication → Users**
2. 点击 **Add user**
3. 填写：
   - Email：`admin@yourcompany.com`（管理员邮箱）
   - Password：设置一个强密码
   - ✅ 勾选 **Create user**
4. 点击 **Create user**

### 4. 获取环境变量
1. 左侧菜单点击 **Project Settings → API**
2. 复制以下三个值：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（**不要泄露！**）

### 5. 关闭邮件确认（开发测试用）
1. **Authentication → Providers → Email**
2. 把 **Confirm email** 开关关掉（或保持开启，看你需求）
3. 如果你没开邮件确认，管理员用户会直接可以登录

---

## 🛠️ 第二步：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件
cp .env.local.example .env.local
# 然后编辑 .env.local，填入刚才复制的三个值

# 3. 启动开发服务器
npm run dev
```

访问：
- 员工端：`http://localhost:3000`
- 管理端：`http://localhost:3000/admin`

---

## 📤 第三步：上传 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "feat: quality feedback system initial commit"

# 在 GitHub 创建一个新仓库（比如 quality-feedback），然后：
git remote add origin https://github.com/你的用户名/quality-feedback.git
git branch -M main
git push -u origin main
```

---

## 🌐 第四步：部署 Vercel

1. 访问 [https://vercel.com](https://vercel.com)，使用 GitHub 账号登录
2. 点击 **Add New → Project**
3. 选择刚才推送的 GitHub 仓库，点击 **Import**
4. 配置项目：
   - Framework Preset：**Next.js**（Vercel 会自动识别）
   - Build Command：`next build`（默认即可）
   - Output Directory：`.next`（默认即可）
5. **⭐ 重要：添加环境变量**（在 Environment Variables 区域）：
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1Ni...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1Ni...
   ```
   > 注意：`NEXT_PUBLIC_` 开头的会暴露在客户端代码中，不要把 service_role key 命名错了！
6. 点击 **Deploy**
7. 等待部署完成（约 30 秒），会分配一个 `xxx.vercel.app` 域名

---

## 🇨🇳 第五步：阿里云配置国内访问

> Vercel 默认域名 `xxx.vercel.app` 在中国大陆访问速度慢甚至可能被干扰。建议绑定国内域名 + 阿里云 CDN。

### 方案 A：阿里云 DNS 解析（基础方案）

1. **购买一个国内域名**（阿里云/腾讯云均可，需实名认证）
   - 例如：`feedback.yourdomain.com`

2. **在 Vercel 绑定域名**
   - Vercel Dashboard → 你的项目 → **Settings → Domains**
   - 输入你的域名（如 `feedback.yourdomain.com`），点击 **Add**
   - Vercel 会告诉你需要设置哪些 DNS 记录

3. **阿里云 DNS 配置**
   - 登录阿里云 → **云解析 DNS**
   - 找到你的域名 → **解析设置**
   - 添加 Vercel 要求的 CNAME 记录：
     | 记录类型 | 主机记录 | 记录值 |
     |---------|---------|--------|
     | CNAME   | feedback | cname.vercel-dns.com |
   - 等待 DNS 生效（通常几分钟到几小时）

4. **Vercel 验证**
   - 回到 Vercel Domains 页面，域名旁边的状态变成 ✅ Verified
   - Vercel 会自动为你申请 Let's Encrypt 免费 HTTPS 证书

### 方案 B：阿里云 CDN 加速（推荐，性能更好）

如果你希望国内用户访问更快：

1. 先完成 **方案 A** 的域名绑定
2. 开通阿里云 **CDN**（内容分发网络）
3. 添加加速域名：`feedback.yourdomain.com`
4. 回源地址填：Vercel 分配的 `xxx.vercel.app`
5. 阿里云会自动给你一个 CNAME 地址（如 `feedback.yourdomain.com.w.kunlungr.com`）
6. 在阿里云 DNS 中把之前的 CNAME 改成这个 CDN 的地址
7. HTTPS 证书：
   - 阿里云 CDN 控制台 → 域名管理 → 证书管理
   - 申请免费 SSL 证书，绑定加速域名
   - 开启 **强制 HTTPS 跳转**

### 最终访问地址

- **员工端**：`https://feedback.yourdomain.com`
- **管理端**：`https://feedback.yourdomain.com/admin`

---

## 🔐 安全说明

| 数据表 | 匿名用户 | 管理员（已登录） |
|--------|---------|----------------|
| submissions | ✅ INSERT（提交） | ✅ INSERT + SELECT |
| view_records | ❌ 无权限 | ✅ INSERT + SELECT |

- Supabase RLS 策略已在 `init.sql` 中配置好
- 员工端只能提交，无法查看任何数据
- 管理端必须邮箱密码登录才能访问
- Service Role Key **只在服务端使用**，不要放到前端代码

---

## 📝 日常运维

### 添加新的管理员
1. Supabase Dashboard → **Authentication → Users**
2. **Add user**，填写邮箱密码即可

### 查看原始数据
Supabase Dashboard → **Table Editor** → 选择 `submissions` 或 `view_records` 表

### 修改字段/表结构
在 Supabase SQL Editor 中执行 SQL 即可，例如加字段：
```sql
ALTER TABLE public.submissions ADD COLUMN attachment_url TEXT;
```

### 导出数据
Supabase Dashboard → **Table Editor** → 对应表 → **Export** 按钮

---

## 🐛 常见问题

**Q: 员工端提交报 "保存失败"**
- 检查 `.env.local` 里的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
- 打开 Supabase → **Database → Tables → submissions**，确认表存在
- 打开 **SQL Editor**，运行 `SELECT * FROM public.submissions;` 看是否有数据

**Q: 管理员登录后看不到数据**
- 确认管理员用户是在 Supabase **Authentication → Users** 中创建的
- 检查用户是否存在（SQL: `SELECT * FROM auth.users;`）

**Q: Vercel 部署后页面 500 错误**
- 到 Vercel 项目 → **Logs** 看具体报错
- 99% 是环境变量没配好，回去检查 Environment Variables

**Q: 国内访问不了 vercel.app 域名**
- Vercel 默认域名在部分地区可能被干扰，请务必绑定国内域名 + CDN

---

## 📞 技术支持

| 组件 | 官方文档 |
|-----|---------|
| Next.js | https://nextjs.org/docs |
| Supabase | https://supabase.com/docs |
| Vercel | https://vercel.com/docs |
| 阿里云 CDN | https://help.aliyun.com/product/27099.html |
