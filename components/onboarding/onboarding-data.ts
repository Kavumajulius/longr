export const quizStepIds = [
  "age_bracket",
  "primary_future_goal",
  "current_food_health_focus",
  "nutrition_overwhelm_level",
  "food_choice_confidence",
  "future_regret_concern",
  "current_eating_approach",
  "primary_food_blocker",
  "current_context",
  "first_food_use_case",
  "deep_future_priority",
  "previous_food_learning_method",
  "guidance_readiness",
  "first_week_win",
  "daily_time_commitment",
  "future_self_reward",
] as const;

export type QuizAnswerKey = (typeof quizStepIds)[number];

export interface OnboardingAnswers extends Record<QuizAnswerKey, string> {
  first_name: string;
  email: string;
}

export interface Choice {
  value: string;
  label: string;
  icon?: string;
}

export interface QuizStepDefinition {
  key: QuizAnswerKey;
  title: string;
  supporting?: string;
  choices: Choice[];
  optional?: boolean;
  progressNote?: string;
}

const choice = (value: string, label: string, icon?: string): Choice => ({
  value,
  label,
  icon,
});

export const quizSteps: QuizStepDefinition[] = [
  {
    key: "age_bracket",
    title: "How old are you?",
    supporting:
      "We’ll tailor Longr around food choices that may matter more at your stage of life.",
    choices: [
      choice("40_49", "40–49"),
      choice("50_59", "50–59"),
      choice("60_69", "60–69"),
      choice("70_plus", "70+"),
      choice("caregiver", "I’m choosing for a parent or loved one"),
    ],
  },
  {
    key: "primary_future_goal",
    title: "What matters most to you in the years ahead?",
    supporting:
      "Choose the outcome you most want your everyday food choices to support.",
    choices: [
      choice("strong_mobile", "Stay strong and mobile", "↗"),
      choice("independence", "Protect my independence", "⌂"),
      choice("heart_metabolic", "Support my heart and metabolic health", "♥"),
      choice("brain", "Stay mentally sharp", "◎"),
      choice("family_time", "Have more healthy years with the people I love", "＋"),
    ],
  },
  {
    key: "current_food_health_focus",
    title: "What are you paying the most attention to right now?",
    supporting: "This helps us choose the food topics most useful to you.",
    choices: [
      choice("heart_metabolic", "Heart, blood pressure, or blood sugar"),
      choice("brain", "Brain health"),
      choice("strength", "Strength / muscle / mobility"),
      choice("healthy_aging", "Overall healthy aging"),
      choice("unsure", "I’m not sure — I just want to eat better"),
    ],
  },
  {
    key: "nutrition_overwhelm_level",
    title: "Does eating “healthy” feel more confusing than it should?",
    supporting:
      "There is a lot of conflicting food advice. How clear does it feel today?",
    choices: [
      choice("always", "Yes — all the time"),
      choice("often", "Often"),
      choice("sometimes", "Sometimes"),
      choice("not_really", "Not really"),
    ],
  },
  {
    key: "food_choice_confidence",
    title: "How confident are you that the way you eat supports the years ahead?",
    choices: [
      choice("very", "Very confident"),
      choice("mostly", "Mostly confident"),
      choice("not_very", "Not very confident"),
      choice("dont_know", "I honestly don’t know"),
    ],
  },
  {
    key: "future_regret_concern",
    title: "Do you worry today’s eating habits could catch up with you later?",
    supporting:
      "Not every food choice determines your future. We’re asking what motivates you now.",
    choices: [
      choice("often", "Yes — often"),
      choice("sometimes", "Sometimes"),
      choice("rarely", "Rarely"),
      choice("not_really", "Not really"),
    ],
  },
  {
    key: "current_eating_approach",
    title: "Which best describes the way you eat right now?",
    choices: [
      choice("careful", "I already try to eat carefully"),
      choice("inconsistent", "I eat well some days and not others"),
      choice("knowledge_gap", "I know what to do, but I don’t always do it"),
      choice("convenience", "I mostly eat what is convenient"),
    ],
  },
  {
    key: "primary_food_blocker",
    title: "What makes eating better hardest for you?",
    supporting: "Pick the one that gets in your way most often.",
    choices: [
      choice("conflicting_advice", "There is too much conflicting advice"),
      choice("age_relevance", "I don’t know what matters most at my age"),
      choice("time_convenience", "Time and convenience get in the way"),
      choice("restriction", "I don’t want to give up foods I enjoy"),
      choice("consistency", "I know the basics, but struggle to stay consistent"),
    ],
  },
  {
    key: "current_context",
    title: "Which statement sounds most like you right now?",
    supporting: "Choose one, or skip this optional context question.",
    optional: true,
    choices: [
      choice("stay_ahead", "I’m generally well and want to stay ahead"),
      choice("monitoring", "I’m monitoring a health marker or following clinician guidance"),
      choice("rebuilding", "I’m rebuilding habits after years of putting them off"),
      choice("caregiver", "I often choose food for myself and someone I care for"),
      choice("reliable_info", "I want reliable information for everyday choices"),
    ],
  },
  {
    key: "first_food_use_case",
    title: "What would you like Longr to make easier first?",
    choices: [
      choice("breakfast", "Building a better breakfast"),
      choice("grocery", "Knowing what to buy at the grocery store"),
      choice("swaps", "Finding better swaps for foods I already eat"),
      choice("labels_preparation", "Reading labels and preparing food better"),
      choice("eat_more", "Knowing what to eat more often"),
    ],
  },
  {
    key: "deep_future_priority",
    title: "When you think about getting older, what do you most want to protect?",
    choices: [
      choice("independence", "My independence"),
      choice("active", "My ability to walk, travel, and stay active"),
      choice("heart_brain", "My heart, circulation, and mental sharpness"),
      choice("strength", "My strength and mobility"),
      choice("family", "My ability to enjoy life with family"),
    ],
  },
  {
    key: "previous_food_learning_method",
    title: "How have you tried to eat better before?",
    choices: [
      choice("content", "Mostly articles, videos, or social media"),
      choice("diets", "Diets or meal plans"),
      choice("professional", "Advice from a doctor or dietitian"),
      choice("self_tools", "Apps or changes I made on my own"),
      choice("none", "I haven’t tried anything structured"),
    ],
  },
  {
    key: "guidance_readiness",
    title: "Would a few minutes of clear food guidance each day feel realistic?",
    progressNote: "Almost there",
    choices: [
      choice("definitely", "Yes — definitely"),
      choice("simple", "Yes, if it stays simple"),
      choice("maybe", "Maybe"),
      choice("as_needed", "I’d rather read only when I need something"),
    ],
  },
  {
    key: "first_week_win",
    title: "What would feel like a win in your first 7 days?",
    choices: [
      choice("breakfast", "Know what to change at breakfast"),
      choice("swaps", "Find 3–5 better grocery swaps"),
      choice("labels_habit", "Understand labels and improve one food habit"),
      choice("eat_more", "Build a simple list of foods to eat more often"),
      choice("age_clarity", "Feel clearer about what matters for my age"),
    ],
  },
  {
    key: "daily_time_commitment",
    title: "How much time would you realistically give to eating smarter each day?",
    supporting: "Small, useful decisions beat information overload.",
    progressNote: "Your plan is nearly ready",
    choices: [
      choice("3_min", "3 minutes"),
      choice("5_min", "5 minutes"),
      choice("10_min", "10 minutes"),
      choice("15_min", "15 minutes"),
      choice("few_weekly", "I’d rather learn a few times per week"),
    ],
  },
  {
    key: "future_self_reward",
    title: "Picture yourself 10 years from now. What would make you grateful you started today?",
    supporting: "Your future matters more than a perfect diet today.",
    progressNote: "Final question",
    choices: [
      choice("independent", "I’m still independent"),
      choice("strong_mobile", "I’m still strong and mobile"),
      choice("food_confidence", "I feel confident about how I eat"),
      choice("active_sharp", "I’m active, traveling, and mentally sharp"),
      choice("family_time", "I have more healthy time with my family"),
    ],
  },
];

