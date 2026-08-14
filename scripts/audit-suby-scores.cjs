const map = require("./suby-map.json");

const AGE = /((Over|At|After|Under)\s+\d{2,3}|At\s+\d{2,3}|Over\s+\d{2,3}|After\s+\d{2,3}|\d{2,3}\b.*\b(40|45|50|55|60|65|70)\b)/i;

const OUTCOME_STRONG = /\b(Rebuild|Steadies|Steady|Support|Protects|Protect|Builds|Build|Stop|Stops|Slows|Slow|Ease|Eases|Calm|Calmer|Sleep|Muscle|Bones|Bone|Immunity|Immune|Heart|Blood Sugar|Recovery|Recover|Fight|Lower|Raise|Independence|Grip|Focus|Memory|Hydrat|Collagen|Fullness|Energy|Metabolism|Hormones|Detox|Digestion|Satisfying|Reduce|Cuts|Cut|Hold|Keeps|Keep|Beat|Beats|Earn|Guides|Triggers|Restores|Restore|Settles|Settle|Wins|Powers|Fuel|Deliver|Delivers|Firm|Achy|Flavour|Calories|Anti-Inflammatory|Clean|Steady|Steadier|Sharp|Ageing|Healthy|Density|Strength|Mobility|Regulates|Signal|Cravings|Satiety)\b/i;

const WITHOUT_STRONG = /\bWithout\b|\bNo\s+(Pills|Gym|Treadmill|Shakes|Bars|Powders|Creams|Serums|Supplements?|Substitutes|Diet|Dieting|Measuring|Counting|Equipment|Effort|Hunger|Cost|Strict|Strict Dieting|Overhaul|Cleanse|Cleanses|Laxatives|Melatonin|Caffeine|Sugar|Sugary|Refined|Banning|Skipping|Gimmicks|Salt|Prescription|Magic|Medicine|Calorie Counting|Willpower|Rules|Bland|Pain|Pain Pills|Sports Drinks|Heavy|Pills)\b/i;

const WITHOUT_WEAK = /\bWithout\b|\bNo\b|\bInstead\b|\bNot\b|\bSkip\b|\bSwap\b|\bBeats\b|\bBeat\b|\bMore Than\b/i;

const DATA_STRONG = /[0-9]|\b(Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Twice|Once|Daily|Weekly|Every Day|A Week|A Day|Most Days|Each Meal|Every Meal|Half|Double|2)\b/i;

const DATA_WEAK = /\b(fast|soon|easy|quick|simple|gently|enough|quietly|slowly|longer|earlier|more|less|most)\b/i;

const JARGON = /\b(inflammation|anthocyanins?|glucosinolates?|microbiome|electrolytes?|anti-inflammatory|omega-3s?|polyphenols?|antioxidants?|metabolism|hormones?|prediabetes|MIND-style|cortisol|glycemic|LDL|DHA|circadian)\b/i;

const AGE_TERMS = /\b(Over|At|After|Under)\s+\d{2,3}\b/i;

function score(h) {
  const words = h.trim().split(/\s+/).length;
  let s = 0;
  const notes = [];

  const ageMatch = h.match(AGE);
  const ageIdx = ageMatch ? h.indexOf(ageMatch[0]) : -1;
  if (ageMatch) {
    if (ageIdx <= 8) s += 2;
    else { s += 1; notes.push("age buried"); }
  } else { notes.push("NO AGE"); }

  if (OUTCOME_STRONG.test(h)) s += 2;
  else { s += 1; notes.push("weak promise"); }

  if (WITHOUT_STRONG.test(h)) s += 2;
  else if (WITHOUT_WEAK.test(h)) { s += 1; notes.push("soft without"); }
  else notes.push("NO WITHOUT");

  if (DATA_STRONG.test(h)) s += 2;
  else if (DATA_WEAK.test(h)) { s += 1; notes.push("soft data"); }
  else notes.push("NO DATA");

  if (words < 18) s += 2;
  else if (words === 18) { s += 1; notes.push("18 words"); }
  else notes.push(words + " WORDS");

  return { s, words, notes, jargon: JARGON.test(h) };
}

const rows = map.map((e) => ({ id: e.id, file: e.file, h: e.new, ...score(e.new) }));

let total = 0;
const dist = {};
const weak = [];
const jargon = [];
for (const r of rows) {
  total += r.s;
  dist[r.s] = (dist[r.s] || 0) + 1;
  if (r.s <= 5) weak.push(r);
  if (r.jargon) jargon.push(r.id + " " + r.h);
}
const avg = (total / rows.length).toFixed(1);

console.log("=== Sabri Suby Scorecard Audit (10-point rubric) ===");
console.log("count:", rows.length, "| average score:", avg);
console.log("score distribution:", JSON.stringify(Object.entries(dist).sort((a,b)=>a[0]-b[0]).map(([k,v])=>k+"/10:"+v).join("  ")));
console.log("jargon-flagged (manual check):", jargon.length);
console.log("");
console.log("=== Weak entries (score <= 5) ===");
for (const r of weak) console.log("[" + r.id + "] " + r.s + "/10 (" + r.words + "w) " + r.h + "  :: " + r.notes.join(", "));
console.log("");
console.log("=== Top scoring (9-10/10) ===");
const top = rows.filter((r) => r.s >= 9);
console.log(top.length + " headlines score 9-10/10");
for (const r of top.slice(0, 20)) console.log("[" + r.id + "] " + r.s + "/10 " + r.h);
