import type { LongrArticle } from "./types";
import { cardioArticles } from "./cardio";
import { strengthArticles } from "./strength";
import { recoveryArticles } from "./recovery";
import { nutritionArticles } from "./nutrition";
import { mindfulnessArticles } from "./mindfulness";
import { sleepArticles } from "./sleep";
import { longevityArticles } from "./longevity";
import { gutHealthArticles } from "./gut-health";
import { hydrationArticles } from "./hydration";
import { fastingArticles } from "./fasting";
import { antiInflammatoryArticles } from "./anti-inflammatory";
import { heartHealthArticles } from "./heart-health";
import { brainHealthArticles } from "./brain-health";
import { immunityArticles } from "./immunity";
import { hormoneBalanceArticles } from "./hormone-balance";
import { skinHealthArticles } from "./skin-health";
import { boneHealthArticles } from "./bone-health";
import { metabolismArticles } from "./metabolism";
import { weightManagementArticles } from "./weight-management";
import { stressReliefArticles } from "./stress-relief";
import { breathworkArticles } from "./breathwork";
import { yogaArticles } from "./yoga";
import { mobilityArticles } from "./mobility";
import { supplementsArticles } from "./supplements";
import { superfoodsArticles } from "./superfoods";
import { plantBasedArticles } from "./plant-based";
import { proteinArticles } from "./protein";
import { antioxidantsArticles } from "./antioxidants";
import { detoxArticles } from "./detox";
import { coldTherapyArticles } from "./cold-therapy";
import { saunaHeatArticles } from "./sauna-heat";
import { blueZonesArticles } from "./blue-zones";
import { circadianHealthArticles } from "./circadian-health";
import { meditationArticles } from "./meditation";

const groups: LongrArticle[][] = [
  cardioArticles,
  strengthArticles,
  recoveryArticles,
  nutritionArticles,
  mindfulnessArticles,
  sleepArticles,
  longevityArticles,
  gutHealthArticles,
  hydrationArticles,
  fastingArticles,
  antiInflammatoryArticles,
  heartHealthArticles,
  brainHealthArticles,
  immunityArticles,
  hormoneBalanceArticles,
  skinHealthArticles,
  boneHealthArticles,
  metabolismArticles,
  weightManagementArticles,
  stressReliefArticles,
  breathworkArticles,
  yogaArticles,
  mobilityArticles,
  supplementsArticles,
  superfoodsArticles,
  plantBasedArticles,
  proteinArticles,
  antioxidantsArticles,
  detoxArticles,
  coldTherapyArticles,
  saunaHeatArticles,
  blueZonesArticles,
  circadianHealthArticles,
  meditationArticles,
];

const FEATURED_CATEGORIES = [
  "Heart Health",
  "Brain Health",
  "Nutrition",
  "Sleep",
  "Strength",
  "Gut Health",
];

let nextId = 1;

export const articles: LongrArticle[] = groups.flatMap((group) =>
  group.map((article) => ({
    ...article,
    id: nextId++,
    featured: FEATURED_CATEGORIES.includes(article.category)
      ? article.badge === "live"
      : false,
  })),
);

export const featuredArticles: LongrArticle[] = articles.filter(
  (article) => article.featured,
);
