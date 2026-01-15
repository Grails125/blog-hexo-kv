/**
 * 文章详情 API - 从 R2 读取 Markdown 文件
 * GET /api/posts/[id] - 获取文章详情
 * PUT /api/posts/[id] - 更新文章
 * DELETE /api/posts/[id] - 删除文章
 */

/**
 * GET - 获取文章详情
 */
export async function onRequestGet(context) {
  const { params, env } = context;
  const { id } = params;

  try {
    // 从 R2 读取文章
    const filename = `posts/${id}.md`;
    const object = await env.BLOG_R2.get(filename);

    if (!object) {
      return new Response(
        JSON.stringify({ success: false, error: "文章不存在" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const content = await object.text();
    const metadata = parseFrontMatter(content);
    const markdownContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id,
          filename,
          title: metadata.title || "",
          content: markdownContent,
          category: metadata.category || metadata.categories?.[0] || "",
          tags: metadata.tags || [],
          cover: metadata.cover || "",
          status: metadata.status || "published",
          createdAt: metadata.date || object.uploaded.toISOString(),
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting post:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * PUT - 更新文章
 */
export async function onRequestPut(context) {
  const { params, env, request } = context;
  const { id } = params;

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

    const postData = await request.json();
    const {
      title,
      content,
      tags = [],
      category,
      cover,
      status = "published",
    } = postData;

    // 生成新的 Markdown 内容
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

    // 更新 R2 文件
    const filename = `posts/${id}.md`;
    await env.BLOG_R2.put(filename, markdown, {
      httpMetadata: {
        contentType: "text/markdown; charset=utf-8",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "文章已更新",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating post:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * DELETE - 删除文章
 */
export async function onRequestDelete(context) {
  const { params, env, request } = context;
  const { id } = params;

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

    // 删除 R2 文件
    const filename = `posts/${id}.md`;
    await env.BLOG_R2.delete(filename);

    return new Response(
      JSON.stringify({
        success: true,
        message: "文章已删除",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 解析 Markdown Front Matter
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return {};
  }

  const frontMatter = match[1];
  const metadata = {};
  const lines = frontMatter.split("\n");
  let currentKey = null;
  let arrayValues = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("-")) {
      const value = trimmed.substring(1).trim();
      arrayValues.push(value);
      continue;
    }

    if (currentKey && arrayValues.length > 0) {
      metadata[currentKey] = arrayValues;
      arrayValues = [];
      currentKey = null;
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();

      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .substring(1, value.length - 1)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        metadata[key] = value;
      } else if (value) {
        metadata[key] = value;
      } else {
        currentKey = key;
      }
    }
  }

  if (currentKey && arrayValues.length > 0) {
    metadata[currentKey] = arrayValues;
  }

  return metadata;
}

/**
 * 格式化日期
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
