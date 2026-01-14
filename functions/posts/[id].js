/**
 * 动态文章详情页
 * GET /posts/[id] - 展示 KV 中的文章
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

    // 简单的 Markdown 渲染
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
    .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
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
    <link rel="stylesheet" href="/css/index.css">
    <link rel="stylesheet" href="/css/var.css">
    <style>
        body {
            background: var(--efu-background, #f5f7fa);
        }
        
        .article-container {
            max-width: 900px;
            margin: 80px auto 60px;
            padding: 0 20px;
        }
        
        .article-card {
            background: var(--efu-card-bg, white);
            border-radius: 12px;
            padding: 60px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        
        .article-header {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid var(--efu-border-color, #f0f0f0);
        }
        
        .article-title {
            font-size: 36px;
            font-weight: 700;
            color: var(--efu-text-color, #222);
            margin-bottom: 20px;
            line-height: 1.3;
        }
        
        .article-meta {
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 15px;
            color: var(--efu-secondtext, #666);
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
            color: var(--efu-theme, #667eea);
            font-size: 14px;
        }
        
        .article-content {
            font-size: 17px;
            line-height: 1.8;
            color: var(--efu-text-color, #333);
        }
        
        .article-content h1,
        .article-content h2,
        .article-content h3 {
            margin-top: 32px;
            margin-bottom: 16px;
            color: var(--efu-text-color, #222);
            font-weight: 600;
        }
        
        .article-content h1 { font-size: 32px; }
        .article-content h2 { font-size: 26px; }
        .article-content h3 { font-size: 22px; }
        
        .article-content p {
            margin-bottom: 20px;
        }
        
        .article-content a {
            color: var(--efu-theme, #667eea);
            text-decoration: none;
            border-bottom: 1px solid var(--efu-theme, #667eea);
        }
        
        .article-content code {
            background: var(--efu-code-bg, #f5f5f5);
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
        }
        
        .article-content blockquote {
            border-left: 4px solid var(--efu-theme, #667eea);
            padding-left: 20px;
            margin: 24px 0;
            color: var(--efu-secondtext, #666);
            font-style: italic;
        }
        
        .article-content ul,
        .article-content ol {
            margin: 20px 0;
            padding-left: 32px;
        }
        
        .article-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: var(--efu-theme, #667eea);
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .article-card {
                padding: 30px 20px;
            }
            .article-title {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="article-container">
        <a href="/archives" class="back-link">← 返回归档</a>
        <article class="article-card">
            <header class="article-header">
                <h1 class="article-title">${post.title}</h1>
                <div class="article-meta">
                    <span class="category-badge">${
                      post.category || "未分类"
                    }</span>
                    <span>📅 ${date}</span>
                    ${tagsSection}
                </div>
            </header>
            
            <div class="article-content">
                ${contentHTML}
            </div>
        </article>
    </div>
</body>
</html>`;
}

const notFoundHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章不存在</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f7fa;
            text-align: center;
        }
        .error { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 32px; color: #333; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 30px; }
        a { color: #667eea; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div>
        <div class="error">😕</div>
        <h1>文章不存在</h1>
        <p>您访问的文章不存在或已被删除</p>
        <a href="/archives">← 返回归档</a>
    </div>
</body>
</html>`;

const errorHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>加载失败</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f7fa;
            text-align: center;
        }
        .error { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 32px; color: #333; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 30px; }
        a { color: #667eea; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div>
        <div class="error">❌</div>
        <h1>加载失败</h1>
        <p>服务器错误，请稍后重试</p>
        <a href="/archives">← 返回归档</a>
    </div>
</body>
</html>`;
