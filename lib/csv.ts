import { Product } from "./types";

export function productsToCsv(products: Product[]) {
  const header = ["Ranking", "Titulo", "Precio", "Full", "Link"].join(";");
  const rows = products.map(p => [
    p.rank,
    sanitize(p.title),
    p.price,
    p.isFull ? "SI" : "NO",
    p.link
  ].join(";"));
  return [header, ...rows].join("\n");
}

function sanitize(s: string) {
  return s.replaceAll(";", ",");
}
