const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const multer = require("multer");

const app = express();
const PORT = 3000;

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());

// Serve static files
const STATIC_DIR = path.join(__dirname, "static");
console.log(`[STARTUP] Serving static files from: ${STATIC_DIR}`);
app.use(express.static(STATIC_DIR));

const POSTS_DIR = path.resolve(__dirname, "../source/_posts");
const DB_PATH = path.resolve(__dirname, "../db.json");
const IMG_DIR = path.resolve(__dirname, "../source/img");

console.log(`[STARTUP] POSTS_DIR: ${POSTS_DIR}`);
console.log(`[STARTUP] DB_PATH: ${DB_PATH}`);
console.log(`[STARTUP] IMG_DIR: ${IMG_DIR}`);

// Serve images from source/img
console.log(`[STARTUP] Serving images from: ${IMG_DIR}`);
app.use("/img", express.static(IMG_DIR));

// Ensure image directory exists
if (!fs.existsSync(IMG_DIR)) {
  console.log(`[STARTUP] Creating IMG_DIR...`);
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMG_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Use timestamp + random number to ensure ASCII-only specific filename
    const name = `upload-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    cb(null, `${name}${ext}`);
  },
});
const upload = multer({ storage: storage });

const formatBeijingDate = () => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utc + 3600000 * 8);
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${beijingTime.getFullYear()}-${pad(beijingTime.getMonth() + 1)}-${pad(
    beijingTime.getDate()
  )} ${pad(beijingTime.getHours())}:${pad(beijingTime.getMinutes())}:${pad(
    beijingTime.getSeconds()
  )}`;
};

app.get("/api/posts", (req, res) => {
  console.log("[API] Check permissions for POSTS_DIR:", POSTS_DIR);
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) {
      console.error("[API] Error reading POSTS_DIR:", err);
      return res
        .status(500)
        .json({ error: "Failed to read posts", details: err.message });
    }

    const posts = files
      .filter((f) => f.endsWith(".md"))
      .map((filename) => {
        const filepath = path.join(POSTS_DIR, filename);
        let title = filename.replace(".md", "");
        let date = "";
        let category = "";
        let tags = [];
        let cover = "";

        try {
          const content = fs.readFileSync(filepath, "utf8");
          const parts = content.split("---");
          if (parts.length >= 3) {
            const fm = parts[1];
            const titleMatch = fm.match(/title:\s*(.*)/);
            const dateMatch = fm.match(/date:\s*(.*)/);
            const tagsMatch = fm.match(/tags:\s*\[?(.*?)\]?$/m);
            const categoryMatch = fm.match(/categories:\s*\[?(.*?)\]?$/m);
            const coverMatch = fm.match(/cover:\s*(.*)/);

            if (titleMatch) title = titleMatch[1].trim();
            if (dateMatch) date = dateMatch[1].trim();
            if (tagsMatch) tags = tagsMatch[1].split(",").map((s) => s.trim());
            if (categoryMatch)
              category = categoryMatch[1].split(",").map((s) => s.trim());
            if (coverMatch) cover = coverMatch[1].trim();
          }
        } catch (e) {
          console.error(`[API] Error reading meta for ${filename}:`, e);
        }

        return {
          filename,
          title,
          date,
          categories: Array.isArray(category)
            ? category
            : category
            ? [category]
            : [], // Normalize to array
          tags,
          cover,
        };
      });

    // Sort by date desc
    posts.sort((a, b) => (a.date < b.date ? 1 : -1));

    console.log(`[API] Found ${posts.length} posts.`);
    res.json(posts);
  });
});

