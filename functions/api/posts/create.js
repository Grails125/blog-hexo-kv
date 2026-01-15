/**
 * 文章创建 API - 保存为 Markdown 到 R2
 * POST /api/posts/create
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 验证管理员权限
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const role = await env.BLOG_KV.get(`auth:${token}`);
    if (role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "权限不足" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 解析请求数据
    const postData = await request.json();
    const {
      title,
      content,
      tags = [],
      category,
      cover,
      status = "draft",
    } = postData;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ success: false, error: "标题和内容不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 生成文件名(使用标题的拼音或英文)
    const timestamp = Date.now();
    const filename = `${slugify(title)}-${timestamp}.md`;

    // 生成 Markdown 内容(使用用户提供的格式)
    const now = new Date();
    const dateStr = formatDate(now);

    const markdown = `---
title: ${title}
date: ${dateStr}
categories: [${category || "未分类"}]
tags: [${tags.join(", ")}]
${cover ? `cover: ${cover}` : ""}
---

${content}`;

    // 保存到 R2
    await env.BLOG_R2.put(`posts/${filename}`, markdown, {
      httpMetadata: {
        contentType: "text/markdown; charset=utf-8",
      },
      customMetadata: {
        title,
        status,
        createdAt: now.toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          filename,
          title,
          status,
          message: "文章已保存到 R2,等待下次构建后生效",
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 将标题转换为 URL 友好的 slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // 空格转为连字符
    .replace(/[^\w\-\u4e00-\u9fa5]+/g, "") // 移除非字母数字和中文字符
    .replace(/\-\-+/g, "-") // 多个连字符转为单个
    .replace(/^-+/, "") // 移除开头的连字符
    .replace(/-+$/, ""); // 移除结尾的连字符
}

/**
 * 格式化日期为 Hexo 格式
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
