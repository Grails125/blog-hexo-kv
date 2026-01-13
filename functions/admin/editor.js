/**
 * 文章编辑器
 * GET /admin/editor - Markdown 编辑器
 */

const editorHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章编辑器 - 博客后台</title>
    <!-- Marked.js for Markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 20px;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-save {
            background: white;
            color: #667eea;
        }
        
        .btn-publish {
            background: #4caf50;
            color: white;
        }
        
        .btn-back {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .editor-container {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .editor-pane, .preview-pane {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
            margin: 20px 10px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        
        .pane-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            font-weight: 600;
            color: #333;
        }
        
        .meta-inputs {
            padding: 20px;
            background: white;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .input-group:last-child {
            margin-bottom: 0;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            font-weight: 500;
            color: #555;
        }
        
        .input-group input,
        .input-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .input-group input:focus,
        .input-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        #title {
            font-size: 18px;
            font-weight: 600;
        }
        
        #content {
            flex: 1;
            padding: 20px;
            border: none;
            resize: none;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.6;
        }
        
        #content:focus {
            outline: none;
        }
        
        #preview {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            line-height: 1.8;
        }
        
        #preview h1, #preview h2, #preview h3 {
            margin-top: 24px;
            margin-bottom: 16px;
            color: #333;
        }
        
        #preview h1 { font-size: 32px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        #preview h2 { font-size: 24px; }
        #preview h3 { font-size: 20px; }
        
        #preview p {
            margin-bottom: 16px;
            color: #555;
        }
        
        #preview code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
        }
        
        #preview pre {
            background: #f5f5f5;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 16px;
        }
        
        #preview pre code {
            background: none;
            padding: 0;
        }
        
        #preview blockquote {
            border-left: 4px solid #667eea;
            padding-left: 16px;
            margin: 16px 0;
            color: #666;
        }
        
        #preview ul, #preview ol {
            margin-bottom: 16px;
            padding-left: 24px;
        }
        
        #preview li {
            margin-bottom: 8px;
        }
        
        .loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            z-index: 1000;
        }
        
        .loading.show {
            display: flex;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✏️ 文章编辑器</h1>
        <div class="header-actions">
            <button class="btn btn-back" onclick="goBack()">← 返回</button>
            <button class="btn btn-save" onclick="saveDraft()">💾 保存草稿</button>
            <button class="btn btn-publish" onclick="publish()">🚀 发布</button>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="editor-pane">
            <div class="pane-header">编辑</div>
            <div class="meta-inputs">
                <div class="input-group">
                    <label for="title">标题</label>
                    <input type="text" id="title" placeholder="输入文章标题">
                </div>
                <div class="input-group">
                    <label for="category">分类</label>
                    <input type="text" id="category" placeholder="例如：技术、生活">
                </div>
                <div class="input-group">
                    <label for="tags">标签（用逗号分隔）</label>
                    <input type="text" id="tags" placeholder="例如：JavaScript, React">
                </div>
            </div>
            <textarea id="content" placeholder="在这里使用 Markdown 编写文章内容...

# 一级标题
## 二级标题

**粗体文字**
*斜体文字*

- 列表项 1
- 列表项 2

\`代码\`

\`\`\`javascript
console.log('Hello World');
\`\`\`
"></textarea>
        </div>
        
        <div class="preview-pane">
            <div class="pane-header">预览</div>
            <div id="preview"></div>
        </div>
    </div>
    
    <div class="loading" id="loading">
        <div>保存中...</div>
    </div>

    <script>
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = '/admin';
        }
        
        let currentPostId = null;
        
        // 获取 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');
        
        // 如果是编辑模式，加载文章
        if (editId) {
            loadPost(editId);
        }
        
        // 加载文章
        async function loadPost(id) {
            try {
                const response = await fetch(\`/api/posts/\${id}\`);
                const data = await response.json();
                
                if (data.success) {
                    const post = data.data;
                    currentPostId = post.id;
                    document.getElementById('title').value = post.title;
                    document.getElementById('content').value = post.content;
                    document.getElementById('category').value = post.category || '';
                    document.getElementById('tags').value = (post.tags || []).join(', ');
                    updatePreview();
                }
            } catch (error) {
                alert('加载文章失败');
            }
        }
        
        // 实时预览
        const contentEl = document.getElementById('content');
        const previewEl = document.getElementById('preview');
        
        contentEl.addEventListener('input', updatePreview);
        
        function updatePreview() {
            const markdown = contentEl.value;
            previewEl.innerHTML = marked.parse(markdown);
        }
        
        // 保存草稿
        async function saveDraft() {
            await savePost('draft');
        }
        
        // 发布
        async function publish() {
            if (!confirm('确定要发布这篇文章吗？')) return;
            await savePost('published');
        }
        
        // 保存文章
        async function savePost(status) {
            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('content').value.trim();
            const category = document.getElementById('category').value.trim();
            const tagsInput = document.getElementById('tags').value.trim();
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
            
            if (!title) {
                alert('请输入标题');
                return;
            }
            
            if (!content) {
                alert('请输入内容');
                return;
            }
            
            document.getElementById('loading').classList.add('show');
            
            try {
                const url = currentPostId 
                    ? \`/api/posts/\${currentPostId}\`
                    : '/api/posts/create';
                    
                const method = currentPostId ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: JSON.stringify({
                        title,
                        content,
                        category,
                        tags,
                        status
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert(status === 'draft' ? '草稿保存成功！' : '发布成功！');
                    if (!currentPostId) {
                        currentPostId = data.data.id;
                    }
                    window.location.href = '/admin/dashboard';
                } else {
                    alert('保存失败：' + data.error);
                }
            } catch (error) {
                alert('网络错误');
            } finally {
                document.getElementById('loading').classList.remove('show');
            }
        }
        
        // 返回
        function goBack() {
            if (confirm('确定要返回吗？未保存的内容将丢失。')) {
                window.location.href = '/admin/dashboard';
            }
        }
        
        // 初始化预览
        updatePreview();
    </script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(editorHTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