export const emptyAnswers: OnboardingAnswers = Object.fromEntries([
  ...quizStepIds.map((key) => [key, ""]),
  ["first_name", ""],
  ["email", ""],
]) as unknown as OnboardingAnswers;

export function answerLabel(key: QuizAnswerKey, value: string): string {
  return quizSteps.find((step) => step.key === key)?.choices.find(
    (item) => item.value === value,
  )?.label ?? value;
}

export function ageFocus(value: string): string {
  const labels: Record<string, string> = {
    "40_49": "Your 40s and the decades ahead",
    "50_59": "Your 50s and the decades ahead",
    "60_69": "Your 60s and beyond",
    "70_plus": "Your 70s and beyond",
    caregiver: "You and the person you care for",
  };
  return labels[value] ?? "Your years ahead";
}

export function blockerPromise(value: string): string {
  const copy: Record<string, string> = {
    conflicting_advice: "Clarity without the nutrition noise.",
    age_relevance: "Food guidance selected for your stage of life.",
    time_convenience: "Practical food choices in a few focused minutes.",
    restriction: "Better choices without giving up every food you enjoy.",
    consistency: "Small repeatable decisions instead of another reset.",
  };
  return copy[value] ?? "A clearer path for everyday food decisions.";
}

export function recommendationsFor(answers: OnboardingAnswers): string[] {
  const focus: Record<string, string[]> = {
    heart_metabolic: [
      "A Smarter Plate for Heart and Metabolic Health",
      "How to Compare Sodium and Added Sugar on Food Labels",
      "Everyday Fibre Choices for Blood Sugar and Heart Health",
    ],
    blood_pressure: [
      "Everyday Foods That May Hide More Sodium Than You Think",
      "A Smarter Breakfast for Heart-Conscious Eating",
      "How to Compare Sodium on Two Food Labels",
    ],
    blood_sugar: [
      "How to Build a More Balanced Breakfast",
      "Where Added Sugar Hides on Everyday Labels",
      "Pairing Carbohydrates for a More Satisfying Meal",
    ],
    heart: [
      "Oats, Beans, and the Fibre Your Heart-Friendly Plate Needs",
      "Cooking Methods Worth Rethinking for Heart Health",
      "A Practical Guide to Unsaturated Fats",
    ],
    brain: [
      "The Colourful Foods Behind a Brain-Friendly Pattern",
      "A Better Grocery Basket for Healthy Aging",
      "How Food Patterns Support Heart and Brain Health Together",
    ],
    strength: [
      "Protein at 40+: How to Spread It Across Your Day",
      "A Grocery List for Strength-Supporting Meals",
      "Simple Meals for Recovery, Mobility, and Healthy Aging",
    ],
    healthy_aging: [
      "The Everyday Plate for Eating for the Years Ahead",
      "Five Foods Worth Adding More Often After 40",
      "How to Turn Healthy-Aging Advice Into One Daily Choice",
    ],
    unsure: [
      "Start Here: A Clearer Plate for the Years Ahead",
      "What to Eat More Often Without Overhauling Your Life",
      "The Food Label Basics That Matter Most",
    ],
  };
  const base = focus[answers.current_food_health_focus] ?? focus.unsure;
  const useCaseTitles: Record<string, string> = {
    breakfast: "Your Better-Breakfast Starting Guide",
    grocery: "Your First Smarter Grocery Checklist",
    swaps: "Five Realistic Swaps for Foods You Already Eat",
    labels: "The Two-Minute Food Label Check",
    preparation: "Cooking Methods That Preserve More of the Good Stuff",
    labels_preparation: "Read the Label, Then Prepare It Better",
    eat_more: "Foods to Put on Your Eat-More List",
    limit: "How to Decide What May Be Worth Limiting",
  };
  return [useCaseTitles[answers.first_food_use_case] ?? base[0], base[1], base[2]];
}

export function firstWeekPath(answers: OnboardingAnswers): string[] {
  const focus = answerLabel("current_food_health_focus", answers.current_food_health_focus);
  const useCase = answerLabel("first_food_use_case", answers.first_food_use_case);
  return [
    `Day 1 — Start with ${useCase.toLowerCase()}`,
    `Day 2 — One overlooked detail about ${focus.toLowerCase()}`,
    "Day 3 — Make one realistic food swap",
    "Day 4 — Add one food worth eating more often",
    "Day 5 — Use a two-minute grocery check",
    "Day 6 — Prepare one familiar food differently",
    "Day 7 — Review your Healthy Years progress",
  ];
}
