/**
 * 管理后台首页 - 文章列表
 * GET /admin-new - 新版管理后台
 */

const adminHTML = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>博客管理后台</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Solitude 主题配色 */
      :root {
        --primary: #425AEF;
        --primary-hover: #3b4fd9;
        --success: #10b981;
        --warning: #f59e0b;
        --danger: #ef4444;
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --border: #e2e8f0;
      }
      
      body {
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        background: var(--bg);
        color: var(--text-primary);
      }
      
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-900 h-screen flex overflow-hidden">
    <div id="app" class="flex w-full h-full">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div class="p-6 border-b border-slate-100">
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            博客管理后台
          </h1>
        </div>

        <div class="p-4 flex-1 overflow-y-auto">
          <div class="mb-6">
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              常用操作
            </h2>
            <a
              href="/admin-new/editor"
              style="background: #425AEF;" class="w-full hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-3 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              撰写新文章
            </a>
            <button
              @click="triggerRebuild"
              :disabled="rebuilding"
              style="background: #10b981;" class="w-full hover:opacity-90 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-3 shadow-sm"
            >
              <svg v-if="!rebuilding" xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
              </svg><svg
                v-else
                class="animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span v-if="rebuilding">构建中...</span>
              <span v-else>重新构建</span>
            </button>
            <button
              @click="logout"
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-slate-50 p-8 overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-slate-800">文章列表</h2>
          <div class="text-sm text-slate-500">共 {{ posts.length }} 篇文章</div>
        </div>

        <!-- Messages -->
        <div v-if="message" :class="\`mb-6 p-4 rounded-lg flex items-center gap-2 \${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}\`">
          <span>{{ message }}</span>
          <button @click="message = ''" class="ml-auto hover:opacity-75">×</button>
        </div>

        <!-- Posts Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <!-- Create New Card -->
          <a href="/admin-new/editor" class="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500 cursor-pointer group">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 group-hover:scale-110 transition-transform">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span class="font-medium">新建文章</span>
          </a>

          <!-- Post Card -->
          <div
            v-for="post in posts"
            :key="post.id"
            class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
          >
            <!-- 封面图片 -->
            <div v-if="post.cover" class="w-full h-40 overflow-hidden bg-slate-100">
              <img :src="post.cover" :alt="post.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            
            <div class="p-5 flex-1 cursor-pointer" @click="editPost(post.id)">
              <div class="flex items-start justify-between mb-2">
                <div class="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  📝
                </div>
                <!-- 分类标签 -->
                <span
                  v-if="post.category"
                  class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium"
                >
                  {{ post.category }}
                </span>
              </div>
              
              <h3 class="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
                {{ post.title }}
              </h3>

              <div class="space-y-2">
                <!-- 发布时间 -->
                <p class="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {{ formatDate(post.createdAt) }}
                </p>
                
                <!-- 标签 -->
                <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in post.tags.slice(0, 3)"
                    :key="tag"
                    class="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded"
                  >
                    #{{ tag }}
                  </span>
                  <span v-if="post.tags.length > 3" class="text-xs text-slate-400">
                    +{{ post.tags.length - 3 }}
                  </span>
                </div>
                
                <!-- 状态 -->
                <div class="flex items-center gap-2">
                  <span :class="\`text-xs px-2 py-0.5 rounded-full \${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`">
                    {{ post.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="p-3 border-t border-slate-100 flex gap-2">
              <button
                @click.stop="deletePost(post.id, post.title)"
                class="flex-1 text-xs text-red-600 hover:bg-red-50 py-2 rounded transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <script>
      const { createApp, ref, onMounted } = Vue;

      createApp({
        setup() {
          const posts = ref([]);
          const message = ref("");
          const messageType = ref("success");
          const rebuilding = ref(false);

          const getToken = () => localStorage.getItem("admin_token");

          const triggerRebuild = async () => {
            if (rebuilding.value) return;
            
            if (!confirm('确定要触发重新构建吗?\\n\\n构建过程约需 2-5 分钟,构建完成后新发布的文章将显示在网站上。')) {
              return;
            }

            rebuilding.value = true;
            message.value = "正在触发构建...";
            messageType.value = "success";

            try {
              const res = await fetch("/api/rebuild", {
                method: "POST",
                headers: {
                  Authorization: \`Bearer \${getToken()}\`,
                },
              });
              const data = await res.json();
              
              if (data.success) {
                message.value = "构建已触发!预计 2-5 分钟后生效";
                messageType.value = "success";
              } else {
                message.value = "触发失败: " + (data.error || "未知错误");
                messageType.value = "error";
              }
            } catch (e) {
              message.value = "触发失败: " + e.message;
              messageType.value = "error";
            } finally {
              rebuilding.value = false;
            }
          };

          const fetchPosts = async () => {
            try {
              const res = await fetch("/api/posts/list", {
                headers: {
                  Authorization: \`Bearer \${getToken()}\`,
                },
              });
              const data = await res.json();
              if (data.success) {
                posts.value = data.data;
              }
            } catch (e) {
              console.error(e);
              message.value = "加载文章失败";
              messageType.value = "error";
            }
          };

          const editPost = (id) => {
            window.location.href = \`/admin-new/editor?id=\${id}\`;
          };

          const deletePost = async (id, title) => {
            if (!confirm(\`确定要删除文章《\${title}》吗?此操作不可恢复!\`)) {
              return;
            }

            try {
              const res = await fetch(\`/api/posts/\${id}\`, {
                method: "DELETE",
                headers: {
                  Authorization: \`Bearer \${getToken()}\`,
                },
              });
              const data = await res.json();
              if (data.success) {
                message.value = "删除成功";
                messageType.value = "success";
                fetchPosts();
              } else {
                message.value = "删除失败: " + data.error;
                messageType.value = "error";
              }
            } catch (e) {
              message.value = "删除失败: " + e.message;
              messageType.value = "error";
            }
          };

          const logout = () => {
            localStorage.removeItem("admin_token");
            window.location.href = "/admin";
          };

          const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const date = new Date(dateStr);
            return date.toLocaleDateString("zh-CN");
          };

          onMounted(() => {
            // 检查登录状态
            if (!getToken()) {
              window.location.href = "/admin";
              return;
            }
            fetchPosts();
          });

          return {
            posts,
            message,
            messageType,
            rebuilding,
            triggerRebuild,
            editPost,
            deletePost,
            logout,
            formatDate,
          };
        },
      }).mount("#app");
    </script>
  </body>
</html>
`;

export async function onRequestGet() {
  return new Response(adminHTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
