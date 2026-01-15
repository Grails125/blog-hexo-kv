/**
 * 全局中间件 - 处理 CORS、错误和注入 KV 文章
 */

async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // CORS 预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGINS || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    // 继续处理请求
    const response = await next();

    // 添加 CORS 头
    const newResponse = new Response(response.body, response);
    newResponse.headers.set(
      "Access-Control-Allow-Origin",
      env.ALLOWED_ORIGINS || "*"
    );
    newResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    // 检查是否需要注入 KV 文章
    const contentType = newResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      return newResponse;
    }

    const shouldInject =
      url.pathname === "/" ||
      url.pathname === "/index.html" ||
      url.pathname.startsWith("/tags/") ||
      url.pathname.startsWith("/categories/");

    if (!shouldInject) {
      return newResponse;
    }

    // 注入 KV 文章
    return await injectKVPosts(newResponse, env, url);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGINS || "*",
      },
    });
  }
}

/**
 * 注入 KV 文章到页面
 */
async function injectKVPosts(response, env, url) {
  try {
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

    // 根据不同页面类型注入文章
    if (url.pathname === "/" || url.pathname === "/index.html") {
      html = injectToHomePage(html, publishedPosts);
    } else if (url.pathname.startsWith("/tags/")) {
      html = injectToTagPage(html, publishedPosts, url);
    } else if (url.pathname.startsWith("/categories/")) {
      html = injectToCategoryPage(html, publishedPosts, url);
    }

    return new Response(html, {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Error injecting KV posts:", error);
    return response;
  }
}

/**
 * 注入文章到首页
 */
function injectToHomePage(html, posts) {
  const insertMarker = '<div class="recent-posts">';
  const insertIndex = html.indexOf(insertMarker);

  if (insertIndex === -1) {
    return html;
  }

  const dynamicPostsHTML = generateHomePostsHTML(posts);
  const before = html.substring(0, insertIndex + insertMarker.length);
  const after = html.substring(insertIndex + insertMarker.length);

  return before + dynamicPostsHTML + after;
}

/**
 * 注入文章到标签页面
 */
function injectToTagPage(html, posts, url) {
  const tagMatch = url.pathname.match(/\/tags\/([^\/]+)\//);
  if (!tagMatch) return html;

  const tagName = decodeURIComponent(tagMatch[1]);
  const taggedPosts = posts.filter(
    (post) => post.tags && post.tags.includes(tagName)
  );

  if (taggedPosts.length === 0) {
    return html;
  }

  return injectToArchivePage(html, taggedPosts);
}

/**
 * 注入文章到分类页面
 */
function injectToCategoryPage(html, posts, url) {
  const categoryMatch = url.pathname.match(/\/categories\/([^\/]+)\//);
  if (!categoryMatch) return html;

  const categoryName = decodeURIComponent(categoryMatch[1]);
  const categoryPosts = posts.filter((post) => post.category === categoryName);

  if (categoryPosts.length === 0) {
    return html;
  }

  return injectToArchivePage(html, categoryPosts);
}

/**
 * 注入文章到归档样式的页面
 */
function injectToArchivePage(html, posts) {
  const insertMarker = '<div class="article-sort">';
  const insertIndex = html.indexOf(insertMarker);

  if (insertIndex === -1) {
    return html;
  }

  const dynamicPostsHTML = generateArchivePostsHTML(posts);
  const before = html.substring(0, insertIndex);
  const after = html.substring(insertIndex);

  return before + dynamicPostsHTML + after;
}

/**
 * 生成首页文章卡片 HTML
 */
function generateHomePostsHTML(posts) {
  return posts
    .map((post) => {
      const date = new Date(post.createdAt);
      const formattedDate = date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const tagsHTML = (post.tags || [])
        .slice(0, 3)
        .map((tag) => {
          const encodedTag = encodeURIComponent(tag);
          return `<a href="/tags/${encodedTag}/">${tag}</a>`;
        })
        .join("");

      const coverImage = post.cover
        ? `<img class="post_bg" src="${post.cover}" alt="${post.title}">`
        : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 64px;">📝</div>`;

      return `
        <div class="recent-post-item">
          <a class="post_cover left" href="/posts/${post.id}" title="${
        post.title
      }">
            ${coverImage}
          </a>
          <div class="recent-post-info">
            <a class="article-title" href="/posts/${post.id}" title="${
        post.title
      }">
              <span class="article-title-text">${post.title}</span>
            </a>
            <div class="article-meta-wrap">
              <span class="post-meta-date">
                <i class="solitude fas fa-calendar-check"></i>
                <span class="article-meta-label">发表于</span>
                <time datetime="${
                  post.createdAt
                }" title="发表于 ${formattedDate}">${formattedDate}</time>
              </span>
              ${
                post.category
                  ? `<span class="article-meta-categories">
                <i class="solitude fas fa-folder-open"></i>
                <span class="article-meta-label">分类于</span>
                <a class="article-meta__categories" href="/categories/${encodeURIComponent(
                  post.category
                )}/">${post.category}</a>
              </span>`
                  : ""
              }
            </div>
            ${
              tagsHTML
                ? `<div class="article-meta-tags">
              <i class="solitude fas fa-tags"></i>
              <span class="article-meta-label">标签:</span>
              ${tagsHTML}
            </div>`
                : ""
            }
            <div class="content">
              ${post.content.substring(0, 150).replace(/<[^>]*>/g, "")}...
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * 生成归档页面文章列表 HTML
 */
function generateArchivePostsHTML(posts) {
  const postsByYear = {};
  posts.forEach((post) => {
    const year = new Date(post.createdAt).getFullYear();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  let html = '<div class="article-sort dynamic-posts-section">';
  const years = Object.keys(postsByYear).sort((a, b) => b - a);

  years.forEach((year) => {
    html += `<div class="article-sort-item year">${year}</div>`;

    postsByYear[year].forEach((post) => {
      const tagsHTML = (post.tags || [])
        .map((tag) => {
          const encodedTag = encodeURIComponent(tag);
          return `<a class="article-meta__tags" href="/tags/${encodedTag}/" onclick="window.event.cancelBubble=true;">
          <span class="tags-punctuation">
            <i class="solitude fas fa-hashtag"></i>${tag}
          </span>
        </a>`;
        })
        .join("");

      const coverContent = post.cover
        ? `<img src="${post.cover}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<div style="width: 100%; height: 100%; background: #ffc848; display: flex; align-items: center; justify-content: center; font-size: 48px;">📝</div>`;

      html += `
        <div class="article-sort-item">
          <a class="article-sort-item-img" href="/posts/${post.id}" title="${post.title}">
            ${coverContent}
          </a>
          <div class="article-sort-item-info">
            <a class="article-sort-item-title" href="/posts/${post.id}" title="${post.title}" onclick="window.event.cancelBubble=true;">
              ${post.title}
            </a>
            <div class="article-sort-item-tags">
              ${tagsHTML}
            </div>
          </div>
        </div>
      `;
    });
  });

  html += "</div>";
  return html;
}

export { onRequest };
