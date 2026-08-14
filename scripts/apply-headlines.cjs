const fs = require("fs");
const path = require("path");
const map = require("./headline-map.json");

const byFile = {};
for (const entry of map) {
  (byFile[entry.file] = byFile[entry.file] || []).push(entry);
}

let replaced = 0;
for (const file of Object.keys(byFile)) {
  const filePath = path.resolve("app/articles", file);
  let src = fs.readFileSync(filePath, "utf8");
  for (const entry of byFile[file]) {
    if (!src.includes(entry.old)) {
      console.error("NOT FOUND in " + file + ": " + entry.old);
      process.exit(1);
    }
    src = src.split(entry.old).join(entry.new);
    replaced++;
  }
  fs.writeFileSync(filePath, src);
}
console.log("replaced " + replaced + " headlines across " + Object.keys(byFile).length + " files");
