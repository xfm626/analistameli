"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { productsToCsv } from "@/lib/csv";
import { ProductCard } from "@/components/ProductCard";
import { Sidebar } from "@/components/Sidebar";
import { StatsHeader } from "@/components/StatsHeader";

type ApiResp =
  | { ok: true; q: string; products: Product[]; source: string; url: string }
  | { ok: false; error: string; status?: number; detail?: string; url?: string };

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDiag, setErrorDiag] = useState<string | null>(null);

  const [originalData, setOriginalData] = useState<Product[]>([]);
  const [visibleData, setVisibleData] = useState<Product[]>([]);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const compareList = useMemo(
    () => compareIds.map((id) => originalData.find((p) => p.id === id)).filter(Boolean) as Product[],
    [compareIds, originalData]
  );

  const [maxPrice, setMaxPrice] = useState<string>("");
  const [topN, setTopN] = useState<10 | 20 | 100 | 0>(20); // 0 = ver todo

const [theme, setTheme] = useState<"light" | "dark">("light");

useEffect(() => {
  const saved = window.localStorage.getItem("theme") as "light" | "dark" | null;
  const initial =
    saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(initial);
  document.documentElement.classList.toggle("dark", initial === "dark");
}, []);

function toggleTheme() {
  setTheme((prev) => {
    const next = prev === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    return next;
  });
}

  const stats = useMemo(() => {
    if (originalData.length === 0) return { avg: null as number | null, opp: "-" as const, qty: 0, full: 0 };
    const prices = originalData.map((p) => p.price).filter((x) => Number.isFinite(x));
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const opp = (max - min) / avg > 1 ? ("ALTA" as const) : ("BAJA" as const);
    const full = originalData.filter((p) => p.isFull).length;
    return { avg, opp, qty: originalData.length, full };
  }, [originalData]);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setErrorDiag(null);

    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${topN}`);
      const data = (await r.json()) as ApiResp;

      if (!data.ok) {
        setError(data.error || "Error desconocido");
        const diag = [data.status ? `status: ${data.status}` : null, data.url ? `url: ${data.url}` : null, data.detail ? `detail: ${data.detail}` : null]
          .filter(Boolean)
          .join("\n");
        setErrorDiag(diag || null);
        setOriginalData([]);
        setVisibleData([]);
        setCompareIds([]);
        return;
      }

      setOriginalData(data.products);
      setVisibleData(data.products);
      setCompareIds([]);
    } catch (e: any) {
      setError(e?.message || "Error de red");
      setErrorDiag(e?.stack || null);
      setOriginalData([]);
      setVisibleData([]);
      setCompareIds([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        alert("Máximo 3 productos para comparar.");
        return prev;
      }
      return [...prev, id];
    });
  }

  function applyFilters() {
    const max = maxPrice.trim() ? Number(maxPrice) : Infinity;
    if (!Number.isFinite(max)) return;
    setVisibleData(originalData.filter((p) => p.price <= max));
  }

  function exportCsv() {
    if (originalData.length === 0) return;
    const csv = productsToCsv(originalData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analisis_profesional.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") runSearch();
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 bg-meliBlue px-4 py-4 text-white md:px-10">
        <div className="text-base font-extrabold md:text-lg">Analista MeLI</div>

        <div className="mx-auto hidden max-w-xl flex-1 items-center gap-2 md:flex">
          <label htmlFor="qDesktop" className="sr-only">Buscar</label>
          <input
            id="qDesktop"
            name="qDesktop"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Analizar mercado (scraping HTML)... (ej: auricular)"
            className="w-full rounded-full border-0 bg-white px-5 py-2 text-sm text-slate-900 outline-none"
          />
          <select
      aria-label="Top"
      value={topN}
      onChange={(e) => setTopN(Number(e.target.value) as any)}
      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      title="Cantidad de resultados"
    >
      <option value={10}>Top 10</option>
      <option value={20}>Top 20</option>
      <option value={100}>Top 100</option>
      <option value={0}>Ver todo</option>
    </select>

<button
            type="button"
            onClick={runSearch}
            className="rounded-full bg-meliYellow px-4 py-2 text-sm font-extrabold text-meliBlue hover:opacity-95"
          >
            GO
          </button>
        </div>

        <button
  type="button"
  onClick={toggleTheme}
  className="ml-auto hidden rounded-lg border border-white/60 px-3 py-2 text-sm font-bold hover:bg-white/10 md:inline-flex"
  title="Cambiar modo"
>
  {theme === "dark" ? "☀️ Día" : "🌙 Noche"}
</button>

<button
  type="button"
  onClick={toggleTheme}
  className="mr-2 inline-flex rounded-lg border border-white/60 px-3 py-2 text-sm font-bold hover:bg-white/10 md:hidden"
  title="Cambiar modo"
>
  {theme === "dark" ? "☀️" : "🌙"}
</button>

<button
  type="button"
  onClick={() => setSidebarOpen(true)}
  className="ml-auto rounded-lg border border-white/60 px-3 py-2 text-sm font-bold hover:bg-white/10 md:hidden"
>
  Panel
</button>
      </header>

      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="flex gap-2">
          <label htmlFor="qMobile" className="sr-only">Buscar</label>
          <input
            id="qMobile"
            name="qMobile"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Analizar..."
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400"
          />
          <select
      aria-label="Top"
      value={topN}
      onChange={(e) => setTopN(Number(e.target.value) as any)}
      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      title="Cantidad de resultados"
    >
      <option value={10}>Top 10</option>
      <option value={20}>Top 20</option>
      <option value={100}>Top 100</option>
      <option value={0}>Ver todo</option>
    </select>

<select
            aria-label="Top"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value) as any)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            title="Cantidad de resultados"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={100}>Top 100</option>
            <option value={0}>Ver todo</option>
          </select>

<button
            type="button"
            onClick={runSearch}
            className="rounded-full bg-meliYellow px-4 py-2 text-sm font-extrabold text-meliBlue hover:opacity-95"
          >
            GO
          </button>
        </div>
      </div>

      <main className="mx-auto flex h-[calc(100vh-64px)] max-w-[1400px] overflow-hidden">
        <aside className="hidden w-[360px] md:block">
          <Sidebar compareList={compareList} maxPrice={maxPrice} setMaxPrice={setMaxPrice} onApplyFilters={applyFilters} onExportCsv={exportCsv} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <StatsHeader avg={stats.avg} opp={stats.opp} qty={stats.qty} full={stats.full} />

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="font-bold">{error}</div>
                {errorDiag && <div className="mt-2 whitespace-pre-wrap text-xs text-red-700/90">{errorDiag}</div>}
                <div className="mt-2 text-xs text-red-700/90">
                  Nota: este modo hace scraping del HTML. Si MercadoLibre bloquea requests server-side (anti-bot), la extracción puede fallar.
                </div>
              </div>
            )}

            {loading && (
  <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
      <div className="h-1 w-1/2 animate-pulse bg-meliBlue" />
    </div>
    <div className="p-4 text-sm text-slate-600">Cargando resultados…</div>
  </div>
)}

            {!loading && originalData.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-lg font-extrabold text-slate-900">Modo scraping (sin API)</div>
                <p className="mt-2 text-sm text-slate-600">
                  Esta versión obtiene el HTML del listado de MercadoLibre y extrae productos en el servidor. Es más frágil que Tampermonkey porque MercadoLibre puede aplicar medidas anti-bot a requests server-side.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Sugerencia: probá consultas simples como <b>auricular</b>, <b>mouse</b>, <b>termo</b>.
                </p>
              </div>
            )}

            {visibleData.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleData.map((p) => (
                  <ProductCard key={p.id} product={p} isCompared={compareIds.includes(p.id)} onToggleCompare={toggleCompare} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[90vw] max-w-[380px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div className="font-extrabold text-meliBlue">Panel</div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700"
              >
                Cerrar
              </button>
            </div>
            <div className="h-[calc(100vh-57px)]">
              <Sidebar
                compareList={compareList}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                onApplyFilters={() => {
                  applyFilters();
                  setSidebarOpen(false);
                }}
                onExportCsv={exportCsv}
              />
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
  Scraping HTML server-side (sin API oficial). Puede fallar si MercadoLibre bloquea requests automatizados. Creado por XMF 2026.
</footer>
    </div>
  );
}
