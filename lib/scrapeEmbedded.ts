import { Product } from "./types";

/**
 * Best-effort extractor: intenta encontrar un objeto JSON embebido en scripts (por ejemplo window.__PRELOADED_STATE__)
 * y mapearlo a una lista de productos (results/items).
 *
 * Nota: MercadoLibre cambia con frecuencia el HTML/estado. Esto es heurístico.
 */
export function scrapeProductsFromEmbeddedJson(html: string): Product[] {
  const candidates: any[] = [];

  // 1) window.__PRELOADED_STATE__ = { ... };
  const preloaded = extractWindowAssignedObject(html, ".__PRELOADED_STATE__");
  if (preloaded) candidates.push(preloaded);

  // 2) Otros patrones comunes (si aparecen)
  const initialState = extractWindowAssignedObject(html, ".__INITIAL_STATE__");
  if (initialState) candidates.push(initialState);

  // 3) Buscar cualquier "results":[ ... ] grande dentro de scripts json (heurístico)
  const resultsObj = extractFirstJsonObjectContaining(html, '"results"');
  if (resultsObj) candidates.push(resultsObj);

  // Buscar arrays con items y mapearlos
  for (const c of candidates) {
    const arr = findResultsArray(c);
    if (arr && Array.isArray(arr) && arr.length) {
      const mapped = arr.map(mapItemToProduct).filter(Boolean) as Product[];
      if (mapped.length) {
        // rank por orden recibido
        return mapped.map((p, idx) => ({ ...p, rank: idx + 1 }));
      }
    }
  }

  return [];
}

function mapItemToProduct(item: any): Product | null {
  if (!item || typeof item !== "object") return null;

  const title = item.title || item.name;
  const link = item.permalink || item.url || item.link;
  const price = Number(item.price ?? item.price_amount ?? 0);
  const img = item.thumbnail || item.image || item.picture || "";
  const isFull =
    item.shipping?.logistic_type === "fulfillment" ||
    /fulfillment/i.test(JSON.stringify(item.shipping || {})) ||
    /fulfillment/i.test(JSON.stringify(item));

  const sellerName =
    item.seller?.nickname ||
    item.seller?.name ||
    item.seller_name ||
    item.store?.name ||
    undefined;

  const soldQtyRaw = item.sold_quantity ?? item.soldQuantity ?? item.sold ?? item.sales ?? undefined;
  const soldQty = Number.isFinite(Number(soldQtyRaw)) ? Number(soldQtyRaw) : undefined;
  const soldText = soldQty !== undefined ? `${soldQty.toLocaleString("es-AR")} vendidos` : undefined;

  if (!title || !link) return null;

  return {
    id: String(link),
    rank: 0,
    title: String(title),
    price: Number.isFinite(price) ? price : 0,
    img: String(img),
    isFull: Boolean(isFull),
    link: String(link),
    sellerName: sellerName ? String(sellerName) : undefined,
    soldQty,
    soldText,
  };
}

function findResultsArray(obj: any): any[] | null {
  // DFS buscando propiedad "results" o "items" que sea array
  const stack = [obj];
  const seen = new Set<any>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    if (Array.isArray((cur as any).results)) return (cur as any).results;
    if (Array.isArray((cur as any).items)) return (cur as any).items;

    for (const k of Object.keys(cur)) {
      const v = (cur as any)[k];
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return null;
}

function extractWindowAssignedObject(html: string, propSuffix: string): any | null {
  const idx = html.indexOf(`window${propSuffix}`);
  if (idx === -1) return null;

  const eq = html.indexOf("=", idx);
  if (eq === -1) return null;

  const startBrace = html.indexOf("{", eq);
  if (startBrace === -1) return null;

  const jsonText = extractBalancedBraces(html, startBrace);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function extractFirstJsonObjectContaining(html: string, needle: string): any | null {
  const pos = html.indexOf(needle);
  if (pos === -1) return null;

  const start = html.lastIndexOf("{", pos);
  if (start === -1) return null;

  const jsonText = extractBalancedBraces(html, start);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function extractBalancedBraces(s: string, start: number): string | null {
  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch as any;
      continue;
    }

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}
