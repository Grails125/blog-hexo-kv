/**
 * 从 R2 下载 Markdown 文件到 source/_posts
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function downloadPosts() {
  console.log("📥 Downloading posts from R2...");

  try {
    // 列出所有文章
    const listCommand = new ListObjectsV2Command({
      Bucket: "blog-content",
      Prefix: "posts/",
    });

    const { Contents } = await client.send(listCommand);

    if (!Contents || Contents.length === 0) {
      console.log("ℹ️  No posts found in R2");
      return;
    }

    // 确保目标目录存在
    const targetDir = path.join(__dirname, "..", "source", "_posts");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 下载每个文件
    let downloaded = 0;
    for (const item of Contents) {
      if (!item.Key.endsWith(".md")) {
        continue; // 只下载 Markdown 文件
      }

      const getCommand = new GetObjectCommand({
        Bucket: "blog-content",
        Key: item.Key,
      });

      const response = await client.send(getCommand);
      const content = await response.Body.transformToString();

      const filename = path.basename(item.Key);
      const targetPath = path.join(targetDir, filename);

      fs.writeFileSync(targetPath, content, "utf-8");
      console.log(`✅ Downloaded: ${filename}`);
      downloaded++;
    }

    console.log(`📦 Total: ${downloaded} posts downloaded from R2`);
  } catch (error) {
    console.error("❌ Error downloading from R2:", error.message);
    // 不要让构建失败,即使 R2 下载失败也继续
    console.log("⚠️  Continuing build without R2 posts...");
  }
}

downloadPosts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(0); // 不要失败,继续构建
});
