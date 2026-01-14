/**
 * 文章详情页
 * GET /posts/[id] - 展示单篇文章
 */

export async function onRequestGet(context) {
  const { params, env } = context;
  const { id } = params;

  try {
    // 获取文章内容
    const post = await env.BLOG_KV.get(`post:${id}`, { type: "json" });

    if (!post || post.status !== "published") {
      return new Response(notFoundHTML, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 简单的 Markdown 渲染（替代 marked.js）
    const contentHTML = simpleMarkdownRender(post.content);

    const html = generatePostHTML(post, contentHTML);

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return new Response(errorHTML, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

// 简单的 Markdown 渲染
function simpleMarkdownRender(markdown) {
  let html = markdown
    // 代码块
    .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // 标题
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // 粗体和斜体
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // 行内代码
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // 引用
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    // 列表
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    // 段落
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  // 包装列表
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  // 包装段落
  html = "<p>" + html + "</p>";

  return html;
}

function generatePostHTML(post, contentHTML) {
  const date = new Date(post.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tagsHTML = (post.tags || [])
    .map((tag) => '<span class="tag">#' + tag + "</span>")
    .join("");

  const tagsSection = tagsHTML
    ? '<div class="tags">' + tagsHTML + "</div>"
    : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - 我的博客</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            line-height: 1.8;
            color: #333;
        }
        
        .nav {
            background: white;
            padding: 16px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .nav-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .nav-brand {
            font-size: 20px;
            font-weight: 700;
            color: #667eea;
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            gap: 24px;
        }
        
        .nav-links a {
            color: #666;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-links a:hover {
            color: #667eea;
        }
        
        .article {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            padding: 60px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        
        .article-header {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .article-title {
            font-size: 36px;
            font-weight: 700;
            color: #222;
            margin-bottom: 20px;
            line-height: 1.3;
        }
        
        .article-meta {
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 15px;
            color: #666;
            flex-wrap: wrap;
        }
        
        .category-badge {
            padding: 6px 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .tag {
            color: #667eea;
            font-size: 14px;
        }
        
        .article-content {
            font-size: 17px;
            line-height: 1.8;
        }
        
        .article-content h1,
        .article-content h2,
        .article-content h3 {
            margin-top: 32px;
            margin-bottom: 16px;
            color: #222;
            font-weight: 600;
        }
        
        .article-content h1 {
            font-size: 32px;
            padding-bottom: 12px;
            border-bottom: 2px solid #eee;
        }
        
        .article-content h2 {
            font-size: 26px;
        }
        
        .article-content h3 {
            font-size: 22px;
        }
        
        .article-content p {
            margin-bottom: 20px;
        }
        
        .article-content a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid #667eea;
        }
        
        .article-content a:hover {
            opacity: 0.8;
        }
        
        .article-content code {
            background: #f5f5f5;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 15px;
            color: #e83e8c;
        }
        
        .article-content pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 24px 0;
        }
        
        .article-content pre code {
            background: none;
            padding: 0;
            color: inherit;
            font-size: 14px;
        }
        
        .article-content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 24px 0;
            color: #666;
            font-style: italic;
        }
        
        .article-content ul,
        .article-content ol {
            margin: 20px 0;
            padding-left: 32px;
        }
        
        .article-content li {
            margin-bottom: 8px;
        }
        
        .article-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        @media (max-width: 768px) {
            .article {
                padding: 30px 20px;
                margin: 20px;
            }
            
            .article-title {
                font-size: 28px;
            }
            
            .article-content {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <nav class="nav">
        <div class="nav-container">
            <a href="/" class="nav-brand">📝 我的博客</a>
            <div class="nav-links">
                <a href="/posts">← 返回列表</a>
                <a href="/">首页</a>
            </div>
        </div>
    </nav>

    <article class="article">
        <header class="article-header">
            <h1 class="article-title">${post.title}</h1>
            <div class="article-meta">
                <span class="category-badge">${post.category || "未分类"}</span>
                <span>📅 ${date}</span>
                ${tagsSection}
            </div>
        </header>
        
        <div class="article-content">
            ${contentHTML}
        </div>
    </article>
</body>
</html>`;
}

const notFoundHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章不存在 - 我的博客</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f7fa;
            text-align: center;
        }
        .error {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
        }
        a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div>
        <div class="error">😕</div>
        <h1>文章不存在</h1>
        <p>您访问的文章不存在或已被删除</p>
        <a href="/posts">← 返回文章列表</a>
    </div>
</body>
</html>`;

const errorHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>加载失败 - 我的博客</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f7fa;
            text-align: center;
        }
        .error {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
        }
        a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div>
        <div class="error">❌</div>
        <h1>加载失败</h1>
        <p>服务器错误，请稍后重试</p>
        <a href="/posts">← 返回文章列表</a>
    </div>
</body>
</html>`;
