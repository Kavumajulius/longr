const map = require("./headline-map.json");

const AGE = /\b(40|45|50|55|60|70|75|80)\b|\b(menopause|perimenopause|prediabetes|over 50|over 55|over 60|over 45|over 40)\b/i;
const NUMBERS = /\b(5|6|3|4|2|12|20|30)\b|\b(two|twice|three|one|10-minute|12-hour|20-minute|30-minute)\b/i;
const FOOD = /\b(food|foods|fish|vegetable|vegetables|breakfast|lunch|dinner|meal|meals|protein|berries|yogurt|seeds|nuts|greens|beans|oats|fruit|plate|diet|carbs|sodium|potassium|magnesium|omega-3|vitamin|calcium|fibre|milk|drinks|water|tea|coffee|olive oil|soy|kefir|kimchi|grains|snacks)\b/i;
const INFO_GAP = /\b(may|missing|think|hiding|hidden|traps|don't realize|most people|don't know|behind|surprising|actually|without|before|instead|worth a closer look|changes|feels|deserve|appreciate|missing|wrong|sabotag)\b/i;
const EMOTION = /\b(spikes|costing|steals|worse|hiding|miss|missing|intimidating|complaining|traps|stops|crash|on edge|jittery|stiffness|confusing|quiet|wrong|mistakes|wired|can't|cancel|deserve|thank you|independent|decline|powerhouse|secret|warning|frazzled|achy|creaky|sharp|steady|calm|undoing)\b/i;
const STAKES = /\b(blood sugar|blood pressure|heart|brain|bone|bones|sleep|muscle|immune|immunity|independence|strong|memory|deep sleep|hormone|collagen|weight|cholesterol|cognitive|calm|energy|metabolism|gut|mobility|knees|hips|joints|mind|skin|stamina)\b/i;
const PAYOFF = /\b(support|steady|steadier|stay strong|stay|rebuild|recover|recovery|better sleep|healthier|protect|keep|improve|settle|calm|independence|sharp|stronger|full|anchor|foundation|payoff|counter-move|steady you|steady)\b/i;
const TWIST = /\b(—\b|—|\?.*\b(before|instead|without|and|but|skip|or)\b|\bif you want|before\b|instead\b|without\b|but\b|even if|and the one|and what|or skip|not\b|and\b)/i;
const CRED_HIT = /\b(will|guarantee|prevent|killing|adds \d+ years|keep your parents out of hospital|won't get|cures|reverse)\b/i;

function score(h) {
  let s = 0;
  const d = [];
  const hasAge = AGE.test(h);
  const hasNum = NUMBERS.test(h);
  const hasFood = FOOD.test(h);
  const spec2 = hasAge && (hasNum || hasFood);
  const spec1 = hasAge || hasNum;
  s += 2; d.push("Attention:2"); // question/emotion checked below
  if (!EMOTION.test(h) && !h.includes("?") && !TWIST.test(h)) { s -= 1; d[0] = "Attention:1"; }
  s += hasAge ? 2 : 0; d.push("Buyer:" + (hasAge ? 2 : 0));
  s += STAKES.test(h) ? 2 : 0; d.push("Stakes:" + (STAKES.test(h) ? 2 : 0));
  s += INFO_GAP.test(h) ? 2 : 1; d.push("Curiosity:" + (INFO_GAP.test(h) ? 2 : 1));
  s += spec2 ? 2 : spec1 ? 1 : 0; d.push("Spec:" + (spec2 ? 2 : spec1 ? 1 : 0));
  s += PAYOFF.test(h) ? 2 : 1; d.push("Payoff:" + (PAYOFF.test(h) ? 2 : 1));
  s += TWIST.test(h) ? 2 : h.includes(":") ? 1 : 0; d.push("Twist:" + (TWIST.test(h) ? 2 : h.includes(":") ? 1 : 0));
  s += CRED_HIT.test(h) ? 0 : 2; d.push("Cred:" + (CRED_HIT.test(h) ? 0 : 2));
  return { s, d, h };
}

const results = map.map((x) => ({ id: x.id, ...score(x.new) }));
const avg = (results.reduce((a, r) => a + r.s, 0) / results.length).toFixed(2);
console.log("AVERAGE:", avg, "/16");
const below = results.filter((r) => r.s < 12);
console.log("BELOW 12:", below.length);
for (const r of below) console.log("  ", r.id, r.s, r.h);
