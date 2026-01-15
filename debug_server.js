const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3001; // Different port to avoid conflict

app.use(cors());
app.use(bodyParser.json());

const POSTS_DIR = path.join(__dirname, "source/_posts");
const DB_PATH = path.join(__dirname, "db.json");

// Mock specific routes to test
app.get("/api/meta", (req, res) => {
  console.log("GET /api/meta called");
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
  res.json({ success: true, categories: [], tags: [] });
});

app.get("/api/posts/:filename", (req, res) => {
  console.log(`GET /api/posts/${req.params.filename} called`);
  res.json({
    success: true,
    data: {
      id: req.params.filename,
      title: "Test",
      tags: [],
      content: "Test Content",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Debug server running at http://localhost:${PORT}`);
});
