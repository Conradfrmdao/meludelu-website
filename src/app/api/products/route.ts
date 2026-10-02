import { NextResponse, type NextRequest } from "next/server";
import { getProductsBySlugs } from "@/lib/catalog";

// Public product lookup by slug (used by the wishlist). Reads the storefront view only.
export async function GET(request: NextRequest) {
  const slugs = (request.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,120}$/.test(s));
  const products = await getProductsBySlugs(slugs);
  return NextResponse.json({ products });
}
