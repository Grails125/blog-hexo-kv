/**
 * 文章列表 API
 * GET /api/posts/list - 获取文章列表
 */

import { verifyToken } from "../auth/login.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // published, draft, all

  try {
    // 检查是否是管理员（管理员可以看到草稿）
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const isAdmin = await verifyToken(env, token);

    // 获取文章列表
    const postsList =
      (await env.BLOG_KV.get("posts:list", { type: "json" })) || [];

    // 过滤文章
    let filteredPosts = postsList;

    if (!isAdmin) {
      // 非管理员只能看到已发布的文章
      filteredPosts = postsList.filter((post) => post.status === "published");
    } else if (status && status !== "all") {
      // 管理员可以按状态筛选
      filteredPosts = postsList.filter((post) => post.status === status);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredPosts,
        total: filteredPosts.length,
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
