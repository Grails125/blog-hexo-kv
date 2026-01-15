/**
 * 单篇文章 API
 * GET /api/posts/[id] - 获取文章详情
 * PUT /api/posts/[id] - 更新文章
 * DELETE /api/posts/[id] - 删除文章
 */

import { verifyToken } from "../auth/login.js";

// 获取文章详情
export async function onRequestGet(context) {
  const { params, env } = context;
  const { id } = params;

  try {
    const post = await env.BLOG_KV.get(`post:${id}`, { type: "json" });

    if (!post) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "文章不存在",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

// 更新文章
export async function onRequestPut(context) {
  const { request, params, env } = context;
  const { id } = params;

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

    // 获取现有文章
    const existingPost = await env.BLOG_KV.get(`post:${id}`, { type: "json" });

    if (!existingPost) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "文章不存在",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 更新文章
    const updates = await request.json();
    const updatedPost = {
      ...existingPost,
      ...updates,
      id, // 保持 ID 不变
      createdAt: existingPost.createdAt, // 保持创建时间不变
      updatedAt: new Date().toISOString(),
    };

    // 保存更新
    await env.BLOG_KV.put(`post:${id}`, JSON.stringify(updatedPost));

    // 更新文章列表索引
    const postsListKey = "posts:list";
    const postsList =
      (await env.BLOG_KV.get(postsListKey, { type: "json" })) || [];
    const updatedList = postsList.map((post) =>
      post.id === id
        ? {
            id,
            title: updatedPost.title,
            category: updatedPost.category,
            tags: updatedPost.tags || [],
            status: updatedPost.status,
            createdAt: updatedPost.createdAt,
          }
        : post
    );
    await env.BLOG_KV.put(postsListKey, JSON.stringify(updatedList));

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedPost,
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

// 删除文章
export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const { id } = params;

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

    // 删除文章
    await env.BLOG_KV.delete(`post:${id}`);

    // 更新文章列表索引
    const postsListKey = "posts:list";
    const postsList =
      (await env.BLOG_KV.get(postsListKey, { type: "json" })) || [];
    const updatedList = postsList.filter((post) => post.id !== id);
    await env.BLOG_KV.put(postsListKey, JSON.stringify(updatedList));

    return new Response(
      JSON.stringify({
        success: true,
        message: "文章已删除",
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
