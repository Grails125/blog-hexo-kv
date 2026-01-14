# 博客系统使用指南

## 🎉 恭喜！你的博客系统已完成

你现在拥有一个功能完整的博客管理系统，包含后台管理和前台展示。

## 📋 系统功能

### 后台管理系统

1. **管理员登录** (`/admin`)

   - 安全的密码认证
   - Token 会话管理

2. **文章管理面板** (`/admin/dashboard`)

   - 查看所有文章
   - 按状态筛选（全部/已发布/草稿）
   - 编辑和删除文章

3. **Markdown 编辑器** (`/admin/editor`)
   - EasyMDE 编辑器
   - 实时预览
   - 自动保存
   - 保存草稿/发布

### 前台展示系统

1. **文章列表** (`/posts`)

   - 展示所有已发布文章
   - 卡片式布局
   - 响应式设计

2. **文章详情** (`/posts/[id]`)
   - Markdown 渲染
   - 美观的排版
   - 代码高亮

## 🚀 快速开始

### 1. 访问博客

- **前台文章列表**: `https://blog-hexo-kv.pages.dev/posts`
- **管理后台**: `https://blog-hexo-kv.pages.dev/admin`

### 2. 登录管理后台

1. 访问 `/admin`
2. 输入管理员密码
3. 自动跳转到管理面板

### 3. 创建第一篇文章

1. 在管理面板点击"写文章"
2. 填写标题、分类、标签
3. 使用 Markdown 编写内容
4. 点击"发布"

### 4. 查看文章

1. 访问 `/posts` 查看文章列表
2. 点击文章卡片查看详情

## 📝 Markdown 语法示例

```markdown
# 一级标题

## 二级标题

**粗体文字** _斜体文字_

- 列表项 1
- 列表项 2

[链接文字](https://example.com)

\`\`\`javascript
console.log('Hello World');
\`\`\`

> 引用文字
```

## 🔐 安全设置

### 修改管理员密码

1. 访问 `/admin/hash-tool`
2. 输入新密码，点击"生成哈希"
3. 复制哈希值
4. 在 Cloudflare Pages 设置中更新环境变量 `ADMIN_PASSWORD_HASH`
5. 重新部署

## 🎨 自定义配置

### 修改博客标题

编辑前台页面中的标题文字：

- `functions/posts/index.js` - 文章列表页
- `functions/posts/[id].js` - 文章详情页

### 修改主题颜色

在各个页面的 `<style>` 标签中修改颜色值：

- 主色调：`#667eea` 和 `#764ba2`

## 📊 数据存储

所有数据存储在 Cloudflare KV 中：

- `post:{id}` - 文章详情
- `posts:list` - 文章列表索引
- `auth:{token}` - 认证 token

## 🔧 API 端点

### 认证

- `POST /api/auth/login` - 登录

### 文章管理

- `POST /api/posts/create` - 创建文章
- `GET /api/posts/list` - 获取文章列表
- `GET /api/posts/{id}` - 获取文章详情
- `PUT /api/posts/{id}` - 更新文章
- `DELETE /api/posts/{id}` - 删除文章

## 🎯 下一步可以做的

- [ ] 添加文章搜索功能
- [ ] 集成图床服务
- [ ] 添加评论系统
- [ ] 数据导出/导入
- [ ] RSS 订阅
- [ ] 文章分类页面
- [ ] 标签页面

## 💡 提示

1. **定期备份**: 定期导出 KV 数据作为备份
2. **密码安全**: 使用强密码并定期更换
3. **内容审核**: 发布前仔细检查内容
4. **性能优化**: KV 有读写限制，注意使用频率

## 🐛 常见问题

### Q: 登录后无法访问管理面板？

A: 检查浏览器是否支持 localStorage，清除浏览器缓存后重试。

### Q: 文章保存失败？

A: 检查 KV 绑定是否正确，查看 Cloudflare Pages 部署日志。

### Q: 前台看不到文章？

A: 确保文章状态为 "published"，检查 API 是否正常返回数据。

## 📞 获取帮助

如有问题，请检查：

1. Cloudflare Pages 部署日志
2. 浏览器控制台错误信息
3. KV 命名空间绑定是否正确

---

**祝你使用愉快！** 🎊
