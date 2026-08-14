import type { LongrArticle } from "../app/articles/types";
import { getAdminFirestore } from "./firebase-admin";

export interface LongrArticleDoc extends LongrArticle {
  id: number;
  featured: boolean;
}

export interface ArticlesResult {
  articles: LongrArticle[];
  featuredArticles: LongrArticle[];
}

function toArticle(document: LongrArticleDoc): LongrArticle {
  const article = { ...document } as Partial<LongrArticleDoc>;
  delete article.featured;
  return article as LongrArticle;
}

export async function getArticles(): Promise<ArticlesResult> {
  const db = getAdminFirestore();

  if (!db) {
    console.error(
      "Firebase Admin SDK is not configured. Add firebase-service-account.json " +
        "to the project root or set the FIREBASE_SERVICE_ACCOUNT environment variable. " +
        "Articles cannot be read from Firestore.",
    );
    return { articles: [], featuredArticles: [] };
  }

  try {
    const snapshot = await db
      .collection("articles")
      .orderBy("id", "asc")
      .get();

    if (snapshot.empty) {
      console.error(
        "The Firestore 'articles' collection is empty. Run 'npm run db:seed' " +
          "to publish articles.",
      );
      return { articles: [], featuredArticles: [] };
    }

    const documents = snapshot.docs.map(
      (document) => document.data() as LongrArticleDoc,
    );
    const articles = documents.map(toArticle);
    const featured = documents
      .filter((document) => document.featured)
      .map(toArticle);

    return {
      articles,
      featuredArticles: featured,
    };
  } catch (error) {
    console.error(
      "Failed to read articles from Firestore.",
      error,
    );
    return { articles: [], featuredArticles: [] };
  }
}
