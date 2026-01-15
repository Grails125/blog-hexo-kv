/**
 * 管理员登录页面
 * GET /admin - 登录入口
 */

const loginHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理员登录</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 h-screen flex items-center justify-center">
  <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
        博客管理后台
      </h1>
      <p class="text-slate-500">请登录以继续</p>
    </div>
    
    <div id="error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"></div>
    
    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">管理员密码</label>
        <input
          type="password"
          id="password"
          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="请输入密码"
          required
        />
      </div>
      <button
        type="submit"
        id="loginBtn"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors"
      >
        登录
      </button>
    </form>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      errorDiv.classList.add('hidden');
      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: passwordInput.value }),
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('admin_token', data.token);
          window.location.href = '/admin-new';
        } else {
          errorDiv.textContent = data.error || '登录失败';
          errorDiv.classList.remove('hidden');
        }
      } catch (e) {
        errorDiv.textContent = '网络错误: ' + e.message;
        errorDiv.classList.remove('hidden');
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
      }
    });

    // 检查是否已登录
    if (localStorage.getItem('admin_token')) {
      window.location.href = '/admin-new';
    }
  </script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(loginHTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
