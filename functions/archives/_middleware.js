/**
 * Archives 页面中间件
 * 拦截 /archives/ 请求，注入 KV 中的动态文章
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 只处理 /archives/ 页面
  if (!url.pathname.startsWith("/archives")) {
    return next();
  }

  try {
    // 获取原始 Hexo 生成的页面
    const response = await next();

    // 如果不是 HTML 页面，直接返回
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      return response;
    }

    // 获取 KV 中的文章列表
    const kvPosts =
      (await env.BLOG_KV.get("posts:list", { type: "json" })) || [];
    const publishedPosts = kvPosts.filter(
      (post) => post.status === "published"
    );

    if (publishedPosts.length === 0) {
      return response;
    }

    // 读取原始 HTML
    let html = await response.text();

    // 生成动态文章的 HTML
    const dynamicPostsHTML = generateDynamicPostsHTML(publishedPosts);

    // 注入到页面中（在文章列表容器之后）
    // Solitude 主题使用特定的类名，我们需要找到合适的插入点
    const insertPoint = html.indexOf('<div class="article-sort">');

    if (insertPoint !== -1) {
      // 在文章列表开始处插入
      const beforeInsert = html.substring(0, insertPoint);
      const afterInsert = html.substring(insertPoint);

      html =
        beforeInsert +
        '<div class="dynamic-posts-section">' +
        '<h2 class="dynamic-posts-title">📝 动态文章</h2>' +
        dynamicPostsHTML +
        "</div>" +
        afterInsert;
    }

    return new Response(html, {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Error injecting dynamic posts:", error);
    return next();
  }
}

function generateDynamicPostsHTML(posts) {
  return `
    <div class="article-sort">
      ${posts
        .map((post) => {
          const date = new Date(post.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");

          return `
          <div class="article-sort-item">
            <div class="article-sort-item-time">
              <time datetime="${post.createdAt}" title="${post.createdAt}">
                ${month}-${day}
              </time>
            </div>
            <div class="article-sort-item-title">
              <a href="/posts/${post.id}" title="${post.title}">
                ${post.title}
              </a>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
    <style>
      .dynamic-posts-section {
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 2px dashed #e0e0e0;
      }
      .dynamic-posts-title {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #667eea;
      }
    </style>
  `;
}
