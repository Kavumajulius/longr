import type { Badge, Category } from "../longr-data";

export interface LongrActionItem {
  title: string;
  whyLongrCares: string;
  whatToChooseInstead: string;
  prepareItThisWay: string;
  insteadOf: string;
  tryThis: string;
  longrTip: string;
  whyFutureSelfCares: string;
}

export interface LongrArticle {
  id?: number;
  headline: string;
  subheadline: string;
  healthStakes: string;
  actionList: LongrActionItem[];
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  relatedIdeas: string[];
  sources: string[];
  image: string;
  category: Category;
  badge: Badge;
  readTime: string;
  featured?: boolean;
}

export const FEATURED_HEADLINES: string[] = [];
