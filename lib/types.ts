export type Product = {
  id: string;
  rank: number;
  title: string;
  price: number;
  img: string;
  isFull: boolean;
  link: string;

  // Best-effort (scraping): puede venir vacío según el HTML.
  sellerName?: string;
  soldQty?: number;
  soldText?: string;
};
