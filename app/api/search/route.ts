import { NextResponse } from "next/server";
import { scrapeProductsFromHtml } from "@/lib/scrape";
import { scrapeProductsFromEmbeddedJson } from "@/lib/scrapeEmbedded";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

function looksLikeListing(html: string) {
  return /ui-search-result__wrapper|poly-card|andes-money-amount/i.test(html);
}

function looksLikeHardBlock(html: string) {
  return /access denied|forbidden|captcha|recaptcha|robot check|unusual traffic/i.test(html);
}

function clampLimit(n: number) {
  if (n === 0) return 0; // ver todo
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 100) return 100;
  return 100;
}

function buildUrl(slug: string, desde: number) {
  return desde <= 1
    ? `https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}`
    : `https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}_Desde_${desde}`;
}

async function fetchHtml(url: string) {
  const r = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "es-AR,es;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await r.text();
  return { r, html };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limitParam = Number(searchParams.get("limit") || "20");
  const limit = clampLimit(Number.isFinite(limitParam) ? limitParam : 20);

  if (!q) return NextResponse.json({ ok: false, error: "Falta q" }, { status: 400 });

  const slug = q.replace(/\s+/g, "-");

  // Por estabilidad: "Ver todo" = máximo 200 (4 páginas de 50).
  const hardMax = limit === 0 ? 200 : limit;
  const pageSize = 50;
  const maxPages = Math.ceil(hardMax / pageSize);

  const productsMap = new Map<string, Product>();
  let lastUpstreamStatus: number | undefined = undefined;
  let lastUrl = "";

  try {
    for (let page = 0; page < maxPages; page++) {
      const desde = page * pageSize + 1;
      const listingUrl = buildUrl(slug, desde);
      lastUrl = listingUrl;

      const { r, html } = await fetchHtml(listingUrl);
      lastUpstreamStatus = r.status;

      const hasListing = looksLikeListing(html);

      // Bloqueo duro
      if (!hasListing && looksLikeHardBlock(html)) {
        return NextResponse.json(
          { ok: false, error: "Bloqueo anti-bot detectado", status: r.status, url: listingUrl, detail: html.slice(0, 900) },
          { status: 502 }
        );
      }

      // Intento 1: cards HTML
      let pageProducts = scrapeProductsFromHtml(html, "https://www.mercadolibre.com.ar/");

      // Intento 2: JSON embebido
      if (pageProducts.length === 0) {
        pageProducts = scrapeProductsFromEmbeddedJson(html);
      }

      // Si no hay data y status no OK => error.
      if (!r.ok && pageProducts.length === 0) {
        return NextResponse.json(
          { ok: false, error: "MercadoLibre bloqueó o falló la respuesta", status: r.status, url: listingUrl, detail: html.slice(0, 900) },
          { status: 502 }
        );
      }

      // Si no hay data, cortamos paginación.
      if (pageProducts.length === 0) break;

      for (const p of pageProducts) {
        const key = p.id || p.link;
        if (!productsMap.has(key)) productsMap.set(key, p);
      }

      if (productsMap.size >= hardMax) break;
    }

    const products = Array.from(productsMap.values());

    if (products.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudieron extraer productos. MercadoLibre devolvió una página sin resultados visibles para scraping (renderizado por JS o bloqueo silencioso).",
          status: lastUpstreamStatus,
          url: lastUrl || buildUrl(slug, 1),
        },
        { status: 502 }
      );
    }

    const sorted = [...products].sort((a, b) => (b.soldQty || 0) - (a.soldQty || 0));
    const sliced = (limit === 0 ? sorted.slice(0, hardMax) : sorted.slice(0, limit)).map((p, idx) => ({ ...p, rank: idx + 1 }));

    return NextResponse.json({
      ok: true,
      q,
      products: sliced,
      source: "html-scrape+embedded-json",
      url: buildUrl(slug, 1),
      upstreamStatus: lastUpstreamStatus,
      requestedLimit: limitParam,
      appliedLimit: limit,
      totalFound: products.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Error de red haciendo scraping", detail: e?.message || String(e), url: lastUrl || buildUrl(slug, 1) },
      { status: 502 }
    );
  }
}
