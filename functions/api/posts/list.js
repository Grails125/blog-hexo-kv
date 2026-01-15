/**
 * 文章列表 API - 从 R2 读取
 * GET /api/posts/list
 */

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 检查管理员权限
    const authHeader = request.headers.get("Authorization");
    let isAdmin = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const role = await env.BLOG_KV.get(`auth:${token}`);
      isAdmin = role === "admin";
    }

    // 列出 R2 中的所有文章
    const list = await env.BLOG_R2.list({ prefix: "posts/" });

    const posts = [];
    for (const item of list.objects) {
      if (!item.key.endsWith(".md")) {
        continue;
      }

      // 从 customMetadata 获取信息
      const obj = await env.BLOG_R2.head(item.key);
      const metadata = obj.customMetadata || {};

      posts.push({
        filename: item.key,
        title: metadata.title || "Untitled",
        status: metadata.status || "published",
        createdAt: metadata.createdAt || item.uploaded.toISOString(),
        size: item.size,
      });
    }

    // 按创建时间倒序排序
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 非管理员只能看到已发布的文章
    const filteredPosts = isAdmin
      ? posts
      : posts.filter((p) => p.status === "published");

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredPosts,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing posts:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
