const fs = require("fs");
const path = require("path");
const map = require("./headline-map.json");

const OVERRIDES = {
  5: "Cardio at 50: What You Drink Before, During, and After May Be Sabotaging the Session",
  35: "The Omega-3 Habit That Keeps Showing Up in Longevity Research: Fatty Fish After 50",
  37: "Kefir, Yogurt, Sauerkraut, and Kimchi: The Fermented Foods Your Gut at 50 May Appreciate",
  62: "Fatty Fish Twice a Week After 55: One of the Best-Supported Brain Habits at the Table",
  73: "Olive Oil, Nuts, and Fish at 50: The Fats Your Hormones May Be Missing",
  76: "Peppers, Kiwi, and Vitamin C at 40: The Foods That Feed Skin Collagen",
  83: "Muscle and Bone at 55: Why Protein at Every Meal Does Double Duty",
  86: "Metabolism Slows After 50? Protein at Every Meal May Be the Counter-Move",
  90: "A Protein-Rich Breakfast at 50: The Anchor Your Daily Meal Rhythm Needs",
  96: "Feeling Frazzled at 50? Magnesium-Rich Foods Like Pumpkin Seeds May Help You Unwind",
  101: "Breathwork at 50: What You Ate Before the Session Changes How It Feels",
  106: "Yoga Class at 50: The Before-and-After Eating Timing Most People Get Wrong",
  108: "Hydration on Yoga Days at 50: What to Drink (and Skip) Before, During, and After Class",
  111: "Achy Joints at 50? Omega-3 Foods and Olive Oil May Make Movement Easier",
  114: "Mobility at 50 Starts With Bones: Why Calcium and Vitamin D Are the Foundation",
  116: "Vitamin D at 50: 5 Food Sources to Consider Before the Pill Bottle",
  134: "Strength and Independence at 60: How Much Protein Your Body Needs Now",
  147: "Cold Therapy at 55: Why Water Before and After Makes Recovery Easier",
  161: "Breakfast at the Same Time at 50: A Small Habit With a Big Circadian Payoff",
  164: "Irregular Eating Windows at 50? Consistency May Be the Circadian Fix",
};

let updated = 0;
const byFile = {};
for (const entry of map) {
  const finalHeadline = OVERRIDES[entry.id];
  if (finalHeadline && finalHeadline !== entry.new) {
    const prev = entry.new;
    entry.new = finalHeadline;
    (byFile[entry.file] = byFile[entry.file] || []).push({ prev, finalHeadline });
  }
}

for (const file of Object.keys(byFile)) {
  const filePath = path.resolve("app/articles", file);
  let src = fs.readFileSync(filePath, "utf8");
  for (const { prev, finalHeadline } of byFile[file]) {
    if (!src.includes(prev)) {
      console.error("PREV NOT FOUND in " + file + ": " + prev);
      process.exit(1);
    }
    src = src.split(prev).join(finalHeadline);
    updated++;
  }
  fs.writeFileSync(filePath, src);
}
fs.writeFileSync("scripts/headline-map.json", JSON.stringify(map, null, 1));
console.log("updated " + updated + " headlines in files + map");
