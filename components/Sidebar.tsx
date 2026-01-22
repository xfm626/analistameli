"use client";

import { Product } from "@/lib/types";

export function Sidebar({
  compareList,
  maxPrice,
  setMaxPrice,
  onApplyFilters,
  onExportCsv,
}: {
  compareList: Product[];
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  onApplyFilters: () => void;
  onExportCsv: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <Section title="⚖️ Comparador">
        <div className="space-y-2">
          {compareList.length === 0 ? (
            <HintCard>Hacé clic en el ⚖️ de un producto para comparar.</HintCard>
          ) : (
            compareList.map((p) => (
              <div key={p.id} className="rounded-lg border border-meliBlue bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-800 dark:text-slate-100" title={p.title}>
                  {p.title.length > 40 ? p.title.slice(0, 40) + "…" : p.title}
                </div>
                <div className="mt-1 text-sm font-extrabold text-meliBlue">$ {p.price.toLocaleString("es-AR")}</div>
              </div>
            ))
          )}
          {compareList.length > 0 && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full rounded-lg bg-meliBlue px-4 py-3 text-sm font-bold text-white hover:opacity-95"
            >
              Analizar selección
            </button>
          )}
        </div>
      </Section>

      <Section title="🛠️ Filtros avanzados">
        <label htmlFor="maxPrice" className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          Precio máximo
        </label>
        <input
          id="maxPrice"
          name="maxPrice"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          type="number"
          inputMode="numeric"
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="Ej: 50000"
        />
        <button
          type="button"
          onClick={onApplyFilters}
          className="mt-3 w-full rounded-lg bg-meliBlue px-4 py-3 text-sm font-bold text-white hover:opacity-95"
        >
          Aplicar filtros
        </button>
      </Section>

      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={onExportCsv}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:opacity-95"
        >
          📥 Exportar data CSV
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-900 p-4">
      <div className="font-extrabold text-meliBlue">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function HintCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-500">
      {children}
    </div>
  );
}
