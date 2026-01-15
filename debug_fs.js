const fs = require("fs");
const path = require("path");

const postsDir = path.join(__dirname, "source/_posts");
console.log("Posts Dir:", postsDir);

fs.readdir(postsDir, (err, files) => {
  if (err) {
    console.error("Error reading dir:", err);
  } else {
    console.log("Files found:");
    files.forEach((f) => {
      console.log(` - ${f} (Length: ${f.length})`);
      const p = path.join(postsDir, f);
      console.log(`   Exists? ${fs.existsSync(p)}`);
    });
  }
});

// Test specific file existence
const testFile = path.join(postsDir, "测试.md");
console.log(`Checking specific file: ${testFile}`);
console.log(`Exists? ${fs.existsSync(testFile)}`);
