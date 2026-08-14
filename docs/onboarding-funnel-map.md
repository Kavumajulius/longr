# LONGR onboarding refinement map

This map was completed before implementation. The attached Coursiv-inspired
LONGR funnel is the source of truth.

| Required stage | Current equivalent | Decision |
| --- | --- | --- |
| 1. Age bracket | `age` at position 5, includes under-40 groups | Move to first; replace choices with 40+ and caregiver options |
| 2. Main future goal | Generic `goal` at position 3 | Reuse the card pattern; replace copy and values |
| 3. Current health/food focus | No equivalent | Add |
| 4. Healthy-eating overwhelm | No equivalent | Add |
| 5. Food-choice confidence | No equivalent | Add |
| 6. Future regret | No equivalent | Add |
| 7. Current eating approach | Generic `diet` | Replace diet labels with non-judgmental behavioral choices |
| 8. Primary blocker | No equivalent | Add and use in value proposition/paywall |
| 9. Life/health context | No equivalent | Add as optional, broad non-diagnostic context |
| 10. First food decision | Generic `path` | Replace with the document’s practical use cases |
| 11. Deep future priority | No equivalent | Add |
| 12. Previous attempts | Generic `source` | Replace with food-learning methods |
| 13. Guidance readiness | No equivalent | Add |
| 14. First 7-day win | No equivalent | Add and use as the first-week path |
| 15. Daily commitment | Numeric scale | Replace with realistic time choices |
| 16. Future-self reward | No equivalent | Add |
| 17. Name capture | Currently first | Move after the 16 quiz screens |
| 18. Healthy Years Profile | Generic results/score | Replace the unvalidated score with a non-clinical profile |
| 19. Personalized plan | Partial generic 7-day plan | Build from goal, focus, use case, blocker, and first-week win |
| 20. Email capture | Currently second | Move after plan preview; preserve account creation separately |
| 21. Personalized paywall | Generic three-plan paywall | Keep Whop checkout; personalize recap, previews, value stack, first-week goal, and CTA |

## Reused production functionality

- Existing landing screen and navigation shell
- Existing responsive design language and assets
- Firebase authentication and Firestore profile persistence
- Whop checkout route and embedded checkout
- Existing hub route and post-payment redirect

## Removed or replaced

- The unvalidated “longevity score” and score calculation
- Under-40 onboarding choices
- Generic diet/activity/restriction quiz ordering
- Generic result and paywall copy
- Personalization that did not affect recommendations

## Reference-led offer and checkout refinement

After email capture and before the personalized paywall, Longr now uses the supplied offer sequence:

1. Spin the welcome wheel (10%–35% possible introductory discount).
2. Claim the awarded discount in a focused confirmation modal.
3. Review 1-week, 4-week, and annual membership options.
4. Open secure Whop checkout with the introductory price applied to the first billing period.
5. If checkout is closed, offer an additional 10% introductory discount, capped at 60%.
6. If the ten-minute timer expires, restore the regular first-period price.

The regular renewal price and cadence remain visible throughout. Unsupported enrollment counts, testimonials, and health-result claims visible in the references were intentionally not reproduced.
