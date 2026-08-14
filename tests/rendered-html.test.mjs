import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function readHubProduct() {
  const articleDir = new URL("../app/articles/", import.meta.url);
  const { readdir } = await import("node:fs/promises");
  const articleFiles = (await readdir(articleDir)).filter(
    (name) => name.endsWith(".ts") && !["index.ts", "types.ts", "images.ts"].includes(name),
  );
  const [layout, hub, ...articles] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/LongrHub.tsx", import.meta.url), "utf8"),
    ...articleFiles.map((name) => readFile(new URL(name, articleDir), "utf8")),
  ]);
  return { layout, hub, articles: articles.join("\n") };
}

test("builds the LONGR hub with the Longr Article Plan layout", async () => {
  const { layout, hub, articles } = await readHubProduct();
  assert.match(layout, /LONGR - Your Daily Longevity Feed/i);
  assert.match(hub, /FEATURED ARTICLES/);
  assert.match(hub, /DAILY LONGEVITY FEED/);
  assert.match(articles, /Worried About Blood Pressure At 50/);
  assert.match(hub, /article\.readTime/);

  const headlines = [
    ...articles.matchAll(/^\s*headline:\s*\n?\s*"([^"]+)"/gm),
  ].map((match) => match[1]);

  assert.ok(headlines.length >= 150, `Expected many card headlines, got ${headlines.length}`);
  assert.equal(new Set(headlines).size, headlines.length);
  for (const headline of headlines) {
    const wordCount = headline.trim().split(/\s+/).filter(Boolean).length;
    assert.ok(
      wordCount >= 6 && wordCount <= 18,
      `Expected a readable 6-18 word headline, received ${wordCount}: ${headline}`,
    );
    assert.match(headline, /[A-Za-z]/);
  }
  assert.doesNotMatch(`${layout}${hub}`, /codex-preview|Building your site|SkeletonPreview/i);
});

test("uses typed data and removes all disposable preview code", async () => {
  const [hub, types, index, images, data, packageJson] = await Promise.all([
    readFile(new URL("../app/LongrHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/articles/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/articles/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/articles/images.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/longr-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(hub, /^"use client";/);
  assert.match(hub, /useState<LongrArticle \| null>/);
  assert.match(hub, /longr-saved-articles/);
  assert.match(hub, /browseArticleCategory/);
  assert.match(hub, /article-category-grid/);
  assert.match(hub, /Share on LinkedIn/);
  assert.match(hub, /FaLinkedinIn/);
  assert.match(hub, /FaWhatsapp/);
  assert.match(hub, /FaXTwitter/);
  assert.match(hub, /FaFacebookF/);
  assert.match(hub, /linkedin\.com\/sharing\/share-offsite/);
  assert.match(hub, /navigator\.clipboard\.writeText/);
  assert.match(hub, /The Health Stakes/);
  assert.match(hub, /The Longr Action List/);
  assert.match(hub, /longr-action-list/);
  assert.match(hub, /Why Longr cares/);
  assert.match(hub, /What to choose instead/);
  assert.match(hub, /Prepare it this way/);
  assert.match(hub, /The simple swap/);
  assert.match(hub, /Longr Tip/);
  assert.match(hub, /Why your future self cares/);
  assert.match(hub, /relatedIdeas/);
  assert.match(hub, /sources/);

  assert.match(types, /export interface LongrArticle/);
  assert.match(types, /headline: string/);
  assert.match(types, /subheadline: string/);
  assert.match(types, /healthStakes: string/);
  assert.match(types, /actionList: LongrActionItem\[\]/);
  assert.match(types, /ctaHeading: string/);
  assert.match(types, /relatedIdeas: string\[\]/);
  assert.match(types, /sources: string\[\]/);
  assert.match(types, /image: string/);

  assert.match(index, /export const articles: LongrArticle\[\]/);
  assert.match(index, /export const featuredArticles: LongrArticle\[\]/);
  assert.match(index, /heartHealthArticles/);
  assert.match(index, /brainHealthArticles/);

  assert.match(images, /images\.unsplash\.com/);

  assert.match(data, /export type Category/);
  assert.match(data, /export const categories/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("app/hvco-content.ts", templateRoot)),
  );
  await access(new URL("public/og.png", templateRoot));
});

test("implements the complete personalized LONGR onboarding funnel", async () => {
  const [onboarding, data, quiz, paywall, analytics, map] = await Promise.all([
    readFile(new URL("../components/onboarding/Onboarding.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/onboarding/onboarding-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/onboarding/QuizSteps.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/whop/Paywall.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/onboarding-analytics.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/onboarding-funnel-map.md", import.meta.url), "utf8"),
  ]);

  const requiredFields = [
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
  ];
  let cursor = -1;
  for (const field of requiredFields) {
    const index = data.indexOf(`"${field}"`);
    assert.ok(index > cursor, `Expected ${field} in chronological order`);
    cursor = index;
  }

  assert.match(onboarding, /"name"[\s\S]*"profile"[\s\S]*"plan"[\s\S]*"email"[\s\S]*"discount"[\s\S]*"pricing"/);
  assert.match(onboarding, /HealthyYearsProfile/);
  assert.match(onboarding, /PersonalizedPlan/);
  assert.match(onboarding, /recommendationsFor\(finalAnswers\)/);
  assert.match(onboarding, /firstWeekPath\(finalAnswers\)/);
  assert.match(onboarding, /healthyYearsProfile/);
  assert.doesNotMatch(onboarding, /calculateScore|longrScore|Longevity Score/);
  assert.match(quiz, /Question \{stepNumber\} is used for content personalization/);
  assert.match(paywall, /Your first 7-day goal/);
  assert.match(paywall, /Recommended for you/);
  assert.match(paywall, /Information you can use without the hype/);
  assert.match(paywall, /Get My Longr Plan/);
  assert.match(paywall, /abandonment_offer_accepted/);
  assert.match(paywall, /introductory discount applies only to the first billing period/);
  assert.match(analytics, /longrOnboardingEvents/);
  assert.match(analytics, /device_type/);
  assert.match(map, /21\. Personalized paywall/);
});
