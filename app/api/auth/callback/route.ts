import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const redirectUri = process.env.MELI_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: "Faltan MELI_CLIENT_ID / MELI_CLIENT_SECRET / MELI_REDIRECT_URI." },
      { status: 500 }
    );
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: "Falta el parámetro code (OAuth)." }, { status: 400 });
  }

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("code", code);
  body.set("redirect_uri", redirectUri);

  const r = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await r.json().catch(() => null);

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: "No se pudo obtener token desde MercadoLibre.", status: r.status, detail: data },
      { status: 502 }
    );
  }

  const refresh = (data as any)?.refresh_token || "";
  const userId = (data as any)?.user_id || "";

  const html = `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Analista MeLI - OAuth OK</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; padding:24px; max-width:900px; margin:0 auto; line-height:1.4}
    code,pre{background:#f1f5f9; padding:10px; border-radius:8px; display:block; overflow:auto}
    .ok{color:#16a34a; font-weight:800}
    .warn{color:#b45309}
  </style>
</head>
<body>
  <h1 class="ok">OAuth listo</h1>
  <p>Copiá el <b>refresh_token</b> y pegalo en tu <code>.env.local</code> (local) o en Vercel (Environment Variables).</p>

  <h3>Refresh Token</h3>
  <pre>${escapeHtml(refresh)}</pre>

  <h3>Variables</h3>
  <pre>MELI_REFRESH_TOKEN=${escapeHtml(refresh)}
MELI_SITE_ID=${escapeHtml(process.env.MELI_SITE_ID || "MLA")}</pre>

  <p class="warn"><b>Importante:</b> no publiques tokens en GitHub.</p>

  <h3>Debug</h3>
  <pre>user_id: ${escapeHtml(String(userId))}
state: ${escapeHtml(String(state || ""))}</pre>

  <p><a href="/">Volver a la app</a></p>
</body>
</html>`;

  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
