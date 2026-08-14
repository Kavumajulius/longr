import { articles } from "../app/articles/index";
import { getAdminFirestore } from "../lib/firebase-admin";

async function main() {
  const db = getAdminFirestore();
  if (!db) {
    console.error(
      "Firebase Admin SDK is not configured. Add firebase-service-account.json " +
        "to the project root or set the FIREBASE_SERVICE_ACCOUNT environment variable.",
    );
    process.exit(1);
  }

  for (const article of articles) {
    const docId = String(article.id);
    await db.collection("articles").doc(docId).set({
      ...article,
      featured: article.featured === true,
    });
    console.log(`Seeded article ${docId}: ${article.headline}`);
  }

  const featuredCount = articles.filter((article) => article.featured).length;
  console.log(
    `Seeded ${articles.length} articles into Firestore (${featuredCount} featured).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
