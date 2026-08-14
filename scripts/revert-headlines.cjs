const fs = require("fs");
const path = require("path");
const map = require("./headline-map.json");

const byFile = {};
for (const entry of map) {
  (byFile[entry.file] = byFile[entry.file] || []).push(entry);
}

let reverted = 0;
for (const file of Object.keys(byFile)) {
  const filePath = path.resolve("app/articles", file);
  let src = fs.readFileSync(filePath, "utf8");
  for (const entry of byFile[file]) {
    if (!src.includes(entry.new)) {
      console.error("NEW NOT FOUND in " + file + ": " + entry.new);
      process.exit(1);
    }
    src = src.split(entry.new).join(entry.old);
    reverted++;
  }
  fs.writeFileSync(filePath, src);
}
console.log("reverted " + reverted + " headlines across " + Object.keys(byFile).length + " files");
