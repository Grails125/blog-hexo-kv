# 博客部署到 Cloudflare Pages

本项目使用 Hexo 生成静态博客,并通过 Cloudflare Pages 部署。

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
npm run server

# 生成静态文件
npm run build

# 清理缓存
npm run clean
```

## Cloudflare 部署步骤

### 1. 创建 KV 命名空间

在 Cloudflare Dashboard 中:

1. 进入 **Workers & Pages** > **KV**
2. 点击 **Create namespace**
3. 命名为 `BLOG_KV`
4. 复制命名空间 ID

### 2. 配置 wrangler.toml

将 `wrangler.toml` 中的 `your-kv-namespace-id` 替换为实际的 KV 命名空间 ID。

### 3. 部署到 Cloudflare Pages

#### 方式一: 通过 GitHub 自动部署

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 配置构建设置:
   - **构建命令**: `npm run build`
   - **输出目录**: `public`
5. 添加环境变量:
   - `NODE_VERSION`: `22`
6. 绑定 KV 命名空间:
   - 变量名: `BLOG_KV`
   - KV 命名空间: 选择之前创建的 `BLOG_KV`

#### 方式二: 使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署 Functions
wrangler deploy

# 部署 Pages
npm run build
wrangler pages deploy public
```

### 4. 更新配置

部署完成后,更新以下配置:

1. `_config.yml` 中的 `url` 为你的 Cloudflare Pages 域名
2. `wrangler.toml` 中的 `ALLOWED_ORIGINS` 为你的域名

## API 端点

部署后,以下 API 将可用:

- `GET /api/comments/:postId` - 获取文章评论
- `POST /api/comments/:postId` - 提交评论
- `GET /api/stats/:postId` - 获取访问统计
- `POST /api/stats/:postId` - 增加访问量
- `GET /api/likes/:postId` - 获取点赞数
- `POST /api/likes/:postId` - 点赞

## 自定义域名

在 Cloudflare Pages 设置中可以添加自定义域名。

## 注意事项

- KV 免费版有读写限制(每天 100,000 次读取,1,000 次写入)
- 建议为评论添加反垃圾机制
- 可以考虑添加评论审核功能
