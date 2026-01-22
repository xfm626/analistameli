"use client";

import Image from "next/image";
import { Product } from "@/lib/types";

export function ProductCard({
  product,
  isCompared,
  onToggleCompare,
}: {
  product: Product;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition hover:border-blue-400 hover:shadow-soft">
      <div className="absolute left-3 top-3 rounded bg-meliYellow px-2 py-0.5 text-xs font-bold text-meliBlue">
        #{product.rank}
      </div>

      <button
        type="button"
        aria-label="Comparar"
        onClick={() => onToggleCompare(product.id)}
        className={["absolute right-3 top-3 text-lg transition", isCompared ? "grayscale-0" : "grayscale"].join(" ")}
        title={isCompared ? "Quitar de comparador" : "Agregar al comparador"}
      >
        ⚖️
      </button>

      <div className="mb-3 mt-6 flex justify-center">
        <div className="relative h-[150px] w-full">
          <Image
            src={product.img || "https://http2.mlstatic.com/D_NQ_NP_2X_706213-MLA76025601818_042024-F.webp"}
            alt={product.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={product.rank <= 6}
          />
        </div>
      </div>

      <a
        href={product.link}
        target="_blank"
        rel="noreferrer"
        className="block h-[44px] overflow-hidden text-sm font-semibold text-slate-700 no-underline hover:underline"
        title={product.title}
      >
        {product.title}
      </a>

<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
    Vendedor: <b className="text-slate-800">{product.sellerName || "—"}</b>
  </span>
  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
    Vendidos: <b className="text-slate-800">{product.soldText || "—"}</b>
  </span>
</div>

      <div className="mt-2 text-2xl font-extrabold text-slate-50">$ {product.price.toLocaleString("es-AR")}</div>

      <div className="mt-1 text-xs font-bold text-green-600">{product.isFull ? "⚡ FULL" : ""}</div>
    </div>
  );
}
