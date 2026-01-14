/**
 * 前台文章列表页面
 * GET /posts - 展示所有已发布的文章
 */

const postsPageHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章列表 - 我的博客</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 42px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1000px;
            margin: -40px auto 60px;
            padding: 0 20px;
        }
        
        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 30px;
        }
        
        .post-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
        }
        
        .post-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        
        .post-card-body {
            padding: 24px;
        }
        
        .post-title {
            font-size: 22px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .post-excerpt {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 16px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .post-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 14px;
            color: #999;
            padding-top: 16px;
            border-top: 1px solid #f0f0f0;
        }
        
        .post-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .category-badge {
            display: inline-block;
            padding: 4px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .loading {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .empty {
            text-align: center;
            padding: 80px 20px;
            color: #999;
        }
        
        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .nav {
            background: white;
            padding: 16px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            margin-bottom: 40px;
        }
        
        .nav-container {
            max-width: 1000px;
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
    </style>
</head>
<body>
    <nav class="nav">
        <div class="nav-container">
            <a href="/" class="nav-brand">📝 我的博客</a>
            <div class="nav-links">
                <a href="/posts">文章</a>
                <a href="/">首页</a>
                <a href="/admin">管理</a>
            </div>
        </div>
    </nav>

    <div class="header">
        <h1>📚 文章列表</h1>
        <p>分享技术与生活</p>
    </div>
    
    <div class="container">
        <div class="posts-grid" id="postsGrid">
            <div class="loading">加载中...</div>
        </div>
    </div>

    <script>
        // 加载文章列表
        async function loadPosts() {
            try {
                const response = await fetch('/api/posts/list?status=published');
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    renderPosts(data.data);
                } else {
                    document.getElementById('postsGrid').innerHTML = \`
                        <div class="empty">
                            <div class="empty-icon">📝</div>
                            <p>还没有发布的文章</p>
                        </div>
                    \`;
                }
            } catch (error) {
                document.getElementById('postsGrid').innerHTML = \`
                    <div class="empty">
                        <div class="empty-icon">❌</div>
                        <p>加载失败，请稍后重试</p>
                    </div>
                \`;
            }
        }
        
        // 渲染文章列表
        function renderPosts(posts) {
            const grid = document.getElementById('postsGrid');
            
            grid.innerHTML = posts.map(post => {
                const date = new Date(post.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                return \`
                    <div class="post-card" onclick="viewPost('\${post.id}')">
                        <div class="post-card-body">
                            <h2 class="post-title">\${post.title}</h2>
                            <div class="post-meta">
                                <span class="category-badge">\${post.category || '未分类'}</span>
                                <span>📅 \${date}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // 查看文章详情
        function viewPost(id) {
            window.location.href = \`/posts/\${id}\`;
        }
        
        // 页面加载时获取文章
        loadPosts();
    </script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(postsPageHTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
