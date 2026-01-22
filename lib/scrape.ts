import * as cheerio from "cheerio";
import { Product } from "./types";

export function scrapeProductsFromHtml(html: string, baseUrl: string): Product[] {
  const $ = cheerio.load(html);
  const cards = $(".ui-search-result__wrapper, .poly-card");
  const out: Product[] = [];

  cards.each((idx, el) => {
    const node = $(el);

    const title =
      node.find("h2, .poly-component__title").first().text().trim() ||
      node.find("a[title]").first().attr("title")?.trim() ||
      "Producto";

    // Link
    let link =
      node
        .find("a")
        .filter((_, a) => {
          const href = $(a).attr("href") || "";
          return href.startsWith("http");
        })
        .first()
        .attr("href") || "";
    if (link && link.startsWith("/")) link = new URL(link, baseUrl).toString();

    // Image
    const img =
      node.find("img").first().attr("data-src") ||
      node.find("img").first().attr("src") ||
      "";

    // Price
    const priceText =
      node.find(".andes-money-amount__fraction").first().text().trim() ||
      node.find("[aria-label*='$']").first().attr("aria-label")?.trim() ||
      "";
    const price = parsePrice(priceText);

    // Full (heuristic)
    const htmlChunk = node.html() || "";
    const isFull =
      /fulfillment/i.test(htmlChunk) ||
      /\bfull\b/i.test(node.text()) ||
      /env[ií]o full/i.test(node.text());

    // Seller (best-effort): depende del template
    const sellerName =
      pickText(
        node.find(".ui-search-official-store-label").first().text(),
        node.find(".ui-search-item__group__element .ui-search-official-store-label").first().text(),
        node.find(".poly-component__seller").first().text(),
        node.find("[aria-label*='Vendido por']").first().attr("aria-label"),
        node.find("[aria-label*='vendido por']").first().attr("aria-label"),
      ) || undefined;

    // Sold qty / text (best-effort): suele aparecer como "X vendidos"
    const soldCandidate =
      pickText(
        node.find(".ui-search-item__group__element--highlight").text(),
        node.find(".ui-search-item__group__element").text(),
        node.find(".poly-reviews__total").text(),
        node.text(),
      ) || "";
    const { soldQty, soldText } = parseSoldInfo(soldCandidate);

    const id = link || node.attr("id") || node.find("[data-id]").first().attr("data-id") || safeIdFromLink(title + "-" + idx);

  out.push({
      id,
      rank: idx + 1,
      title,
      price,
      img,
      isFull,
      link: link || baseUrl,
      sellerName: cleanSeller(sellerName),
      soldQty,
      soldText,
    });
  });

  return out.filter((p) => p.title && p.price >= 0);
}

function pickText(...cands: Array<string | undefined | null>) {
  for (const c of cands) {
    const t = (c || "").toString().trim();
    if (t) return t;
  }
  return "";
}

function parsePrice(s: string) {
  if (!s) return 0;
  const m = s.match(/[0-9][0-9\.,]*/);
  if (!m) return 0;
  const raw = m[0].replaceAll(".", "").replaceAll(",", "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parseSoldInfo(text: string): { soldQty?: number; soldText?: string } {
  const t = (text || "").replace(/\s+/g, " ").trim();

  const more = t.match(/m[aá]s de\s+([0-9\.]+)\s+vendid/i);
  if (more?.[1]) {
    const qty = Number(more[1].replaceAll(".", ""));
    if (Number.isFinite(qty)) return { soldQty: qty, soldText: `Más de ${qty.toLocaleString("es-AR")} vendidos` };
    return { soldText: more[0] };
  }

  const m = t.match(/([0-9\.]+)\s+vendid/i);
  if (m?.[1]) {
    const qty = Number(m[1].replaceAll(".", ""));
    if (Number.isFinite(qty)) return { soldQty: qty, soldText: `${qty.toLocaleString("es-AR")} vendidos` };
    return { soldText: m[0] };
  }

  return {};
}

function cleanSeller(s?: string) {
  if (!s) return undefined;
  const t = s.replace(/^vendido por\s*/i, "").trim();
  return t || undefined;
}

function safeIdFromLink(link: string) {
  try {
    const u = new URL(link);
    return u.pathname.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60);
  } catch {
    return link.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60);
  }
}
