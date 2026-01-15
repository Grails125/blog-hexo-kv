const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const multer = require("multer");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
// Serve the static files (compiled editor) or just the static dir
app.use(express.static(path.join(__dirname, "static")));

const POSTS_DIR = path.join(__dirname, "../source/_posts");
const DB_PATH = path.join(__dirname, "../db.json");
const IMG_DIR = path.join(__dirname, "../source/img");

// Ensure image directory exists
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

// Multer config for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMG_DIR);
  },
  filename: function (req, file, cb) {
    // Keep original extension, timestamp to avoid conflict
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage: storage });

// Helper: Format Date to Beijing Time (UTC+8) YYYY-MM-DD HH:mm:ss
const formatBeijingDate = () => {
  const d = new Date();
  // Offset UTC+8
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utc + 3600000 * 8);

  // Manual formatting to ensure YYYY-MM-DD HH:mm:ss
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${beijingTime.getFullYear()}-${pad(beijingTime.getMonth() + 1)}-${pad(
    beijingTime.getDate()
  )} ${pad(beijingTime.getHours())}:${pad(beijingTime.getMinutes())}:${pad(
    beijingTime.getSeconds()
  )}`;
};

// API: List Posts
app.get("/api/posts", (req, res) => {
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read posts" });
    const posts = files
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ filename: f }));
    res.json(posts);
  });
});

// API: Get Single Post
app.get("/api/posts/:filename", (req, res) => {
  const filepath = path.join(POSTS_DIR, req.params.filename);
  if (!fs.existsSync(filepath))
    return res.status(404).json({ error: "Post not found" });

  fs.readFile(filepath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Read failed" });

    // Simple front-matter parser
    const parts = data.split("---");
    if (parts.length < 3)
      if (parts.length < 3)
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

    const fm = parts[1];
    const content = parts.slice(2).join("---").trim();

    // Extract basic fields
    const titleMatch = fm.match(/title:\s*(.*)/);
    const dateMatch = fm.match(/date:\s*(.*)/);
    const tagsMatch = fm.match(/tags:\s*\[?(.*?)\]?$/m);
    const categoryMatch = fm.match(/categories:\s*\[?(.*?)\]?$/m); // Solitude uses categories
    const coverMatch = fm.match(/cover:\s*(.*)/);

    res.json({
      success: true,
      data: {
        id: req.params.filename, // Use filename as ID local
        title: titleMatch ? titleMatch[1].trim() : "",
        date: dateMatch ? dateMatch[1].trim() : "",
        tags: tagsMatch ? tagsMatch[1].split(",").map((s) => s.trim()) : [],
        category: categoryMatch
          ? categoryMatch[1].split(",").map((s) => s.trim())[0]
          : "", // Usually one category
        cover: coverMatch ? coverMatch[1].trim() : "",
        content: content,
      },
    });
  });
});

// API: Create/Update Post
app.post("/api/posts", (req, res) => {
  // Determine title, filename, content, tags, category, cover
  const { title, content, tags, category, cover, filename } = req.body; // filename if updating

  if (!title) return res.status(400).json({ error: "标题不能为空" });

  const dateStr = formatBeijingDate();
  // If filename exists, keep it. Else generate.
  let safeFilename = filename;
  if (!safeFilename) {
    safeFilename = title
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-")
      .toLowerCase();
    if (!safeFilename.endsWith(".md")) safeFilename += ".md";
  }

  const filePath = path.join(POSTS_DIR, safeFilename);

  // Construct Front Matter
  let fileContent = `---
title: ${title}
date: ${dateStr}
`;
  if (category) fileContent += `categories: [${category}]\n`; // Solitude typically uses array
  if (tags && tags.length) fileContent += `tags: [${tags.join(", ")}]\n`;
  if (cover) fileContent += `cover: ${cover}\n`;

  fileContent += `---\n\n${content || ""}`;

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "保存失败" });
    }
    res.json({
      success: true,
      data: { id: safeFilename },
      message: "文章已保存",
    });
  });
});

// API: Upload Image
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // Return path relative to hexo source (e.g. /img/filename)
  res.json({
    success: true,
    url: `/img/${req.file.filename}`,
  });
});

// API: Get Categories/Tags (Read from db.json if exists)
app.get("/api/meta", (req, res) => {
  if (fs.existsSync(DB_PATH)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      const categories = db.models.Category.map((c) => c.name);
      const tags = db.models.Tag.map((t) => t.name);
      return res.json({ success: true, categories, tags });
    } catch (e) {
      console.error("Error reading db.json", e);
    }
  }
  // Fallback: empty or scan files (scanning is expenisve, skip for now)
  res.json({ success: true, categories: [], tags: [] });
});

// API: Publish (Hexo generate)
app.post("/api/publish", (req, res) => {
  console.log("Running hexo generate...");
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

// Serve the admin UI specifically at /admin if navigating directly
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

// API: Mock KV Save for Categories (No-op usually for static, but we can log)
app.post("/api/kv/categories", (req, res) => {
  // In a real KV scenario, we would put this.
  // For local static blog, categories are derived from posts.
  // We just return success to satisfy the frontend requirement.
  console.log("KV Save Request (Mock):", req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}`);
});
