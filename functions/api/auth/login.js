/**
 * 管理员认证 API
 * POST /api/auth/login - 登录
 */

// 简单的密码哈希（生产环境应使用更安全的方式）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();

    // 管理员密码（应该存储在环境变量中）
    const ADMIN_PASSWORD_HASH =
      env.ADMIN_PASSWORD_HASH ||
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // 默认: 空字符串

    const inputHash = await hashPassword(password);

    if (inputHash === ADMIN_PASSWORD_HASH) {
      // 生成简单的 token（生产环境应使用 JWT）
      const token = await hashPassword(password + Date.now());

      // 存储 token 到 KV（1小时过期）
      await env.BLOG_KV.put(`auth:${token}`, "admin", { expirationTtl: 3600 });

      return new Response(
        JSON.stringify({
          success: true,
          token,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "密码错误",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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

// 验证 token 的辅助函数
export async function verifyToken(env, token) {
  if (!token) return false;
  const role = await env.BLOG_KV.get(`auth:${token}`);
  return role === "admin";
}
