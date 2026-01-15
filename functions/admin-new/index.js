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
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
      body {
        font-family: "Inter", sans-serif;
      }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-900 h-screen flex overflow-hidden">
    <div id="app" class="flex w-full h-full">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm"
      >
        <div class="p-6 border-b border-slate-100">
          <h1
            class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            博客管理后台
          </h1>
        </div>

        <div class="p-4 flex-1 overflow-y-auto">
          <div class="mb-6">
            <h2
              class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
            >
              常用操作
            </h2>
            <a
              href="/admin-new/editor"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3 shadow-sm"
            >
              <svg
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              撰写新文章
            </a>
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
        <div
          v-if="message"
          :class="\`mb-6 p-4 rounded-lg flex items-center gap-2 \${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}\`"
        >
          <span>{{ message }}</span>
          <button @click="message = ''" class="ml-auto hover:opacity-75">
            ×
          </button>
        </div>

        <!-- Posts Grid -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <!-- Create New Card -->
          <a
            href="/admin-new/editor"
            class="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500 cursor-pointer group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mb-2 group-hover:scale-110 transition-transform"
            >
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
            <div
              class="p-5 flex-1 cursor-pointer"
              @click="editPost(post.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <div
                  class="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg"
                >
                  📝
                </div>
                <span
                  v-if="post.category"
                  class="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full"
                >
                  {{ post.category }}
                </span>
              </div>
              <h3
                class="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2"
              >
                {{ post.title }}
              </h3>

              <div class="space-y-2">
                <p
                  class="text-xs text-slate-400 font-mono flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {{ formatDate(post.createdAt) }}
                </p>
                <div class="flex items-center gap-2">
                  <span
                    :class="\`text-xs px-2 py-0.5 rounded-full \${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`"
                  >
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

          const getToken = () => localStorage.getItem("admin_token");

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
