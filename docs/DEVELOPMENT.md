# 开发指南

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Grails125/blog-hexo-kv.git
cd blog-hexo-kv
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件,配置必要的环境变量
# 主要配置:
# - R2存储(如需从R2同步文章)
# - 管理员密码哈希
```

### 4. 启动开发

```bash
# 启动博客预览(包含草稿)
npm run dev

# 或启动本地管理后台
npm run admin:dev
```

访问:

- 博客: http://localhost:4000
- 管理后台: http://localhost:3000

---

## 开发流程

### 新建文章

**方式一: 命令行**

```bash
npm run new "文章标题"
```

**方式二: 管理后台**

1. 访问 http://localhost:3000
2. 登录
3. 点击"撰写新文章"

### 编辑文章

文章位于 `source/_posts/` 目录,直接编辑`.md`文件或使用管理后台编辑器。

### 预览

```bash
# 预览已发布文章
npm run server

# 预览包含草稿
npm run dev
```

### 构建

```bash
# 完整构建(含R2同步)
npm run build

# 仅Hexo构建
hexo generate

# 清理缓存
npm run clean
```

---

## 常用命令

### 开发命令

| 命令                | 说明               |
| ------------------- | ------------------ |
| `npm run dev`       | 开发服务器(含草稿) |
| `npm run server`    | 预览服务器         |
| `npm run admin:dev` | 管理后台(自动重启) |
| `npm run preview`   | 构建后预览         |

### 内容命令

| 命令                    | 说明     |
| ----------------------- | -------- |
| `npm run new`           | 新建文章 |
| `npm run publish`       | 发布草稿 |
| `hexo new draft "标题"` | 新建草稿 |

### 构建命令

| 命令                  | 说明         |
| --------------------- | ------------ |
| `npm run build`       | 完整构建     |
| `npm run clean`       | 清理缓存     |
| `npm run download-r2` | 从R2下载文章 |

### 质量命令

| 命令             | 说明       |
| ---------------- | ---------- |
| `npm run lint`   | 代码检查   |
| `npm run format` | 代码格式化 |

---

## 项目规范

### 代码风格

- 使用Prettier自动格式化
- 遵循ESLint规则
- 提交前运行 `npm run format`

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 文件命名

- 文章文件: `标题-时间戳.md`
- 图片文件: 使用ASCII字符,避免中文

---

## 常见任务

### 添加新文章

```bash
# 1. 创建文章
npm run new "我的新文章"

# 2. 编辑 source/_posts/我的新文章.md

# 3. 预览
npm run dev

# 4. 构建
npm run build
```

### 修改主题配置

编辑 `_config.solitude.yml`

### 添加新页面

```bash
hexo new page "关于"
# 编辑 source/about/index.md
```

---

## 调试技巧

### 查看生成的HTML

```bash
npm run build
# 查看 public/ 目录
```

### 清理缓存

```bash
npm run clean
rm -rf db.json
```

### 本地测试Functions

```bash
# 使用wrangler
npx wrangler pages dev public
```

---

## 常见问题

### Q: 文章不显示?

A: 检查front-matter的`date`字段,确保不是未来日期。

### Q: 样式异常?

A: 清理缓存 `npm run clean && npm run build`

### Q: 图片不显示?

A: 确保图片路径正确,建议使用绝对路径 `/img/xxx.png`

### Q: 管理后台无法登录?

A: 检查 `.env` 中的 `ADMIN_PASSWORD_HASH` 配置

---

## 资源链接

- [Hexo文档](https://hexo.io/zh-cn/docs/)
- [Solitude主题文档](https://docs.solitude.js.org/)
- [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions文档](https://developers.cloudflare.com/pages/functions/)
