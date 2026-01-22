"use client";

export function StatsHeader({
  avg,
  opp,
  qty,
  full,
}: {
  avg: number | null;
  opp: "ALTA" | "BAJA" | "-";
  qty: number;
  full: number;
}) {
  const oppColor =
    opp === "ALTA" ? "text-green-600" : opp === "BAJA" ? "text-red-600" : "text-slate-400";

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 md:grid-cols-4 md:gap-5 md:px-10">
      <StatBox label="Precio Promedio" value={avg === null ? "-" : `$${Math.floor(avg).toLocaleString("es-AR")}`} />
      <StatBox label="Oportunidad" value={opp} valueClassName={oppColor} />
      <StatBox label="Competidores" value={qty.toString()} />
      <StatBox label="Logística Full" value={full.toString()} />
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={["mt-1 text-lg font-extrabold text-meliBlue", valueClassName || ""].join(" ")}>{value}</div>
    </div>
  );
}