app.get("/api/posts/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = path.join(POSTS_DIR, filename);

  console.log(`[API] Fetching post: ${filename}`);
  console.log(`[API] Resolved path: ${filepath}`);

  if (!fs.existsSync(filepath)) {
    console.error(`[API] File not found: ${filepath}`);
    return res.status(404).json({ error: "Post not found" });
  }

  fs.readFile(filepath, "utf8", (err, data) => {
    if (err) {
      console.error(`[API] Read error: ${err.message}`);
      return res.status(500).json({ error: "Read failed" });
    }

    const parts = data.split("---");
    if (parts.length < 3) {
      console.log(
        `[API] Malformed front-matter for ${filename}, returning default.`
      );
      return res.json({
        success: true,
        data: {
          id: req.params.filename,
          title: path.basename(req.params.filename, ".md"),
          date: "",
          tags: [],
          category: "",
          cover: "",
          content: data,
        },
      });
    }

    const fm = parts[1];
    const content = parts.slice(2).join("---").trim();

    const titleMatch = fm.match(/title:\s*(.*)/);
    const dateMatch = fm.match(/date:\s*(.*)/);
    const tagsMatch = fm.match(/tags:\s*\[?(.*?)\]?$/m);
    const categoryMatch = fm.match(/categories:\s*\[?(.*?)\]?$/m);
    const coverMatch = fm.match(/cover:\s*(.*)/);

    res.json({
      success: true,
      data: {
        id: req.params.filename,
        title: titleMatch ? titleMatch[1].trim() : "",
        date: dateMatch ? dateMatch[1].trim() : "",
        tags: tagsMatch ? tagsMatch[1].split(",").map((s) => s.trim()) : [],
        category: categoryMatch
          ? categoryMatch[1].split(",").map((s) => s.trim())[0]
          : "",
        cover: coverMatch ? coverMatch[1].trim() : "",
        content: content,
      },
    });
  });
});

app.post("/api/posts", (req, res) => {
  const { title, content, tags, category, cover, filename } = req.body;
  console.log("[API] Saving post:", title);

  if (!title) return res.status(400).json({ error: "标题不能为空" });

  const dateStr = formatBeijingDate();
  let safeFilename = filename;
  if (!safeFilename) {
    safeFilename = title
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-")
      .toLowerCase();
    if (!safeFilename.endsWith(".md")) safeFilename += ".md";
  }

  const filePath = path.join(POSTS_DIR, safeFilename);
  console.log("[API] Writing to:", filePath);

  let fileContent = `---
title: ${title}
date: ${dateStr}
`;
  if (category) fileContent += `categories: [${category}]\n`;
  if (tags && tags.length) fileContent += `tags: [${tags.join(", ")}]\n`;
  if (cover) fileContent += `cover: ${cover}\n`;

  fileContent += `---\n\n${content || ""}`;

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      console.error("[API] Write failed:", err);
      return res.status(500).json({ error: "保存失败" });
    }
    console.log("[API] Save success.");
    res.json({
      success: true,
      data: { id: safeFilename },
      message: "文章已保存",
    });
  });
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  console.log("[API] Uploaded:", req.file.path);
  res.json({
    success: true,
    url: `/img/${req.file.filename}`,
  });
});

app.get("/api/meta", (req, res) => {
  console.log("[API] Reading meta from:", DB_PATH);
  if (fs.existsSync(DB_PATH)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      const categories = db.models.Category.map((c) => c.name);
      const tags = db.models.Tag.map((t) => t.name);
      return res.json({ success: true, categories, tags });
    } catch (e) {
      console.error("[API] Error reading db.json", e);
    }
  } else {
    console.log("[API] db.json does not exist.");
  }
  res.json({ success: true, categories: [], tags: [] });
});

app.post("/api/publish", (req, res) => {
  console.log("[API] Running hexo generate...");
  exec(
    "npx hexo generate",
    { cwd: path.join(__dirname, "..") },
    (err, stdout, stderr) => {
      if (err)
        return res.status(500).json({ error: "Build failed", details: stderr });
      res.json({ success: true, output: stdout });
    }
  );
});

app.get("/admin", (req, res) => {
  const indexHtml = path.join(__dirname, "static/index.html");
  console.log("[API] Serving index.html from:", indexHtml);
  res.sendFile(indexHtml);
});

app.post("/api/kv/categories", (req, res) => {
  console.log("[API] KV Save Request (Mock):", req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Admin server v2 running at http://localhost:${PORT}`);
});
