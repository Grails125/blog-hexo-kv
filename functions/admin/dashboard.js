/**
 * 文章管理面板
 * GET /admin/dashboard - 文章列表和管理
 */

const dashboardHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章管理 - 博客后台</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .header .user-info {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 30px auto;
            padding: 0 20px;
        }
        
        .toolbar {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #e0e0e0;
            color: #333;
            margin-left: 10px;
        }
        
        .btn-secondary:hover {
            background: #d0d0d0;
        }
        
        .btn-danger {
            background: #f44336;
            color: white;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .filter-tabs {
            display: flex;
            gap: 10px;
        }
        
        .filter-tab {
            padding: 8px 16px;
            background: #f5f5f5;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .filter-tab.active {
            background: #667eea;
            color: white;
        }
        
        .posts-list {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .post-item {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }
        
        .post-item:hover {
            background: #fafafa;
        }
        
        .post-item:last-child {
            border-bottom: none;
        }
        
        .post-info {
            flex: 1;
        }
        
        .post-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        
        .post-meta {
            font-size: 14px;
            color: #666;
        }
        
        .post-meta span {
            margin-right: 15px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-published {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status-draft {
            background: #fff3e0;
            color: #f57c00;
        }
        
        .post-actions {
            display: flex;
            gap: 8px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .empty {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        
        .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .logout-btn:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>📝 文章管理</h1>
                <div class="user-info">管理员已登录</div>
            </div>
            <button class="logout-btn" onclick="logout()">退出登录</button>
        </div>
    </div>
    
    <div class="container">
        <div class="toolbar">
            <div class="filter-tabs">
                <button class="filter-tab active" onclick="filterPosts('all')">全部</button>
                <button class="filter-tab" onclick="filterPosts('published')">已发布</button>
                <button class="filter-tab" onclick="filterPosts('draft')">草稿</button>
            </div>
            <button class="btn btn-primary" onclick="createPost()">
                ✏️ 写文章
            </button>
        </div>
        
        <div class="posts-list" id="postsList">
            <div class="loading">加载中...</div>
        </div>
    </div>

    <script>
        let currentFilter = 'all';
        let allPosts = [];
        
        // 检查登录状态
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = '/admin';
        }
        
        // 加载文章列表
        async function loadPosts() {
            try {
                const url = currentFilter === 'all' 
                    ? '/api/posts/list' 
                    : \`/api/posts/list?status=\${currentFilter}\`;
                    
                const response = await fetch(url, {
                    headers: {
                        'Authorization': \`Bearer \${token}\`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    allPosts = data.data;
                    renderPosts(allPosts);
                } else {
                    document.getElementById('postsList').innerHTML = 
                        '<div class="empty"><div class="empty-icon">❌</div><p>加载失败</p></div>';
                }
            } catch (error) {
                document.getElementById('postsList').innerHTML = 
                    '<div class="empty"><div class="empty-icon">❌</div><p>网络错误</p></div>';
            }
        }
        
        // 渲染文章列表
        function renderPosts(posts) {
            const listEl = document.getElementById('postsList');
            
            if (posts.length === 0) {
                listEl.innerHTML = \`
                    <div class="empty">
                        <div class="empty-icon">📝</div>
                        <p>还没有文章，点击"写文章"开始创作吧！</p>
                    </div>
                \`;
                return;
            }
            
            listEl.innerHTML = posts.map(post => \`
                <div class="post-item">
                    <div class="post-info">
                        <div class="post-title">\${post.title}</div>
                        <div class="post-meta">
                            <span class="status-badge status-\${post.status}">
                                \${post.status === 'published' ? '已发布' : '草稿'}
                            </span>
                            <span>📁 \${post.category || '未分类'}</span>
                            <span>🕒 \${new Date(post.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                    <div class="post-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editPost('\${post.id}')">
                            编辑
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletePost('\${post.id}', '\${post.title}')">
                            删除
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        // 筛选文章
        function filterPosts(filter) {
            currentFilter = filter;
            
            // 更新标签样式
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            loadPosts();
        }
        
        // 创建文章
        function createPost() {
            window.location.href = '/admin/editor';
        }
        
        // 编辑文章
        function editPost(id) {
            window.location.href = \`/admin/editor?id=\${id}\`;
        }
        
        // 删除文章
        async function deletePost(id, title) {
            if (!confirm(\`确定要删除文章《\${title}》吗？此操作不可恢复！\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/posts/\${id}\`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': \`Bearer \${token}\`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('删除成功！');
                    loadPosts();
                } else {
                    alert('删除失败：' + data.error);
                }
            } catch (error) {
                alert('网络错误');
            }
        }
        
        // 退出登录
        function logout() {
            if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin';
            }
        }
        
        // 页面加载时获取文章列表
        loadPosts();
    </script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(dashboardHTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
