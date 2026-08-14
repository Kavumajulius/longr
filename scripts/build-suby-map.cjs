const fs = require("fs");

const prev = require("./headline-map.json");

const CATS = [
  "cardio.ts", "strength.ts", "recovery.ts", "nutrition.ts", "mindfulness.ts",
  "sleep.ts", "longevity.ts", "gut-health.ts", "hydration.ts", "fasting.ts",
  "anti-inflammatory.ts", "heart-health.ts", "brain-health.ts", "immunity.ts",
  "hormone-balance.ts", "skin-health.ts", "bone-health.ts", "metabolism.ts",
  "weight-management.ts", "stress-relief.ts", "breathwork.ts", "yoga.ts",
  "mobility.ts", "supplements.ts", "superfoods.ts", "plant-based.ts", "protein.ts",
  "antioxidants.ts", "detox.ts", "cold-therapy.ts", "sauna-heat.ts", "blue-zones.ts",
  "circadian-health.ts", "meditation.ts",
];

const NEW = [
  // 1-5 Cardio
  "Over 50? The 10-Minute Post-Meal Walk That Steadies Blood Sugar Every Day Without Cutting Carbs",
  "Over 55? The 'Too Easy To Count' Cardio That Builds Your Heart Without Breathless Jogging",
  "No Gym After 60? This 1-Flight Stair Habit Delivers Cardio And Independence Without A Treadmill",
  "Sore Knees Or Hips At 50? These 6 Low-Impact Cardio Swaps Keep You Moving Without Pain",
  "Cardio At 50? This Simple Hydration Rule Powers Every Session, Before, During, And After, Without Sugary Drinks",
  // 6-10 Strength
  "Over 50? The 5 Breakfast Proteins That Hold Muscle For Years Without Powders Or Shakes",
  "Two Strength Sessions A Week At 55 Keep You Independent At 70 — No Gym Required",
  "Grip Strength At 60 Predicts Independence, And Everyday Groceries And Grandkids Count As Training, Not Gym Time",
  "Still Saving Protein For Dinner At 55? Every Meal Is The Better Muscle Pattern — Start Breakfast",
  "Strength Training At 50? Sleep, Protein, And Magnesium Do The Recovery Work Without A Single Supplement",
  // 11-15 Recovery
  "Before Recovery Supplements At 50, Fix These 5 Sleep Habits First To Rebuild Muscle Free",
  "Just Finished A Workout At 50? Greek Yogurt, Eggs, And Salmon Rebuild You Without Bars",
  "Rest Days At 60 Don't Mean Doing Nothing — A 30-Minute Brisk Walk Speeds Recovery Instead",
  "Evening Magnesium At 55? Pumpkin Seeds, Banana, Greens, And Dark Chocolate Support Recovery While You Sleep, No Pills",
  "Stretching For Mobility At 50? Pair It With These 5 Foods To Recover Faster Effortlessly",
  // 16-20 Nutrition
  "Over 50? Fill Half Your Plate With Vegetables To Steady Daily Energy Without Calorie Counting",
  "Eating The Same Few Foods At 50? These 5 Plate Colours Add Nutrients Without Extra Food",
  "White Bread, White Rice, White Pasta? These 5 Whole-Grain Swaps Protect Your Blood Sugar At 50",
  "Fat Isn't The Enemy After 50 — The 3 Types On Your Plate Matter More Than The Amount",
  "Too Tired To Cook At 55? This 1-Hour Sunday Prep Delivers 7 Days Of Healthy Meals",
  // 21-25 Mindfulness
  "Eating On Autopilot At 50? Slowing Down Cuts Calories And Boosts Enjoyment Without Changing Anything You Eat",
  "Put The Phone Down At Dinner At 50 — Eating Without Screens Changes What You Choose",
  "The Fullness Signal You're Missing At 55? Chewing Slowly Triggers It Without Eating Any Less",
  "Stress-Eating At 50? The Crash After Sugary Food Drives It — This 2-Minute Check Stops It",
  "The 1-Minute Quiet Ritual Before Dinner At 50 Guides Better Food Choices Without Any Effort",
  // 26-30 Sleep
  "Caffeine Lingers Longer At 50 — This Afternoon Cutoff Time Protects Your Sleep Without Quitting Coffee",
  "That Evening Wine At 50 Costs Deep Sleep — This Simple Swap Protects Your Night Instead",
  "Struggling To Sleep At 50? Kiwi, Yogurt, And Tart Cherry Support Sleep Naturally Without Melatonin",
  "Sleeping Worse After 55? This Magnesium-Rich Evening Wind-Down With 5 Foods Supports Natural Deeper Sleep Without Pills",
  "At 60? Heavy Late Dinners Steal Your Sleep, So Move Dinner 2-3 Hours Earlier Without Dieting",
  // 31-35 Longevity
  "The Mediterranean Way At 50: These 5 Patterns Most People Think They Follow But Don't",
  "Want Healthy Ageing At 50? Hit The 30-Plant Weekly Goal Without Banning Favourite Foods Or Overhauling Your Kitchen",
  "Protein At 60 Keeps You Independent At 75 — This Plate Rule Builds Muscle Without Powders",
  "The Longevity Lever At 50 That Beats Counting Calories: Eat Enough Food, Not Too Much",
  "The Omega-3 Habit In Longevity Research At 50: Fatty Fish Twice A Week Beats Pills",
  // 36-40 Gut Health
  "A More Diverse Gut At 50: 30 Plants A Week Beats Any Single 'Gut Superfood'",
  "Kefir, Yogurt, Sauerkraut, And Kimchi At 50 Feed Your Gut Daily Better Than Probiotic Pills",
  "Oats, Onions, Garlic, And Bananas At 50 Feed The Microbes You Already Have — Cheap",
  "Ultra-Processed Food Hurts Your Gut At 50 — These 5 Whole-Food Swaps Protect It Without Dieting",
  "Regularity Struggles At 50? Pair Fibre With Water Every Day — This Fix Works Without Laxatives",
  // 41-45 Hydration
  "Still Reaching For Sugary Or Diet Drinks At 50? Water Beats Both Without Giving Up Taste",
  "Thirst Gets Quieter With Age At 55 — These 5 Cues Beat Relying On Feeling Thirsty",
  "Water Isn't The Only Way At 55 — These 5 High-Water Foods Hydrate Without More Glasses",
  "Exercising In The Heat At 60? These 5 Electrolyte Habits Keep You Steady Without Sports Drinks",
  "Does Coffee Dehydrate You At 50? This Caffeine-Water Balance Keeps You Hydrated Without Quitting Coffee",
  // 46-50 Fasting
  "Fasting Feels Intimidating At 50? This 12-Hour Overnight Window Starts Gentle Without Starving All Day",
  "How You Break Your Fast At 50 Sets The Day — Avoid These 5 First-Bite Mistakes",
  "Prediabetes And Fasting At 50: These 5 Safety Rules To Read Before You Start Anything",
  "Fasting At 50? Water Is The Rule Most People Break — This Fix Keeps Your Fast Clean",
  "Considering Fasting At 60? These 5 Medical Caveats Come First — Read Before Skipping Any Meals",
  // 51-55 Anti-Inflammatory
  "Salmon, Walnuts, And Flaxseed At 50: These 3 Omega-3 Foods Deliver Calmer Inflammation Without Pills",
  "The 5 Plate Colour Families At 50 Do More Than Look Pretty — They Fight Cell Aging",
  "Skip The Turmeric Shots At 50 — Real Cooking With Turmeric And Ginger Is More Anti-Inflammatory",
  "The One Fat To Default To After 55: Extra-Virgin Olive Oil Beats Butter Without Effort",
  "Cutting Ultra-Processed Food At 50? These 5 Simple Swaps Reduce Inflammation Without Banning Favourite Foods",
  // 56-60 Heart Health
  "Worried About Blood Pressure At 50? These 5 Potassium Foods Support It Without Diet Fads",
  "5 Things Everyone Over 55 Should Know About Cholesterol — These Foods Do It Daily Without Pills",
  "One Of The Smartest Heart Habits At 60: Fatty Fish Twice A Week Beats Supplements",
  "Sodium Hides In 'Healthy' Meals At 50 — These 5 Traps Quietly Raise It (And The Fix)",
  "Swap Red Meat 3 Days A Week At 55 — These 5 Meals Support Your Heart Without Veganism",
  // 61-65 Brain Health
  "Berries At 50: The Everyday Brain Food That Supports Memory Without Giving Up Anything New",
  "Fatty Fish Twice A Week After 55 Is The Best-Supported Brain Habit — No Pills Needed",
  "Leafy Greens At 50: The #1 Vegetable Linked To Slower Cognitive Decline — Add It Daily",
  "Keep Your Memory Sharp At 55? This MIND-Style Pattern Builds It Meal By Meal — No Diet",
  "Mild Dehydration At 50 Clouds Daily Focus And Memory — This Simple Water Fix Clears Both",
  // 66-70 Immunity
  "Boiling Vegetables At 50? Use This Cooking Method To Save The Vitamin C Your Immunity Needs",
  "Zinc At 55: Pumpkin Seeds, Chickpeas, Lentils, And Occasional Shellfish Support Immunity Without Supplement Pills",
  "After 50, Daily Protein Supports Immunity Meal By Meal — More Than Just Building Muscle",
  "Vitamin D At 50: 5 Myths About Food, Sun, And Supplements Most People Get Wrong",
  "Immune Support After 50 Goes Beyond Food Daily — Sleep, Stress, And Ferments Count Too",
  // 71-75 Hormone Balance
  "The Calm, Safe Case For Whole Soy During Menopause At 45 — Supports Hormones Without Pills",
  "Steadier Hormones And Blood Sugar After 45? Fibre At Breakfast Is The Start — No Pills",
  "Olive Oil, Nuts, And Fish At 50: The 3 Fats Your Hormones May Be Starving For",
  "Perimenopause At 45? Protein At Every Meal, From Eggs To Lentils To Tofu, Supports Steadier Hormones Without Shakes",
  "Struggling To Sleep Through Menopause At 45? These 5 Magnesium-Rich Foods Beat Sleep Pills Naturally",
  // 76-80 Skin Health
  "Peppers, Kiwi, And Vitamin C At 40: The 3-Food Fix For Skin Collagen Without Creams",
  "Hydrated Skin At 40 Needs Water Plus These 5 Specific High-Water Foods — No Creams",
  "Avocado, Olive Oil, And Oily Fish At 45: 3 Fat Allies For Supple Skin Without Serums",
  "Eat Colourful Produce Weekly After 50 To Slow Visible Skin Ageing — No Expensive Creams",
  "For Your Skin At 40, Cutting Added Sugar Is The Smartest Move — No Creams Required",
  // 81-85 Bone Health
  "Want Stronger Bones At 50? These 5 Calcium-Rich Foods Rebuild Density Daily Without Any Pills",
  "Vitamin D Isn't Optional After 50: Where Food, Sun, And Supplements Fit Now — No Guessing",
  "Muscle And Bone At 55: Protein At Every Meal Does Double Duty — Not Just Dinner",
  "Calcium Needs Helpers At 50: Vitamin K Greens And Magnesium Do The Job — No Pills",
  "Bone Responds To Load At 55 — Pair Calcium-Rich Food With These 5 Activities To Win",
  // 86-90 Metabolism
  "Metabolism Slows After 50? Protein At Every Meal Is The Best Counter-Move — No Pills",
  "Energy Crashes At 50? Replacing Refined Carbs With Fibre Steadies You — Keep The Good Carbs",
  "Extra-Virgin Olive Oil At 50: The Trick Is Replacing Butter, Not Adding More — Easy Swap",
  "At 50, Food And Movement Work As A Team — These 5 Meal Habits Support Muscle Without Gym",
  "A Protein-Rich Breakfast At 50: The Anchor That Steadies Metabolism All Day — No Dieting",
  // 91-95 Weight Management
  "Feel Full Without Measuring At 50: Fill Half Your Plate With Vegetables First — No Scales",
  "Protein Keeps You Full At 50 — These 5 Foods Do It Without Bars Or Shakes",
  "Smaller Portions That Feel Satisfying At 50? Start With Fibre-Rich Foods Instead Of Tiny Plates",
  "Liquid Calories At 50 Add Up Quietly — These 5 Drink Swaps Cut Them Without Losing Taste",
  "The 20-Minute Fullness Signal At 50: Fork-Down Pacing, Halfway Pauses, And A Screen-Free Table Stop Overeating Without Measuring",
  // 96-100 Stress Relief
  "Feeling Frazzled At 50? These 5 Magnesium-Rich Foods Support Daily Calm Every Day Without Pills",
  "Stress Resilience At 50: These Omega-3 Foods Earn Their Place On The Plate Without Pills",
  "Feeling Wired At 50? This Caffeine Cutoff Plus Herbal Tea Restores Calm — Keep Morning Coffee",
  "Constant Grazing Keeps You On Edge At 50? Warm Cooked Meals Steady You — No Snacking",
  "The Stress-Fueled Crash At 50? Steadier Daily Blood Sugar Is The Antidote — No Strict Diet",
  // 101-105 Breathwork
  "Breathwork At 50? What You Eat Before The Session Changes It — Skip The Heavy Meal",
  "Breathwork Feels Harder Than It Should At 50? Hydrate Before Sessions — Not More Coffee",
  "Breathing For Calm But Still Jittery At 50? Swap These Daily Caffeine Foods Before Practice",
  "Digestion After 50: This Breathing Pause At Every Meal Helps — No Supplements, No Cost",
  "After A Deep-Breathing Session At 50: These 5 Eating Habits Settle Your Body — Light Wins",
  // 106-110 Yoga
  "Yoga Class At 50: The Before-And-After Eating Timing Most People Get Wrong — Fix It",
  "Flexibility Is Built On Strength At 50 — How Daily Protein Fits Yoga Without Any Shakes",
  "Hydration On Yoga Days At 50: What To Drink Before, During, And After — No Sugary Drinks",
  "Morning Stiffness Before Yoga At 50? Dietary Anti-Inflammatory Foods Ease It — No Pills Needed",
  "Post-Yoga Meals At 50: How To Eat After Class Without Undoing The Calm — Light Wins",
  // 111-115 Mobility
  "Achy Joints At 50? Omega-3 Foods And Olive Oil Ease Daily Movement — No Pain Pills",
  "Getting Up From The Floor At 60? Protein Is The Strength Behind It — No Equipment",
  "Supple Movement Needs Water: Simple Hydration Is Part Of Mobility At 55 — Not Pills",
  "Mobility At 50 Starts With Bones: Calcium And Vitamin D Are The Foundation — No Pills",
  "Staying Flexible At 60? Build The Anti-Inflammatory Plate First Every Day — No Strict Dieting",
  // 116-120 Supplements
  "Vitamin D At 50: These 7 Everyday Food Sources Beat The Pill Bottle — Try Them First",
  "Before Buying Fish Oil Pills At 55, Read This About Food-First Omega-3s — 2 Fish Meals",
  "Protein From Real Food, Not Powders, Is The Smarter Everyday Default At 50 — No Shakes",
  "Nuts, Greens, And Beans Before Pills: The Daily Magnesium Route At 50 — No Supplement",
  "Before Buying Supplements At 55, Ask These 5 Questions First — Save Money Without Guesswork",
  // 121-125 Superfoods
  "Rotating Berries At 55 Beats Chasing One 'Super' Berry — This Variety Delivers More Nutrients",
  "These 5 Leafy Greens At 50 Bring More To The Table Than Any Superfood Powder",
  "The Closest Thing To A Real Superfood Habit At 60: Two Fatty Fish Meals A Week",
  "Yogurt, Kimchi, And Miso At 50: 3 Fermented Foods For A Healthier Gut Without Pills",
  "A Small Handful Of Nuts And Seeds At 55 Goes Further Than You'd Expect — Skip Supplements",
  // 126-130 Plant-Based
  "Plant-Forward At 50 Without Losing Flavour: This Everyday Plate Structure Works — No Bland Meals",
  "Getting Enough Daily Protein Plant-Based At 55 Is Easier Than It Sounds — No Shakes Needed",
  "Plant Iron Absorbs Better With Vitamin C At 50 — These 5 Pairings Beat Iron Pills",
  "Calcium Without Dairy At 55: These Foods — Fortified Soy, Greens, And Almonds — Cover It",
  "Going Plant-Based At 60? These 6 Everyday Meals, From Bean Bowls To Overnight Oats, Stay Satisfying Without Substitutes",
  // 131-135 Protein
  "Hold Muscle For Years: These 5 Breakfast Proteins Start It At 50 — No Shakes Or Bars",
  "Spreading Protein Across The Day At 55 Rebuilds Muscle Better Than A Single Big Dinner",
  "Mixing Plant And Animal Protein At 50 Is Smarter Than Picking A Side — Both Win",
  "Strength And Independence At 60: How Much Protein Your Body Needs Now — No Over-Dosing",
  "High-Protein Snacks At 50: You Don't Need Bars Or Shakes — These 5 Foods Do It",
  // 136-140 Antioxidants
  "Rotating Berries And Colourful Fruit At 50: The Simple Everyday Antioxidant Habit — No Pills",
  "Green Tea Every Day At 55: An Antioxidant Habit With One Rule — Skip The Biscuit",
  "Want More Antioxidants At 50? Eat A Rainbow Of Colourful Vegetables Daily — No Supplements",
  "Dark Leafy Greens At 60: The Antioxidant Powerhouse Your Plate May Be Missing — Add It",
  "Boiling Vegetables Pours Antioxidants Away At 50 — This Simple Steam Or Roast Swap Keeps Them",
  // 141-145 Detox
  "Fibre Is Your Body's Own Daily Detox System At 50 — Eat More, Skip The Cleanses",
  "Water Is The Simplest Daily Detox At 55: How Much Your Kidneys Appreciate — No Gimmicks",
  "Broccoli, Cabbage, And Kale Weekly At 50 Support Your Body's Own Detox Pathways Without A Single Cleanse",
  "The Detox Your Body Actually Needs At 60: Fewer Daily Ultra-Processed Foods — Not Cleanses",
  "Juice Cleanses Aren't The Detox At 55 — Your Liver And Kidneys Already Do It Better",
  // 146-150 Cold Therapy
  "Keep Meals Light Around Cold Exposure Sessions At 50 For Easier Recovery — No Heavy Food",
  "Cold Therapy At 55: Why Hydration — Water Before And After — Makes Recovery Easier",
  "Anti-Inflammatory Meals At 50 Help Your Body Recover Faster From Cold Exposure — Not Just Ice",
  "Post-Dip Rewarming At 55: These Warming Foods Make Recovery Easier — No Heavy Meal Needed",
  "Oily Fish At 60 Supports The Same Recovery Goal As Cold Therapy — Twice Weekly, No Pills",
  // 151-155 Sauna & Heat
  "Hydrate Around The Sauna At 50: Protect The Recovery, Not Ruin It — No Sports Drinks",
  "Bananas, Citrus, And Yogurt At 55: Replenish What The Sauna Sweats Out — No Sports Drinks",
  "A Light Pre-Sauna Meal Beats A Heavy One At 50 — This Timing Keeps The Session Easy",
  "Post-Sauna Protein At 55: Refuel With These Simple Foods After The Sweat — No Shakes",
  "Sodium After A Sauna At 60: The Answer Is Usually 'Don't Add More' — No Salt Tablets",
  // 156-160 Blue Zones
  "Beans Most Days At 50: The Blue Zones Staple Your Plate May Be Missing — Add Daily",
  "Whole Grains At Every Meal At 55: The Blue Zones Pattern Most People Skip — Try It",
  "A Daily Handful Of Nuts At 50: The Blue Zones Habit You Can Start Today — Cheap",
  "Meatless Meals That Feel Filling At 50: These 5 Ways, Blue Zones Style — No Hunger",
  "Wine And Coffee At 55: Blue Zones Rituals Worth Keeping Every Day, Not Magic — Balance Wins",
  // 161-165 Circadian Health
  "At 50? Breakfast At The Same Hour Daily Steadies Your Body Clock Without Strict Scheduling",
  "Set A Caffeine Cutoff At 55 — These 5 Afternoon Drinks Replace It Without Quitting Coffee",
  "Late-Night Snacking Steals Sleep At 50: An Earlier Dinner And Banana Bedtime Snack Protect Rest Without Hunger",
  "Irregular Eating Windows At 50? This Consistency Fix May Be The Circadian Reset You Need",
  "Morning Light Plus A Real Breakfast At 50: A Circadian Combo That Sets The Day — Simple",
  // 166-170 Meditation
  "Mindful Eating At 50: Why The First Look And First Bite Deserve Your Attention — No Diet",
  "Stress-Eating Or True Hunger At 50? This Simple 2-Minute Check Tells The Difference — No Willpower",
  "One Pause Before Every Meal At 50: This Slows Eating And Improves It — No Diet Rules",
  "Calm Vs Caffeine At 50: Which Drinks Support A Steady Mind — Keep The Good Ones",
  "An Evening Wind-Down Ritual At 55: What To Eat (And Skip) Before Bed — No Heavy Meals",
];

if (NEW.length !== prev.length) {
  console.error("MISMATCH: NEW=" + NEW.length + " prev=" + prev.length);
  process.exit(1);
}

const wc = (s) => s.trim().split(/\s+/).length;
let under = 0, over = 0;
NEW.forEach((h, i) => {
  const n = wc(h);
  if (n < 15) { under++; console.log("UNDER " + n + "w #" + (i + 1) + ": " + h); }
  if (n > 18) { over++; console.log("OVER  " + n + "w #" + (i + 1) + ": " + h); }
});
console.log("word-count check -> under15:" + under + " over18:" + over);

const pairs = prev.map((p, i) => ({ id: p.id, file: p.file, old: p.new, new: NEW[i] }));
fs.writeFileSync("scripts/suby-map.json", JSON.stringify(pairs, null, 1));
console.log("suby-map written for " + pairs.length + " articles");
