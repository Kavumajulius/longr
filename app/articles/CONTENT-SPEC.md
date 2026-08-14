# LONGR Article Content Specification

This file is the strict authoring contract for every LONGR article. Follow it
**exactly**. Do not invent your own structure, headings, or field names.

## Files to read before writing

1. `app/articles/types.ts` — the exact TypeScript types you must satisfy.
2. `app/articles/heart-health.ts` — a complete exemplar category file showing the
   exact expected quality, length, and style. Mirror it.
3. `app/articles/images.ts` — the verified Unsplash image pool. Only use URLs from
   this file.
4. `Longr-Article-Plan.md` — the full LONGR master plan (headline engine, article
   structure, tone, medical safety rules, evidence standard).
5. `app/longr-data.ts` — the exact `Category` and `Badge` type values.

## The interface you must satisfy

Each category file must export a named array:

```ts
import type { LongrArticle } from "./types";
import { IMAGES } from "./images";

export const yourCategoryArticles: LongrArticle[] = [ /* exactly 5 articles */ ];
```

`LongrArticle` fields:

| Field | Meaning | Rules |
|---|---|---|
| `headline` | The article headline | Longr Headline Engine: WHO + HEALTH THREAT/DESIRE + SPECIFICITY + CURIOSITY + CONTROL. Use an age (40+, 50+, 60+, 70+) wherever it fits. 6–14 words. Never invent statistics. Never promise a cure or a number of extra years. |
| `subheadline` | Short deck | 1–2 sentences. Say why it matters and promise an actionable answer. |
| `healthStakes` | The Health Stakes section | 80–150 words. What the issue is, why it matters for this age group, how food influences it. End by pivoting to "The good news is…" / "the practical thing is…". Calm, not alarmist. |
| `actionList` | The Longr Action List | Exactly 5 items (see below). |
| `ctaHeading` | CTA heading | Non-salesy. Usually "Know what to change next." or "You're eating today. But are you eating for the years ahead?" |
| `ctaBody` | CTA body | One sentence inviting the reader to tell Longr their age, goals, and concerns. |
| `ctaButton` | CTA button label | "Build My Longr Plan →" or "Check My Eating →". |
| `relatedIdeas` | 3 related headlines | 3 complete Longr headlines, same style, same category or adjacent. |
| `sources` | Evidence notes | 3 short lines naming reputable source types (e.g. WHO, AHA, Dietary Guidelines, Cochrane, FDA, EFSA). No fake study titles. |
| `image` | Hero image | A relevant URL from `app/articles/images.ts` — pick the subject group that matches the article topic. |
| `category` | Category | The exact `Category` value you were assigned. |
| `badge` | Badge | Rotate between `"new"`, `"hot"`, `"live"` across the 5 articles so all three appear. |
| `readTime` | Read time | `"5-min read"`. |
| `featured` | Leave unset | Do not set this field. |

## Each actionList item (exactly 5 per article)

```ts
{
  title: string,                // A food, habit, or mistake, e.g. "Sugary breakfast cereal"
  whyLongrCares: string,        // 1-3 sentences. Simple biological/nutritional explanation. No exaggerated claims.
  whatToChooseInstead: string,  // 1-2 sentences. A specific, realistic better choice.
  prepareItThisWay: string,     // 1-2 sentences. Specific preparation (bake/grill/steam/roast), watch added salt/sugar/butter/cream.
  insteadOf: string,            // Short: the common choice. e.g. "sugary breakfast cereal"
  tryThis: string,              // Short: the better alternative. e.g. "oats with berries, nuts, and plain yogurt"
  longrTip: string,             // One short, memorable action. e.g. "Check sodium per serving, not the front of the box."
  whyFutureSelfCares: string,   // One sentence linking the habit to long-term health (independence, heart, brain, mobility, quality of life).
}
```

## Hard rules (from Longr-Article-Plan.md — do not violate)

- Emotional arc is FEAR → RELEVANCE → SOLUTION → HOPE. Never end in fear.
- Specific food advice. Never "eat healthy foods" or "reduce processed food" — name
  the food, the swap, and the preparation.
- Calm, responsible language: "may support", "is associated with", "can help
  support", "evidence suggests". Never "prevents", "cures", "adds 10 years".
- Never tell readers to stop medication or replace treatment with food. Where
  medication, kidney disease, diabetes, or anticoagulants are relevant, add a brief
  note that individual advice may differ and to check with a clinician or dietitian.
- Do not fabricate studies, statistics, expert quotes, or personal stories.
- 5 action items per article. Health stakes 80–150 words. Headlines 6–14 words.
- Write for an intelligent adult 40+ who doesn't want a textbook. Short paragraphs,
  concrete foods, concrete swaps, concrete preparation.

## File conventions

- Filename: `app/articles/<kebab-case-category>.ts`
- Export name: `<pascalCategory>Articles`
- One article per object in the array. Exactly 5.
- `image` must be an entry from `app/articles/images.ts` (import `IMAGES`).
- Do NOT add comments to the code.
- Do NOT run tsc, eslint, tests, or the dev server. Only write the file.

## Self-check before finishing

For every article verify:
- [ ] headline 6–14 words, includes an age or audience signal, has stakes, offers control
- [ ] subheadline is 1–2 sentences
- [ ] healthStakes is 80–150 words and ends hopeful
- [ ] exactly 5 action items, each with all 8 fields
- [ ] no fake statistics, no "cure"/"prevent" claims, no fabricated studies
- [ ] image subject matches the article topic
- [ ] category is exactly the assigned value
- [ ] badges rotate (new / hot / live all appear across the 5)
- [ ] all 5 articles are genuinely distinct topics within the category
