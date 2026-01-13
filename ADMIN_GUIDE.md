# 博客管理系统使用指南

## 🎯 系统概述

已为你的博客添加了在线管理功能，管理员可以直接在网页上创建和发布文章。

## 📋 已创建的文件

### API 接口

- `functions/api/auth/login.js` - 管理员登录认证
- `functions/api/posts/create.js` - 创建文章
- `functions/api/posts/list.js` - 文章列表
- `functions/api/posts/[id].js` - 文章详情/更新/删除

### 管理后台

- `functions/admin/index.html` - 登录页面

## 🔐 设置管理员密码

### 方法 1: 使用默认密码（临时）

默认密码为空字符串（直接点登录即可）

### 方法 2: 设置自定义密码（推荐）

1. 生成密码哈希值：

```bash
# 在浏览器控制台运行
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 替换 'your-password' 为你的密码
hashPassword('your-password').then(console.log);
```

2. 在 Cloudflare Pages 设置中添加环境变量：
   - 进入 **Settings** → **Environment variables**
   - 添加变量：
     - Name: `ADMIN_PASSWORD_HASH`
     - Value: 上一步生成的哈希值

## 🚀 使用方法

### 访问管理后台

```
https://你的域名/admin/
```

### API 端点

#### 1. 登录

```bash
POST /api/auth/login
Content-Type: application/json

{
  "password": "your-password"
}

# 返回
{
  "success": true,
  "token": "..."
}
```

#### 2. 创建文章

```bash
POST /api/posts/create
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "文章标题",
  "content": "文章内容（Markdown）",
  "tags": ["标签1", "标签2"],
  "category": "分类",
  "status": "published"  // 或 "draft"
}
```

#### 3. 获取文章列表

```bash
GET /api/posts/list?status=published
Authorization: Bearer YOUR_TOKEN
```

#### 4. 获取文章详情

```bash
GET /api/posts/{id}
```

#### 5. 更新文章

```bash
PUT /api/posts/{id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "新标题",
  "status": "published"
}
```

#### 6. 删除文章

```bash
DELETE /api/posts/{id}
Authorization: Bearer YOUR_TOKEN
```

## 📝 下一步

需要创建的文件：

1. `functions/admin/dashboard.html` - 文章管理面板
2. `functions/admin/editor.html` - Markdown 编辑器
3. 前台展示页面（从 KV 读取文章）

## 🔒 安全建议

1. **立即设置强密码**
2. 使用 HTTPS（Cloudflare Pages 默认提供）
3. 定期更换管理员密码
4. 不要在公共场所登录

## 📊 数据存储

所有文章数据存储在 Cloudflare KV 中：

- `post:{id}` - 文章详情
- `posts:list` - 文章列表索引
- `auth:{token}` - 认证 token（1 小时过期）

## 🎨 待完成功能

- [ ] 文章管理面板
- [ ] Markdown 编辑器
- [ ] 图片上传
- [ ] 文章分类管理
- [ ] 标签管理
- [ ] 前台动态展示

是否需要我继续创建管理面板和编辑器页面？
