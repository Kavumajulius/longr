import fs from "fs";
import path from "path";

const dir = path.resolve("app/articles");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts" && f !== "images.ts");

const out = [];
for (const file of files) {
  const src = fs.readFileSync(path.join(dir, file), "utf8");
  const blocks = src.split(/^\s*headline:/m).slice(1);
  for (const block of blocks) {
    const headline = (block.match(/^\s*"([^"]+)"/) || [])[1];
    if (!headline) continue;
    const count = (block.match(/title:/g) || []).length;
    const category = (block.match(/category:\s*"([^"]+)"/) || [])[1] || "";
    const badge = (block.match(/badge:\s*"([^"]+)"/) || [])[1] || "";
    const actionTitles = [...block.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
    const tryThis = [...block.matchAll(/tryThis:\s*"([^"]+)"/g)].map((m) => m[1]);
    out.push({ file, category, badge, headline, count, actionTitles, tryThis });
  }
}
console.log(JSON.stringify(out, null, 1));
