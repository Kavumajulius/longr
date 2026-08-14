import LongrHub from "../LongrHub";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function Hub() {
  const { articles, featuredArticles } = await getArticles();
  return (
    <LongrHub articles={articles} featuredArticles={featuredArticles} />
  );
}
