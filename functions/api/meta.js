/**
 * 文章元数据 API
 * GET /api/meta - 获取分类和标签列表
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取文章列表
    const postsList =
      (await env.BLOG_KV.get("posts:list", { type: "json" })) || [];

    // 提取所有分类和标签
    const categoriesSet = new Set();
    const tagsSet = new Set();

    postsList.forEach((post) => {
      if (post.category) {
        categoriesSet.add(post.category);
      }
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    const categories = Array.from(categoriesSet).sort();
    const tags = Array.from(tagsSet).sort();

    return new Response(
      JSON.stringify({
        success: true,
        categories,
        tags,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
