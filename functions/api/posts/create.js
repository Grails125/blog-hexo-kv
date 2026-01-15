/**
 * 文章管理 API
 * POST /api/posts/create - 创建文章
 */

import { verifyToken } from "../auth/login.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 验证管理员权限
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const isAdmin = await verifyToken(env, token);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "未授权",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { title, content, tags, category, cover, status } =
      await request.json();

    // 验证必填字段
    if (!title || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "标题和内容不能为空",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 生成文章 ID
    const postId = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 创建文章对象
    const post = {
      id: postId,
      title,
      content,
      tags: tags || [],
      category: category || "未分类",
      cover: cover || "",
      status: status || "draft", // draft 或 published
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 保存到 KV
    await env.BLOG_KV.put(`post:${postId}`, JSON.stringify(post));

    // 更新文章列表索引
    const postsListKey = "posts:list";
    const existingList =
      (await env.BLOG_KV.get(postsListKey, { type: "json" })) || [];
    existingList.unshift({
      id: postId,
      title,
      category,
      tags: tags || [],
      status,
      createdAt: post.createdAt,
    });
    await env.BLOG_KV.put(postsListKey, JSON.stringify(existingList));

    return new Response(
      JSON.stringify({
        success: true,
        data: post,
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
