import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articles } from "../app/articles/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../longerarticles.md");

const byCat = {};
for (const a of articles) {
  (byCat[a.category] = byCat[a.category] || []).push(a);
}

const badgeIcon = (b) => (b === "live" ? "🔴 Live" : b === "hot" ? "🟠 Hot" : "🟢 New");

let md = "# LONGR — Sabri Suby Compact Headlines\n\n";
md += "All 170 headlines rewritten to follow the Sabri Suby 'Sell Like Crazy' compact headline framework ";
md += "(Longerheadlineaudit.md): 4 pillars — Audience Hook, Result, Without-Clause, Data Anchor — 15–18 words per title, ";
md += "Age identifier and Result locked, passive filler stripped.\n\n";

for (const [cat, list] of Object.entries(byCat)) {
  md += `## ${cat}\n\n`;
  for (const a of list) {
    md += `- **[${a.id}] ${badgeIcon(a.badge)}** ${a.headline}\n`;
  }
  md += "\n";
}

writeFileSync(outPath, md, "utf8");
console.log("Wrote " + outPath + " (" + articles.length + " headlines)");
