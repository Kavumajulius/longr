import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getArticles();
  return NextResponse.json(data);
}
