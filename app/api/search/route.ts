import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/meliToken";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

function clampLimit(n: number) {
  if (n === 0) return 0; // ver todo
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 100) return 100;
  return 100;
}

function mapApiResultToProduct(item: any, idx: number): Product {
  const price = Number(item?.price || 0);
  const sold = Number.isFinite(Number(item?.sold_quantity)) ? Number(item.sold_quantity) : undefined;

  return {
    id: String(item?.permalink || item?.id || `${idx}`),
    rank: idx + 1,
    title: String(item?.title || "Producto"),
    price: Number.isFinite(price) ? price : 0,
    img: String(item?.thumbnail || ""),
    isFull: item?.shipping?.logistic_type === "fulfillment",
    link: String(item?.permalink || ""),
    sellerName: item?.seller?.nickname || undefined,
    soldQty: sold,
    soldText: sold !== undefined ? `${sold.toLocaleString("es-AR")} vendidos` : undefined,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limitParam = Number(searchParams.get("limit") || "20");
  const limit = clampLimit(Number.isFinite(limitParam) ? limitParam : 20);

  if (!q) return NextResponse.json({ ok: false, error: "Falta q" }, { status: 400 });

  const siteId = process.env.MELI_SITE_ID || "MLA";

  let accessToken = "";
  try {
    const t = await getAccessToken();
    accessToken = t.accessToken;
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falta configurar OAuth de MercadoLibre (token).",
        detail: e?.message || String(e),
        hint: "Abrí /api/auth/start para autorizar y luego guardá MELI_REFRESH_TOKEN en .env.local / Vercel.",
      },
      { status: 500 }
    );
  }

  const perPage = limit === 0 ? 50 : Math.min(limit, 50);
  const hardMax = limit === 0 ? 200 : limit;
  const maxPages = Math.ceil(hardMax / perPage);

  const products: Product[] = [];

  for (let page = 0; page < maxPages; page++) {
    const offset = page * perPage;
    const url = new URL(`https://api.mercadolibre.com/sites/${siteId}/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(perPage));
    url.searchParams.set("offset", String(offset));

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: "Error consultando MercadoLibre API", status: r.status, url: url.toString(), detail: data },
        { status: 502 }
      );
    }

    const results = Array.isArray((data as any)?.results) ? (data as any).results : [];
    if (results.length === 0) break;

    for (let i = 0; i < results.length; i++) {
      products.push(mapApiResultToProduct(results[i], products.length));
      if (products.length >= hardMax) break;
    }

    if (products.length >= hardMax) break;
    if (results.length < perPage) break;
  }

  const sorted = [...products]
    .sort((a, b) => (b.soldQty || 0) - (a.soldQty || 0))
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  return NextResponse.json({ ok: true, q, products: sorted, source: "meli-api", siteId, appliedLimit: limit, total: sorted.length });
}
